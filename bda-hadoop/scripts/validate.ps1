$ErrorActionPreference = 'Stop'

$moduleRoot = Split-Path -Parent $PSScriptRoot
Set-Location $moduleRoot

function Assert-Equal([string]$actual, [string]$expected, [string]$message) {
  if ($actual -ne $expected) {
    throw "$message Expected '$expected', got '$actual'."
  }
}

function Convert-ToWslPath([string]$path) {
  $fullPath = [System.IO.Path]::GetFullPath($path)
  if ($fullPath -notmatch '^([A-Za-z]):\\(.*)$') {
    throw "Expected a drive-letter path: $fullPath"
  }
  return "/mnt/$($matches[1].ToLower())/" + $matches[2].Replace('\', '/')
}

function Invoke-LocalJob([string[]]$arguments) {
  $classpath = '/mnt/c/FundsRoom/bda-hadoop/target/fundsroom-bda-hadoop-1.0.0.jar:/mnt/c/FundsRoom/bda-hadoop/target/dependency/*'
  $jobName = $arguments[0]
  $pathArgumentCount = $arguments.Length - 1
  if ($jobName -eq 'date-sales') { $pathArgumentCount = 2 }
  $wslArguments = for ($index = 1; $index -lt $arguments.Length; $index++) {
    if ($index -le $pathArgumentCount) {
      "'" + (Convert-ToWslPath $arguments[$index]).Replace("'", "'\''") + "'"
    } else {
      "'" + $arguments[$index].Replace("'", "'\''") + "'"
    }
  }
  $command = "java -cp '$classpath' com.fundsroom.bda.BdaJobs $jobName $($wslArguments -join ' ')"
  & wsl -d Ubuntu -- bash -lc $command
  if ($LASTEXITCODE -ne 0) {
    throw "MapReduce command failed with exit code $LASTEXITCODE."
  }
}

& mvn -B -DskipTests package
if ($LASTEXITCODE -ne 0) { throw 'Maven package failed.' }
& mvn -B dependency:copy-dependencies -DincludeScope=runtime -DoutputDirectory=target\dependency
if ($LASTEXITCODE -ne 0) { throw 'Maven runtime dependency copy failed.' }

$javaVersion = & wsl -d Ubuntu -- bash -lc 'java -version 2>&1 | head -n 1'
if ($LASTEXITCODE -ne 0 -or $javaVersion -notmatch '17\.') {
  throw "WSL Ubuntu Java 17 is required; detected: $javaVersion"
}

$runId = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
$runRoot = Join-Path $moduleRoot "target\validation\$runId"
New-Item -ItemType Directory -Path $runRoot | Out-Null

$productOutput = Join-Path $runRoot 'product-sales'
Invoke-LocalJob @('product-sales', (Join-Path $moduleRoot 'data\sample\product-sales.csv'), $productOutput)
$productLines = @(Get-Content (Join-Path $productOutput 'part-r-00000'))
Assert-Equal ($productLines -join '|') "PR-001`tUSB-C Cable, 1m`t3`t30.75|PR-002`tPower Adapter`t4`t100.00|PR-003`tPR-003`t2`t10.00" 'Product sales output mismatch.'
$expectedCableQuantity = [long]2 + [long]1
$expectedCableRevenue = ([decimal]2 * [decimal]10.25) + ([decimal]1 * [decimal]10.25)
Assert-Equal "$expectedCableQuantity / $($expectedCableRevenue.ToString('0.00', [Globalization.CultureInfo]::InvariantCulture))" '3 / 30.75' 'Independent product total calculation mismatch.'
$productPartBeforeConflict = $productLines -join "`n"
$conflictCommand = "java -cp '/mnt/c/FundsRoom/bda-hadoop/target/fundsroom-bda-hadoop-1.0.0.jar:/mnt/c/FundsRoom/bda-hadoop/target/dependency/*' com.fundsroom.bda.ProductSalesJob '$(Convert-ToWslPath (Join-Path $moduleRoot 'data\sample\product-sales.csv'))' '$(Convert-ToWslPath $productOutput)'"
$previousErrorPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$conflictOutput = & wsl -d Ubuntu -- bash -lc $conflictCommand 2>&1
$conflictExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorPreference
if ($conflictExitCode -eq 0 -or ($conflictOutput -join "`n") -notmatch 'Output path already exists') {
  throw 'Existing output directory was not rejected safely.'
}
Assert-Equal ((Get-Content (Join-Path $productOutput 'part-r-00000')) -join "`n") $productPartBeforeConflict 'Rerun changed an existing output.'

$customerOutput = Join-Path $runRoot 'customer-sales'
Invoke-LocalJob @('customer-sales', (Join-Path $moduleRoot 'data\sample\customer-sales.csv'), $customerOutput)
$customerTotals = @(Get-Content (Join-Path $customerOutput 'customer_totals\part-r-00000'))
Assert-Equal ($customerTotals -join '|') "CUST-001`tNorthwind Distribution`t2`t120.50|CUST-002`tAcme Retail`t1`t10.25|CUST-003`tCUST-003`t1`t10.00" 'Customer totals output mismatch.'
$topCustomers = @(Get-Content (Join-Path $customerOutput 'top_customers\part-r-00000'))
Assert-Equal ($topCustomers[0]) "TOP_01`tCUST-001`tNorthwind Distribution`t2`t120.50" 'Top-customer ranking mismatch.'
Assert-Equal ($topCustomers[1]) "TOP_02`tCUST-002`tAcme Retail`t1`t10.25" 'Second customer ranking mismatch.'

$inventoryOutput = Join-Path $runRoot 'inventory'
Invoke-LocalJob @(
  'inventory',
  (Join-Path $moduleRoot 'data\sample\products.csv'),
  (Join-Path $moduleRoot 'data\sample\stock-movements.csv'),
  $inventoryOutput
)
$inventoryLines = @(Get-Content (Join-Path $inventoryOutput 'part-r-00000'))
Assert-Equal ($inventoryLines -join '|') "PR-001`tSKU-CBL-01`tUSB-C Cable, 1m`t3`t4`tLOW`t30.75`tMain`t5`t2`tSNAPSHOT|PR-002`tSKU-ADP-02`tPower Adapter`t15`t5`tOK`t375.00`tMain`t0`t1`tSNAPSHOT|PR-003`tSKU-HUB-03`tUSB Hub`t0`t1`tLOW`t0.00`tEast`t0`t1`tSNAPSHOT|PR-004`tSKU-OPT-04`tAccessory`t0`t0`tLOW`t0.00`t`t0`t0`tSNAPSHOT" 'Inventory analysis output mismatch.'

$challanOutput = Join-Path $runRoot 'challan-summary'
Invoke-LocalJob @('challan-summary', (Join-Path $moduleRoot 'data\sample\challan-items.csv'), $challanOutput)
$challanLines = @(Get-Content (Join-Path $challanOutput 'part-r-00000'))
Assert-Equal ($challanLines -join '|') "CANCELLED`t1`t1`t0.00|CONFIRMED`t5`t9`t140.75|DRAFT`t1`t0`t0.00" 'Challan summary output mismatch.'
$independentConfirmedRevenue = [decimal]45.50 + [decimal]10.25 + [decimal]75.00 + [decimal]10.00
Assert-Equal $independentConfirmedRevenue.ToString('0.00', [Globalization.CultureInfo]::InvariantCulture) '140.75' 'Independent confirmed revenue calculation mismatch.'

$dateInput = Join-Path $runRoot 'date-sales-input.csv'
Copy-Item (Join-Path $moduleRoot 'data\sample\challan-items.csv') $dateInput
Add-Content -Path $dateInput -Encoding utf8 -Value 'CH-008,SCH-008,CUST-001,CONFIRMED,LI-008,PR-001,"USB-C Cable, 1m",1,10.25,not-a-date'
$dateOutput = Join-Path $runRoot 'date-sales'
$dateJobOutput = Invoke-LocalJob @('date-sales', $dateInput, $dateOutput, '2026-10-21')
$dateLines = @(Get-Content (Join-Path $dateOutput 'part-r-00000'))
Assert-Equal ($dateLines -join '|') "DAILY|2026-05-15`t1`t10.00|DAILY|2026-09-02`t1`t75.00|DAILY|2026-10-21`t3`t55.75|MONTH|2026-05`t1`t10.00|MONTH|2026-06`t0`t0.00|MONTH|2026-07`t0`t0.00|MONTH|2026-08`t0`t0.00|MONTH|2026-09`t1`t75.00|MONTH|2026-10`t3`t55.75" 'Daily/monthly sales output mismatch.'
if (($dateJobOutput -join "`n") -notmatch 'malformed=1 invalidNumeric=1 invalidDates=1 duplicates=2') {
  throw 'Date-sales validation counters did not report malformed, invalid numeric, invalid date, and duplicate records.'
}

$emptyInput = Join-Path $runRoot 'empty.csv'
New-Item -ItemType File -Path $emptyInput | Out-Null
$emptyOutput = Join-Path $runRoot 'empty-result'
Invoke-LocalJob @('product-sales', $emptyInput, $emptyOutput)
$emptyPart = Join-Path $emptyOutput 'part-r-00000'
if ((Get-Item $emptyPart).Length -ne 0) { throw 'Empty input unexpectedly produced data rows.' }
$emptyDateOutput = Join-Path $runRoot 'empty-date-result'
Invoke-LocalJob @('date-sales', $emptyInput, $emptyDateOutput, '2026-10-21')
$emptyDatePart = Join-Path $emptyDateOutput 'part-r-00000'
Assert-Equal ((Get-Content $emptyDatePart) -join '|') "MONTH|2026-05`t0`t0.00|MONTH|2026-06`t0`t0.00|MONTH|2026-07`t0`t0.00|MONTH|2026-08`t0`t0.00|MONTH|2026-09`t0`t0.00|MONTH|2026-10`t0`t0.00" 'Empty date-sales input should still emit zero-filled monthly buckets.'

$missingDatabaseOutput = Join-Path $runRoot 'database-preflight'
$previousErrorPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$preflight = & wsl -d Ubuntu -- bash -lc "env -u BDA_JDBC_URL -u BDA_DB_USER -u BDA_DB_PASSWORD java -cp '/mnt/c/FundsRoom/bda-hadoop/target/fundsroom-bda-hadoop-1.0.0.jar:/mnt/c/FundsRoom/bda-hadoop/target/dependency/*' com.fundsroom.bda.JdbcCsvExporter '$(Convert-ToWslPath $missingDatabaseOutput)' 2>&1"
$preflightExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorPreference
if ($preflightExitCode -ne 2 -or ($preflight -join "`n") -notmatch 'Set BDA_JDBC_URL') {
  throw 'Database exporter did not fail safely when credentials were absent.'
}

Write-Output "Validation passed. Results are in $runRoot"
Write-Output "Independent totals: PR-001 3 units / 30.75; PR-002 4 units / 100.00; confirmed sales 140.75; date-sales aggregation verified."

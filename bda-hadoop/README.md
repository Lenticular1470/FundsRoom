# FundsRoom BDA: Hadoop MapReduce

This standalone Java module analyzes FundsRoom challans, customers, products, and stock movements. It does not change the CRM frontend or Node.js backend and does not write to PostgreSQL. Jobs run in Hadoop local mode for development; no multi-node cluster is required.

## Implementation status

| Capability | Status |
| --- | --- |
| Product sales by product ID: confirmed units and revenue | Implemented and executed |
| Customer sales by customer ID, confirmed transaction count, top 10 | Implemented and executed |
| Inventory snapshot, low-stock flag, and separate movement totals | Implemented and executed |
| Challan count and item/revenue totals by status | Implemented and executed |
| Daily confirmed sales and six-calendar-month totals | Implemented; run through the validation script |
| PostgreSQL read-only CSV extraction | Implemented; credentialed database connection not available or tested here |
| Windows Hadoop command (`hadoop jar`) | Not usable in the installed Windows distribution because `winutils.exe` is absent |
| Local Hadoop MapReduce execution | Executed successfully via WSL Ubuntu and Java 17 |

## Architecture

`BdaJobs` dispatches to separate MapReduce jobs. Mappers validate and normalize each CSV row, then emit a business key and a compact intermediate record. Hadoop partitions and sorts by key before reducers aggregate the records and write tab-separated `part-r-00000` output.

- **Product sales:** key by product ID; deduplicate exact repeated challan-item IDs; sum units and price-times-quantity revenue.
- **Customer sales:** first job aggregates confirmed challans by customer and removes exact repeated challan IDs. A second job retains a bounded top-10 priority queue in its reducer, ranked by revenue and then customer ID.
- **Inventory:** `MultipleInputs` uses a product-snapshot mapper and a movement mapper. The reducer uses `products.current_stock` as the authoritative stock balance and separately sums `IN` and `OUT` movements. It does not reconstruct a balance from movements.
- **Challan summary:** key by challan status; deduplicate line-item IDs; count distinct challans and sum quantities. Revenue is counted only for `CONFIRMED` challans.
- **Date sales:** key confirmed challans by UTC calendar day and, for the latest six UTC calendar months, by month. Distinct challans are counted once per bucket; item amounts use checked integer-cent arithmetic. Monthly output includes zero-value months in the six-month window.

No combiner is configured. The reducers need record IDs to detect duplicate input rows; a sum-only combiner could discard that identity and make duplicate handling incorrect. All monetary arithmetic uses integer cents and checked `long` operations. Overflow fails the job rather than wrapping.

Malformed rows and invalid numeric values are reported through Hadoop counters. Jobs skip malformed rows and exclude invalid item amounts from monetary/quantity totals; the challan status and date-sales jobs still count a confirmed challan when its ID, status, and timestamp are valid. Identical duplicate records are counted and ignored. Conflicting records with the same identity fail the reducer. Headers and empty lines are ignored. CSV fields may contain commas and escaped quotes; physical newlines inside quoted fields are not supported by the line-based Hadoop input format. The database exporter replaces embedded CR/LF characters with spaces before writing its single-line CSV records.

## Prerequisites and verified environment

- Java 17 runtime for Hadoop execution.
- Java 17+ compiler; Maven compiler target is Java 17.
- Maven 3.9+.
- Hadoop 3.4.3 libraries (resolved by Maven).
- Windows PowerShell and an existing WSL Ubuntu distribution for this Windows setup.

Verified in this workspace: Maven 3.9.16 compiled with the installed Windows JDK 23 using `--release 17`; MapReduce ran under OpenJDK 17.0.20.1 in Ubuntu 24.04 WSL with Hadoop 3.4.3 libraries. Java 17 was installed in the WSL distribution only; Windows-wide Java settings were not changed.

The installed Windows Hadoop command reports Hadoop 3.4.3, but its distribution has no `bin\winutils.exe`; a real Windows local-mode job failed while creating Hadoop staging directories. Do not download an unverified native binary. The validated WSL path uses Hadoop's Java local runner and does not need `winutils.exe` or a Hadoop daemon.

## Build on Windows

From PowerShell:

```powershell
Set-Location C:\FundsRoom\bda-hadoop
mvn -B -DskipTests package
mvn -B dependency:copy-dependencies -DincludeScope=runtime -DoutputDirectory=target\dependency
```

The first build downloads dependencies from Maven Central if they are not cached. The resulting jar is `target\fundsroom-bda-hadoop-1.0.0.jar`. Runtime dependencies are copied to `target\dependency`.

## Sample CSV formats

Fictional sample records are checked in under `data\sample`. Every file has a header row.

| File | Columns |
| --- | --- |
| `product-sales.csv` | `line_item_id,challan_id,product_id,product_name,quantity,unit_price,status` |
| `customer-sales.csv` | `challan_id,customer_id,customer_name,status,total_amount` |
| `products.csv` | `product_id,sku,name,current_stock,minimum_stock,price,warehouse` |
| `stock-movements.csv` | `movement_id,product_id,movement_type,quantity,reason,created_at` |
| `challan-items.csv` | `challan_id,challan_number,customer_id,status,item_id,product_id,product_name,quantity,unit_price,created_at_utc` |

Blank product names, customer names, nullable stock values, warehouse names, and challan items are handled as optional values. Sales jobs include only confirmed challans; inventory uses the current product snapshot. A challan with no items is represented by a blank item ID in the left-join export. `created_at_utc` is an ISO-8601 timestamp with a `Z` suffix and is required by `date-sales`.

The Prisma database column is `timestamp without time zone`. The exporter treats its stored wall-clock value as UTC and formats that value with a literal `Z`; this relies on the existing data having been written in UTC. Hadoop parses timestamps as instants and uses UTC for day and month boundaries. Both daily history and the monthly six-calendar-month window are therefore UTC-based, independent of Windows/WSL local timezone. The optional as-of date is a UTC calendar date.

## Date-based sales and challan status outputs

`date-sales` consumes the complete exported `challan-items.csv`; it does not consume a paginated API response. Pass an explicit as-of date for reproducible runs, or omit it to use the current UTC date. Daily rows cover all valid confirmed-challan dates in the file. Monthly rows cover the as-of month and five preceding calendar months, including months with no sales.

Tab-separated output rows use this schema:

| Key | Values |
| --- | --- |
| `DAILY\|yyyy-MM-dd` | `confirmed_challan_count`, `revenue` |
| `MONTH\|yyyy-MM` | `confirmed_challan_count`, `revenue` |

For the included fixture and as-of date `2026-10-21`, the daily rows are May 15 (`1`, `10.00`), Sep 2 (`1`, `75.00`), and Oct 21 (`3`, `55.75`). The six monthly rows are May `1 / 10.00`, June `0 / 0.00`, July `0 / 0.00`, August `0 / 0.00`, September `1 / 75.00`, and October `3 / 55.75`.

`challan-summary` continues to consume the same complete input and produces `status, challan_count, item_quantity, confirmed_sales`. It aggregates all valid records in that CSV and is not limited by page/limit. A row with a valid challan ID/status but an invalid numeric item is counted as a challan, while that item's quantity/revenue is excluded and the invalid-numeric counter is incremented. Malformed rows without usable identifiers are skipped; inspect validation counters before treating item totals as authoritative.

## Run the jobs in Windows PowerShell

The following commands run the **actual** Hadoop local runner in WSL Java 17 with the Maven-resolved Hadoop 3.4.3 classpath. Use a new output directory for every run: jobs refuse to overwrite existing output.

```powershell
$cp = '/mnt/c/FundsRoom/bda-hadoop/target/fundsroom-bda-hadoop-1.0.0.jar:/mnt/c/FundsRoom/bda-hadoop/target/dependency/*'
$base = '/mnt/c/FundsRoom/bda-hadoop'
$run = '/mnt/c/FundsRoom/bda-hadoop/target/output/demo-20261021'

wsl -d Ubuntu -- bash -lc "java -cp '$cp' com.fundsroom.bda.BdaJobs product-sales '$base/data/sample/product-sales.csv' '$run/product-sales'"
wsl -d Ubuntu -- bash -lc "java -cp '$cp' com.fundsroom.bda.BdaJobs customer-sales '$base/data/sample/customer-sales.csv' '$run/customer-sales'"
wsl -d Ubuntu -- bash -lc "java -cp '$cp' com.fundsroom.bda.BdaJobs inventory '$base/data/sample/products.csv' '$base/data/sample/stock-movements.csv' '$run/inventory'"
wsl -d Ubuntu -- bash -lc "java -cp '$cp' com.fundsroom.bda.BdaJobs challan-summary '$base/data/sample/challan-items.csv' '$run/challan-summary'"
wsl -d Ubuntu -- bash -lc "java -cp '$cp' com.fundsroom.bda.BdaJobs date-sales '$base/data/sample/challan-items.csv' '$run/date-sales' 2026-10-21"
```

Replace the example run identifier with a fresh name before rerunning. Output is plain tab-separated text in `part-r-00000`; customer sales creates `customer_totals` and `top_customers` subdirectories beneath its output directory. Hadoop also writes its normal `_SUCCESS` marker. If an output already exists, choose a different path; the jobs never remove it.

To build and run every job plus the empty-input and safe database-preflight checks:

```powershell
Set-Location C:\FundsRoom\bda-hadoop
.\scripts\validate.ps1
```

The script makes uniquely named files below the ignored `target\validation` directory. It checks the exact outputs, exercises malformed/duplicate/invalid-number/invalid-date and missing-optional-field inputs, independently verifies daily and six-month totals (including zero-sales months), verifies an empty file produces no data rows, and confirms a rerun does not overwrite prior output.

## Expected sample output

Product sales:

```text
PR-001  USB-C Cable, 1m  3  30.75
PR-002  Power Adapter    4  100.00
PR-003  PR-003           2  10.00
```

Customer totals and ranking:

```text
CUST-001  Northwind Distribution  2  120.50
CUST-002  Acme Retail              1  10.25
CUST-003  CUST-003                 1  10.00

TOP_01  CUST-001  Northwind Distribution  2  120.50
TOP_02  CUST-002  Acme Retail              1  10.25
TOP_03  CUST-003  CUST-003                 1  10.00
```

Inventory rows are `product_id, sku, name, current_stock, minimum_stock, low_stock, stock_value, warehouse, movement_in, movement_out, snapshot_status` (tab-separated):

```text
PR-001  SKU-CBL-01  USB-C Cable, 1m  3   4  LOW  30.75   Main  5  2  SNAPSHOT
PR-002  SKU-ADP-02  Power Adapter    15  5  OK   375.00  Main  0  1  SNAPSHOT
PR-003  SKU-HUB-03  USB Hub          0   1  LOW  0.00    East  0  1  SNAPSHOT
PR-004  SKU-OPT-04  Accessory        0   0  LOW  0.00          0  0  SNAPSHOT
```

Challan summary is `status, challan_count, item_quantity, confirmed_sales`:

```text
CANCELLED  1  1  0.00
CONFIRMED  5  9  140.75
DRAFT      1  0  0.00
```

Validation independently checks the sample aggregates. For example, product PR-001 is `2 + 1 = 3` units and `(2 + 1) * 10.25 = 30.75`; confirmed challan revenue is `45.50 + 10.25 + 75.00 + 10.00 = 140.75`. The sample deliberately repeats one line item and includes malformed and invalid numeric rows; the mapper/reducer counters show those conditions.

## Read-only PostgreSQL/Supabase extraction

The extractor queries the existing Prisma schema's `challan_items`, `challans`, `customers`, `products`, and `stock_movements` tables. Relationship joins and column names were verified against `backend\prisma\schema.prisma`. It does not read `users` or write to the database.

It exports five CSV files with the exact schemas shown above. Queries are fixed `PreparedStatement`s with no caller-provided SQL. The PostgreSQL session is configured with SSL required, JDBC read-only mode, a read-only transaction (`SET TRANSACTION READ ONLY`), and bounded fetches. Use a dedicated PostgreSQL/Supabase role with only `CONNECT`, schema `USAGE`, and `SELECT` privileges for those five tables; do not give the exporter an application-owner or write-capable credential.

Set credentials in the **WSL shell only**, using hidden password input. Do not put credentials in a command argument, source file, or Git:

```bash
cd /mnt/c/FundsRoom/bda-hadoop
read -r -p "PostgreSQL JDBC URL: " BDA_JDBC_URL
read -r -p "Read-only database user: " BDA_DB_USER
read -r -s -p "Read-only database password: " BDA_DB_PASSWORD
printf '\n'
export BDA_JDBC_URL BDA_DB_USER BDA_DB_PASSWORD
java -cp 'target/fundsroom-bda-hadoop-1.0.0.jar:target/dependency/*' \
  com.fundsroom.bda.JdbcCsvExporter \
  "data/live/export-$(date -u +%Y%m%dT%H%M%SZ)"
unset BDA_JDBC_URL BDA_DB_USER BDA_DB_PASSWORD
```

Use a URL like `jdbc:postgresql://<approved-host>:5432/postgres?sslmode=require`; replace the placeholder locally. Supabase connection/pooler settings and network allowlists must be configured outside this repository. The exporter refuses a missing or non-PostgreSQL URL and refuses an existing output directory. If a connection/query fails after directory creation, partial CSVs are retained for inspection; do not reuse that directory.

This environment had no database URL or BDA credentials configured, so live extraction and live-row correctness were **not tested**. The safe sample workflow and missing-credential refusal were tested. After export, pass the CSVs under `data/live` to the corresponding jobs using a new output path.

## Tests, reruns, and troubleshooting

- No standalone JUnit test framework was present. `scripts\validate.ps1` is the reproducible integration validation procedure and runs all five MapReduce workflows.
- A malformed row increments `INPUT_VALIDATION` counters and is skipped. For status/date aggregations, a confirmed challan with invalid item numerics is counted but its item amount is excluded. Check the job output for malformed, invalid numeric, invalid date, and duplicate counts.
- Identical repeated IDs are ignored after being counted. If the same line/challan/movement ID has conflicting data, the job fails rather than silently choosing a value.
- Negative/zero quantities, negative prices, invalid decimal precision, malformed CSV, and checked-integer overflow are rejected. Prices use two decimal places and cents.
- `FileAlreadyExistsException` or the explicit output-path message means the output directory exists. Do not delete it automatically; pick a fresh path or manually archive it after review.
- If `wsl` reports no Java 17 runtime, install a supported OpenJDK 17 runtime in that WSL distribution. The Windows Java installation is not changed by the documented workflow.
- Native-code fallback warnings in WSL are expected for local mode; the jobs execute using Hadoop's Java implementation.
- The Windows Hadoop distribution's `hadoop jar` path remains blocked until a trusted, compatible Windows native support setup is available. This does not block the verified WSL local workflow.

On a fresh Ubuntu WSL distribution, install the isolated runtime only if it is missing:

```powershell
wsl -d Ubuntu -u root -- apt-get update
wsl -d Ubuntu -u root -- apt-get install -y --no-install-recommends openjdk-17-jre-headless
```

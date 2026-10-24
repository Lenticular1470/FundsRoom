import { readFile } from "node:fs/promises";
import path from "node:path";

export interface BdaAnalytics {
  configured: boolean;
  available: boolean;
  message: string;
  missingOutputs: string[];
  productSales: Array<{ productId: string; name: string; units: number; revenue: number }>;
  customerSales: Array<{ customerId: string; name: string; transactions: number; revenue: number }>;
  topCustomers: Array<{ rank: string; customerId: string; name: string; transactions: number; revenue: number }>;
  inventory: Array<{
    productId: string;
    sku: string;
    name: string;
    stock: number;
    minimumStock: number;
    lowStock: boolean;
    stockValue: number;
    warehouse: string;
    movementIn: number;
    movementOut: number;
  }>;
  challanSummary: Array<{ status: string; challans: number; itemQuantity: number; confirmedSales: number }>;
  dailySales: Array<{ date: string; challans: number; revenue: number }>;
  monthlySales: Array<{ month: string; challans: number; revenue: number }>;
}

const emptyAnalytics = (configured: boolean, message: string): BdaAnalytics => ({
  configured,
  available: false,
  message,
  missingOutputs: [],
  productSales: [],
  customerSales: [],
  topCustomers: [],
  inventory: [],
  challanSummary: [],
  dailySales: [],
  monthlySales: [],
});

const readRows = async (filePath: string): Promise<string[][] | null> => {
  try {
    const content = await readFile(filePath, "utf8");
    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.split("\t"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
};

const numberField = (value: string | undefined, field: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid BDA ${field} value.`);
  return parsed;
};

export const getBdaAnalyticsService = async (): Promise<BdaAnalytics> => {
  const configuredPath = process.env.BDA_RESULTS_DIR?.trim();
  if (!configuredPath) {
    return emptyAnalytics(false, "BDA results are not configured on the backend.");
  }

  const root = path.resolve(configuredPath);
  const outputFiles = {
    productSales: "product-sales/part-r-00000",
    customerSales: "customer-sales/customer_totals/part-r-00000",
    topCustomers: "customer-sales/top_customers/part-r-00000",
    inventory: "inventory/part-r-00000",
    challanSummary: "challan-summary/part-r-00000",
    dateSales: "date-sales/part-r-00000",
  };
  const entries = await Promise.all(
    Object.entries(outputFiles).map(async ([name, relativePath]) => [
      name,
      await readRows(path.join(root, relativePath)),
    ] as const),
  );
  const rows = Object.fromEntries(entries) as Record<string, string[][] | null>;
  const missingOutputs = Object.entries(outputFiles)
    .filter(([name]) => rows[name] === null)
    .map(([, relativePath]) => relativePath);
  const dateSalesRows = rows.dateSales ?? [];

  return {
    configured: true,
    available: missingOutputs.length === 0,
    message: missingOutputs.length === 0
      ? "BDA MapReduce results loaded."
      : "BDA results are incomplete. Run the missing Hadoop jobs and refresh this dashboard.",
    missingOutputs,
    productSales: (rows.productSales ?? []).map(([productId, name, units, revenue]) => ({
      productId,
      name,
      units: numberField(units, "product units"),
      revenue: numberField(revenue, "product revenue"),
    })),
    customerSales: (rows.customerSales ?? []).map(([customerId, name, transactions, revenue]) => ({
      customerId,
      name,
      transactions: numberField(transactions, "customer transactions"),
      revenue: numberField(revenue, "customer revenue"),
    })),
    topCustomers: (rows.topCustomers ?? []).map(([rank, customerId, name, transactions, revenue]) => ({
      rank,
      customerId,
      name,
      transactions: numberField(transactions, "top-customer transactions"),
      revenue: numberField(revenue, "top-customer revenue"),
    })),
    inventory: (rows.inventory ?? []).map(([productId, sku, name, stock, minimumStock, lowStock, stockValue, warehouse, movementIn, movementOut]) => ({
      productId,
      sku,
      name,
      stock: numberField(stock, "inventory stock"),
      minimumStock: numberField(minimumStock, "minimum stock"),
      lowStock: lowStock === "LOW",
      stockValue: numberField(stockValue, "inventory value"),
      warehouse,
      movementIn: numberField(movementIn, "stock inbound movement"),
      movementOut: numberField(movementOut, "stock outbound movement"),
    })),
    challanSummary: (rows.challanSummary ?? []).map(([status, challans, itemQuantity, confirmedSales]) => ({
      status,
      challans: numberField(challans, "challan count"),
      itemQuantity: numberField(itemQuantity, "challan item quantity"),
      confirmedSales: numberField(confirmedSales, "confirmed sales"),
    })),
    dailySales: dateSalesRows
      .filter(([bucket]) => bucket?.startsWith("DAILY|"))
      .map(([bucket, challans, revenue]) => ({
        date: bucket.slice("DAILY|".length),
        challans: numberField(challans, "daily challan count"),
        revenue: numberField(revenue, "daily revenue"),
      })),
    monthlySales: dateSalesRows
      .filter(([bucket]) => bucket?.startsWith("MONTH|"))
      .map(([bucket, challans, revenue]) => ({
        month: bucket.slice("MONTH|".length),
        challans: numberField(challans, "monthly challan count"),
        revenue: numberField(revenue, "monthly revenue"),
      })),
  };
};
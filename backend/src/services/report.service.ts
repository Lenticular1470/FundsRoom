import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";

interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  warehouse?: string;
}

const createdAtFilter = (filters: ReportFilters): { gte?: Date; lte?: Date } | undefined => {
  const createdAt: { gte?: Date; lte?: Date } = {};
  if (filters.dateFrom) createdAt.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
  if (filters.dateTo) createdAt.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
  return Object.keys(createdAt).length ? createdAt : undefined;
};

const itemFilter = (filters: ReportFilters): Prisma.ChallanItemWhereInput | undefined => {
  if (!filters.category && !filters.warehouse) return undefined;
  return {
    ...(filters.category ? { category: { equals: filters.category, mode: "insensitive" } } : {}),
    ...(filters.warehouse
      ? { product: { is: { warehouse: { equals: filters.warehouse, mode: "insensitive" } } } }
      : {}),
  };
};

export const getReportsService = async (filters: ReportFilters = {}) => {
  const createdAt = createdAtFilter(filters);
  const categoryFilter = itemFilter(filters);
  const where: Prisma.ChallanWhereInput = {
    status: "CONFIRMED",
    ...(createdAt ? { createdAt } : {}),
    ...(categoryFilter ? { items: { some: categoryFilter } } : {}),
  };
  const [challans, totalCustomers, activeCustomers, pendingChallans, completedChallans] = await Promise.all([
    prisma.challan.findMany({
      where,
      include: {
        items: categoryFilter ? { where: categoryFilter } : true,
        customer: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customer.count(),
    prisma.customer.count({ where: { status: "ACTIVE" } }),
    prisma.challan.count({ where: { status: "DRAFT" } }),
    prisma.challan.count({ where: { status: "CONFIRMED" } }),
  ]);

  const totalRevenue = challans.reduce(
    (sum, challan) => sum + challan.items.reduce((lineSum, item) => lineSum + Number(item.price) * item.quantity, 0),
    0,
  );
  const totalOrders = challans.length;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const todaysSales = challans.reduce((sum, challan) => {
    if (!challan.createdAt || challan.createdAt < startOfDay) return sum;
    return sum + challan.items.reduce((lineSum, item) => lineSum + Number(item.price) * item.quantity, 0);
  }, 0);
  const monthlyRevenue = challans.reduce((sum, challan) => {
    if (!challan.createdAt || challan.createdAt < startOfMonth) return sum;
    return sum + challan.items.reduce((lineSum, item) => lineSum + Number(item.price) * item.quantity, 0);
  }, 0);

  const customerTotals = new Map<string, { name: string; businessName: string | null; orders: number; totalValue: number }>();
  const categoryTotals = new Map<string, { category: string; revenue: number; quantity: number }>();
  for (const challan of challans) {
    const customer = customerTotals.get(challan.customerId) || {
      name: challan.customer?.name || "Unknown Customer",
      businessName: challan.customer?.businessName || null,
      orders: 0,
      totalValue: 0,
    };
    const challanTotal = challan.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    customer.orders += 1;
    customer.totalValue += challanTotal;
    customerTotals.set(challan.customerId, customer);

    for (const item of challan.items) {
      const category = item.category || "General";
      const totals = categoryTotals.get(category) || { category, revenue: 0, quantity: 0 };
      totals.revenue += Number(item.price) * item.quantity;
      totals.quantity += item.quantity;
      categoryTotals.set(category, totals);
    }
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendMap = new Map<string, { month: string; revenue: number; orders: number }>();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    trendMap.set(key, { month: `${monthNames[date.getMonth()]} ${date.getFullYear()}`, revenue: 0, orders: 0 });
  }
  for (const challan of challans) {
    if (!challan.createdAt) continue;
    const key = `${challan.createdAt.getFullYear()}-${String(challan.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const month = trendMap.get(key);
    if (!month) continue;
    month.revenue += challan.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    month.orders += 1;
  }

  const topCustomers = Array.from(customerTotals.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);
  const productDistribution = Array.from(categoryTotals.values()).sort((a, b) => b.revenue - a.revenue);

  return {
    summary: {
      totalRevenue,
      totalOrders,
      activeCustomers,
      avgOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
    },
    todaysSales,
    monthlyRevenue,
    totalCustomers,
    pendingChallans,
    completedChallans,
    topCustomers,
    productDistribution,
    salesTrend: Array.from(trendMap.values()),
  };
};

export const getInventoryReportService = async (filters: ReportFilters = {}) => {
  const products = await prisma.product.findMany({
    where: {
      ...(filters.category ? { category: { equals: filters.category, mode: "insensitive" } } : {}),
      ...(filters.warehouse ? { warehouse: { equals: filters.warehouse, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  let totalStock = 0;
  let totalValue = 0;
  let lowStockCount = 0;
  const categoryMap = new Map<string, { category: string; stock: number; value: number }>();
  const mappedProducts = products.map((product) => {
    const stock = product.currentStock || 0;
    const price = Number(product.price) || 0;
    const value = stock * price;
    totalStock += stock;
    totalValue += value;
    if (stock <= (product.minimumStock || 0)) lowStockCount += 1;
    const category = product.category || "General";
    const totals = categoryMap.get(category) || { category, stock: 0, value: 0 };
    totals.stock += stock;
    totals.value += value;
    categoryMap.set(category, totals);
    return {
      sku: product.sku,
      name: product.name,
      category: product.category,
      warehouse: product.warehouse,
      stock,
      price,
      value,
      status: stock === 0 ? "OUT_OF_STOCK" : stock <= (product.minimumStock || 0) ? "LOW_STOCK" : "IN_STOCK",
    };
  });

  return {
    summary: { totalProducts: products.length, totalStock, totalValue, lowStockCount },
    categories: Array.from(categoryMap.values()),
    products: mappedProducts,
  };
};

export const getMovementsReportService = async (filters: ReportFilters = {}) => {
  const createdAt = createdAtFilter(filters);
  const movements = await prisma.stockMovement.findMany({
    where: {
      ...(createdAt ? { createdAt } : {}),
      ...(filters.category || filters.warehouse
        ? {
            product: {
              ...(filters.category ? { category: { equals: filters.category, mode: "insensitive" as const } } : {}),
              ...(filters.warehouse ? { warehouse: { equals: filters.warehouse, mode: "insensitive" as const } } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { product: true, createdBy: true },
  });

  return movements.map((movement) => ({
    id: movement.id,
    sku: movement.product?.sku || "",
    productName: movement.product?.name || "Unknown Product",
    category: movement.product?.category || "General",
    warehouse: movement.product?.warehouse || "",
    movementType: movement.movementType,
    quantity: movement.quantity,
    reason: movement.reason,
    createdBy: movement.createdBy?.name || "System",
    createdAt: movement.createdAt,
  }));
};

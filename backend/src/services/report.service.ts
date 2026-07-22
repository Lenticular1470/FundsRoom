import { prisma } from "../config/database";

export const getReportsService = async () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todayChallans,
    monthChallans,
    totalCustomers,
    pendingChallans,
    completedChallans,
    customers,
    allChallans,
  ] = await Promise.all([
    prisma.challan.findMany({
      where: { status: "CONFIRMED", createdAt: { gte: startOfDay } },
      include: { items: true },
    }),
    prisma.challan.findMany({
      where: { status: "CONFIRMED", createdAt: { gte: startOfMonth } },
      include: { items: true },
    }),
    prisma.customer.count(),
    prisma.challan.count({ where: { status: "DRAFT" } }),
    prisma.challan.count({ where: { status: "CONFIRMED" } }),
    prisma.customer.findMany({
      take: 10,
      select: { id: true, name: true, businessName: true, email: true },
    }),
    prisma.challan.findMany({
      where: { status: "CONFIRMED" },
      include: { items: true, customer: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const todaysSales = todayChallans.reduce((acc, c) => {
    return acc + c.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  }, 0);

  const monthlyRevenue = monthChallans.reduce((acc, c) => {
    return acc + c.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  }, 0);

  // Calculate top spending customers
  const customerSpendingMap: Record<string, { name: string; businessName?: string | null; orders: number; totalValue: number }> = {};

  allChallans.forEach((c) => {
    const custId = c.customerId;
    const custName = c.customer?.name || "Unknown Customer";
    const bName = c.customer?.businessName;
    const cTotal = c.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

    if (!customerSpendingMap[custId]) {
      customerSpendingMap[custId] = { name: custName, businessName: bName, orders: 0, totalValue: 0 };
    }
    customerSpendingMap[custId].orders += 1;
    customerSpendingMap[custId].totalValue += cTotal;
  });

  const topCustomers = Object.values(customerSpendingMap)
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  // Category & Product distribution
  const categoryMap: Record<string, { category: string; revenue: number; quantity: number }> = {};
  allChallans.forEach((c) => {
    c.items.forEach((item) => {
      const cat = item.category || "General";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, revenue: 0, quantity: 0 };
      }
      categoryMap[cat].revenue += Number(item.price) * item.quantity;
      categoryMap[cat].quantity += item.quantity;
    });
  });

  const productDistribution = Object.values(categoryMap);

  // Weekly & Monthly Sales Trend
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendMap: Record<string, { month: string; revenue: number; orders: number }> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trendMap[key] = { month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, revenue: 0, orders: 0 };
  }

  allChallans.forEach((c) => {
    if (!c.createdAt) return;
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (trendMap[key]) {
      const cTotal = c.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
      trendMap[key].revenue += cTotal;
      trendMap[key].orders += 1;
    }
  });

  const salesTrend = Object.values(trendMap);

  return {
    todaysSales,
    monthlyRevenue,
    totalCustomers,
    pendingChallans,
    completedChallans,
    topCustomers,
    productDistribution,
    salesTrend,
  };
};

export const getInventoryReportService = async (query: any) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" }
  });

  let totalProducts = products.length;
  let totalStock = 0;
  let totalValue = 0;
  let lowStockCount = 0;

  const categoryMap: Record<string, { category: string; stock: number; value: number }> = {};

  const mappedProducts = products.map((p) => {
    const qty = p.currentStock || 0;
    const price = Number(p.price) || 0;
    const value = qty * price;

    totalStock += qty;
    totalValue += value;

    if (qty <= (p.minimumStock || 0)) {
      lowStockCount++;
    }

    const cat = p.category || "General";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { category: cat, stock: 0, value: 0 };
    }
    categoryMap[cat].stock += qty;
    categoryMap[cat].value += value;

    return {
      sku: p.sku,
      name: p.name,
      category: p.category,
      stock: qty,
      price: price,
      value: value,
      status: qty === 0 ? "OUT_OF_STOCK" : qty <= (p.minimumStock || 0) ? "LOW_STOCK" : "IN_STOCK",
    };
  });

  return {
    summary: {
      totalProducts,
      totalStock,
      totalValue,
      lowStockCount,
    },
    categories: Object.values(categoryMap),
    products: mappedProducts,
  };
};

export const getMovementsReportService = async (query: any) => {
  const movements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
      createdBy: true,
    }
  });

  return movements.map((m) => ({
    id: m.id,
    sku: m.product?.sku || "",
    productName: m.product?.name || "Unknown Product",
    movementType: m.movementType,
    quantity: m.quantity,
    reason: m.reason,
    createdBy: m.createdBy?.name || "System",
    createdAt: m.createdAt,
  }));
};


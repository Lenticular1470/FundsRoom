import { prisma } from "../config/database";

export const getDashboardStatsService = async () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Stat Card Calculations
  const [
    todayChallans,
    monthChallans,
    todaysLeads,
    activeClients,
    followUpsCount,
    pendingChallans,
    totalCustomers,
    totalProducts,
  ] = await Promise.all([
    // Today's confirmed sales
    prisma.challan.findMany({
      where: {
        status: "CONFIRMED",
        createdAt: { gte: startOfDay },
      },
      include: { items: true },
    }),
    // Monthly confirmed sales
    prisma.challan.findMany({
      where: {
        status: "CONFIRMED",
        createdAt: { gte: startOfMonth },
      },
      include: { items: true },
    }),
    // Today's leads
    prisma.customer.count({
      where: {
        status: "LEAD",
        createdAt: { gte: startOfDay },
      },
    }),
    // Active clients
    prisma.customer.count({
      where: { status: "ACTIVE" },
    }),
    // Scheduled follow-ups (future or today)
    prisma.customer.count({
      where: {
        followUpDate: { not: null },
      },
    }),
    // Pending draft challans
    prisma.challan.count({
      where: { status: "DRAFT" },
    }),
    prisma.customer.count(),
    prisma.product.count(),
  ]);

  const todaysSalesAmount = todayChallans.reduce((acc, challan) => {
    const total = challan.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    return acc + total;
  }, 0);

  const monthlySalesAmount = monthChallans.reduce((acc, challan) => {
    const total = challan.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    return acc + total;
  }, 0);

  // 2. Upcoming Follow-ups List
  const upcomingFollowUps = await prisma.customer.findMany({
    where: {
      followUpDate: { not: null },
    },
    orderBy: { followUpDate: "asc" },
    take: 5,
    select: {
      id: true,
      name: true,
      businessName: true,
      phone: true,
      email: true,
      followUpDate: true,
      status: true,
    },
  });

  // 3. Sales Trend Data (Monthly grouping for past 6 months)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const recentConfirmedChallans = await prisma.challan.findMany({
    where: {
      status: "CONFIRMED",
      createdAt: { gte: sixMonthsAgo },
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendMap: Record<string, { label: string; revenue: number; orders: number }> = {};

  // Pre-fill last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trendMap[key] = { label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, revenue: 0, orders: 0 };
  }

  recentConfirmedChallans.forEach((challan) => {
    if (!challan.createdAt) return;
    const d = new Date(challan.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (trendMap[key]) {
      const challanTotal = challan.items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      );
      trendMap[key].revenue += challanTotal;
      trendMap[key].orders += 1;
    }
  });

  const salesTrend = Object.values(trendMap);

  return {
    todaysSales: todaysSalesAmount,
    monthlySales: monthlySalesAmount,
    todaysLeads,
    activeClients,
    followUpsCount,
    pendingChallans,
    totalCustomers,
    totalProducts,
    notificationsCount: pendingChallans + followUpsCount,
    salesTrend,
    upcomingFollowUps,
  };
};

export const getWarehouseDashboardStatsService = async () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Stats Calculations
  const [
    totalProducts,
    productsData,
    todayStockInRes,
    todayStockOutRes,
    recentMovementsRaw,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({
      select: {
        id: true,
        currentStock: true,
        minimumStock: true,
        price: true,
        warehouse: true,
      }
    }),
    prisma.stockMovement.aggregate({
      where: {
        movementType: "IN",
        createdAt: { gte: startOfDay },
      },
      _sum: { quantity: true },
    }),
    prisma.stockMovement.aggregate({
      where: {
        movementType: "OUT",
        createdAt: { gte: startOfDay },
      },
      _sum: { quantity: true },
    }),
    prisma.stockMovement.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        createdBy: true,
      }
    }),
  ]);

  let totalInventoryQuantity = 0;
  let totalInventoryValue = 0;
  let lowStockCount = 0;
  const zoneMap: Record<string, number> = {};

  productsData.forEach((p) => {
    const qty = p.currentStock || 0;
    const price = Number(p.price) || 0;
    totalInventoryQuantity += qty;
    totalInventoryValue += qty * price;

    if (qty <= (p.minimumStock || 0)) {
      lowStockCount++;
    }

    const zone = p.warehouse || "Overflow Storage";
    zoneMap[zone] = (zoneMap[zone] || 0) + qty;
  });

  const zoneStorage = Object.entries(zoneMap).map(([zone, value]) => ({
    zone,
    value,
  }));

  // Today's Stock In / Out
  const todayStockIn = todayStockInRes._sum.quantity || 0;
  const todayStockOut = todayStockOutRes._sum.quantity || 0;

  // Recent Movements
  const recentMovements = recentMovementsRaw.map((sm) => ({
    id: sm.id,
    productName: sm.product?.name || "Unknown",
    movementType: sm.movementType,
    quantity: sm.quantity,
    createdBy: sm.createdBy?.name || "System",
    createdAt: sm.createdAt,
    reason: sm.reason,
  }));

  // Stock Movement History (Last 7 Days)
  const historyMap: Record<string, { date: string; stockIn: number; stockOut: number }> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const key = d.toISOString().split("T")[0];
    historyMap[key] = { date: dateStr, stockIn: 0, stockOut: 0 };
  }

  const startOf7DaysAgo = new Date();
  startOf7DaysAgo.setDate(now.getDate() - 7);

  const last7DaysMovements = await prisma.stockMovement.findMany({
    where: {
      createdAt: { gte: startOf7DaysAgo },
    },
  });

  last7DaysMovements.forEach((sm) => {
    if (!sm.createdAt) return;
    const key = sm.createdAt.toISOString().split("T")[0];
    if (historyMap[key]) {
      if (sm.movementType === "IN") {
        historyMap[key].stockIn += sm.quantity;
      } else {
        historyMap[key].stockOut += sm.quantity;
      }
    }
  });

  const stockHistory = Object.values(historyMap);

  // Capacity Used Percentage
  // Let's assume warehouse max capacity is 5000 units for demonstration or calculated as a percentage
  const maxCapacity = 5000;
  const capacityUsedPercentage = Math.min(Math.round((totalInventoryQuantity / maxCapacity) * 100), 100);

  return {
    totalProducts,
    totalInventoryQuantity,
    totalInventoryValue,
    todayStockIn,
    todayStockOut,
    lowStockCount,
    pendingRequests: 0,
    capacityUsedPercentage,
    recentMovements,
    stockHistory,
    zoneStorage,
  };
};

export const getAccountsDashboardStatsService = async () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    confirmedChallans,
    todayConfirmedChallans,
    confirmedChallansCount,
    cancelledChallansCount,
    allCustomers,
  ] = await Promise.all([
    prisma.challan.findMany({
      where: { status: "CONFIRMED" },
      include: { items: true, customer: true },
    }),
    prisma.challan.findMany({
      where: {
        status: "CONFIRMED",
        createdAt: { gte: startOfDay },
      },
      include: { items: true },
    }),
    prisma.challan.count({ where: { status: "CONFIRMED" } }),
    prisma.challan.count({ where: { status: "CANCELLED" } }),
    prisma.customer.findMany({
      include: {
        challans: {
          where: { status: "CONFIRMED" },
          include: { items: true },
        },
      },
    }),
  ]);

  const totalConfirmedRevenue = confirmedChallans.reduce((acc, c) => {
    return acc + c.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }, 0);

  const todaysRevenue = todayConfirmedChallans.reduce((acc, c) => {
    return acc + c.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }, 0);

  // Top Billing Enterprise Clients
  const clientBillingMap: Record<string, { name: string; businessName?: string | null; totalValue: number }> = {};

  allCustomers.forEach((cust) => {
    let totalValue = 0;
    cust.challans.forEach((c) => {
      totalValue += c.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    });
    if (totalValue > 0) {
      clientBillingMap[cust.id] = {
        name: cust.name,
        businessName: cust.businessName || "Private Client",
        totalValue,
      };
    }
  });

  const topBillingClients = Object.values(clientBillingMap)
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  // Revenue & Financial Growth Trend (Monthly grouping for past 6 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendMap: Record<string, { month: string; revenue: number }> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trendMap[key] = { month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, revenue: 0 };
  }

  confirmedChallans.forEach((c) => {
    if (!c.createdAt) return;
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (trendMap[key]) {
      const total = c.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
      trendMap[key].revenue += total;
    }
  });

  const revenueTrend = Object.values(trendMap);

  return {
    totalConfirmedRevenue,
    todaysRevenue,
    confirmedChallansCount,
    cancelledChallansCount,
    topBillingClients,
    revenueTrend,
  };
};


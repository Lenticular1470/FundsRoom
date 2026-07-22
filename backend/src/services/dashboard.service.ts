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


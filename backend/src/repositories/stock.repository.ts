import { prisma } from "../config/database";

export const findStockMovements = async (options: { skip: number; take: number }) => {
  const items = await prisma.stockMovement.findMany({
    skip: options.skip,
    take: options.take,
    orderBy: { createdAt: "desc" },
    include: { product: true, createdBy: true }
  });
  const total = await prisma.stockMovement.count();
  return { items, total, page: Math.floor(options.skip / options.take) + 1, limit: options.take };
};

export const createStockMovement = async (payload: any) => prisma.stockMovement.create({ data: payload });

import { findStockMovements } from "../repositories/stock.repository";
import { prisma } from "../config/database";

export const getStockMovementsService = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;
  return findStockMovements({ skip, take: limit });
};

export const createStockMovementService = async (payload: any) => {
  if (!payload.createdById) {
    const error = new Error("Unauthorized user for stock movement.") as any;
    error.status = 401;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const stockChange = payload.movementType === "IN"
      ? { increment: payload.quantity }
      : { decrement: payload.quantity };
    const where = payload.movementType === "OUT"
      ? { id: payload.productId, currentStock: { gte: payload.quantity } }
      : { id: payload.productId };
    const updated = await tx.product.updateMany({
      where,
      data: { currentStock: stockChange, updatedAt: new Date() },
    });
    if (updated.count !== 1) {
      const product = await tx.product.findUnique({ where: { id: payload.productId }, select: { id: true } });
      const error = new Error(product ? "Insufficient stock for this movement." : "Product not found.") as any;
      error.status = product ? 400 : 404;
      throw error;
    }
    return tx.stockMovement.create({ data: payload });
  });
};

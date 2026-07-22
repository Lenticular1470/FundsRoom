import { createStockMovement, findStockMovements } from "../repositories/stock.repository";
import { findProductById, updateProductStock } from "../repositories/product.repository";

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

  const product = await findProductById(payload.productId);
  if (!product) {
    const error = new Error("Product not found.") as any;
    error.status = 404;
    throw error;
  }

  const currentStock = product.currentStock ?? 0;
  if (payload.movementType === "OUT" && currentStock - payload.quantity < 0) {
    const error = new Error("Insufficient stock for this movement.") as any;
    error.status = 400;
    throw error;
  }

  const nextStock = payload.movementType === "IN" ? currentStock + payload.quantity : currentStock - payload.quantity;

  await updateProductStock(product.id, nextStock);
  return createStockMovement(payload);
};


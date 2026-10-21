import { createChallan as createChallanRepo, deleteChallan, findChallan, findChallans } from "../repositories/challan.repository";
import { prisma } from "../config/database";
import { randomUUID } from "crypto";

export const getChallansService = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  return findChallans({
    skip,
    take: limit,
    search: query.search as string,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    category: query.category,
    warehouse: query.warehouse,
    status: query.status,
  });
};

export const getChallanByIdService = async (id: string) => {
  const challan = await findChallan(id);
  if (!challan) {
    const error = new Error("Challan not found.") as any;
    error.status = 404;
    throw error;
  }
  return challan;
};

const generateChallanNumber = () => `SCH-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

export const createChallanService = async (payload: any) => {
  const enrichedItems = await Promise.all(payload.items.map(async (item: { productId: string; quantity: number }) => {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) {
      const error = new Error(`Product not found: ${item.productId}`) as any;
      error.status = 404;
      throw error;
    }
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category || "General",
      price: Number(product.price),
      quantity: item.quantity,
    };
  }));

  return createChallanRepo({
    ...payload,
    challanNumber: generateChallanNumber(),
    status: "DRAFT",
    items: enrichedItems,
  });
};

export const confirmChallanService = async (id: string, actorId?: string) => {
  if (!actorId) {
    const error = new Error("Unauthorized user for challan confirmation.") as any;
    error.status = 401;
    throw error;
  }
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!challan) {
      const error = new Error("Challan not found.") as any;
      error.status = 404;
      throw error;
    }

    const claimed = await tx.challan.updateMany({
      where: { id, status: "DRAFT" },
      data: { status: "CONFIRMED", updatedAt: new Date() },
    });
    if (claimed.count !== 1) {
      const error = new Error("Only draft challans can be confirmed.") as any;
      error.status = 400;
      throw error;
    }

    for (const item of challan.items) {
      if (!item.productId) {
        const error = new Error(`Product reference missing for item ${item.id}.`) as any;
        error.status = 400;
        throw error;
      }
      const stockUpdate = await tx.product.updateMany({
        where: { id: item.productId, currentStock: { gte: item.quantity } },
        data: { currentStock: { decrement: item.quantity }, updatedAt: new Date() },
      });
      if (stockUpdate.count !== 1) {
        const error = new Error(`Product missing or insufficient stock for challan item ${item.id}.`) as any;
        error.status = 400;
        throw error;
      }
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: "OUT",
          reason: `Sales challan ${challan.challanNumber}`,
          createdById: actorId,
        },
      });
    }

    return tx.challan.findUnique({
      where: { id },
      include: { items: true, customer: true, createdBy: true },
    });
  });
};

export const cancelChallanService = async (id: string) => {
  const result = await prisma.challan.updateMany({
    where: { id, status: "DRAFT" },
    data: { status: "CANCELLED", updatedAt: new Date() },
  });
  if (result.count !== 1) {
    const existing = await findChallan(id);
    const error = new Error(existing ? "Only draft challans can be cancelled." : "Challan not found.") as any;
    error.status = existing ? 400 : 404;
    throw error;
  }
  return findChallan(id);
};

export const deleteChallanService = async (id: string) => {
  const result = await deleteChallan(id);
  if (result.count !== 1) {
    const existing = await findChallan(id);
    const error = new Error(existing ? "Only draft challans can be deleted." : "Challan not found.") as any;
    error.status = existing ? 400 : 404;
    throw error;
  }
  return {};
};

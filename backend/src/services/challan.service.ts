import { createChallan as createChallanRepo, deleteChallan, findChallan, findChallans, updateChallan } from "../repositories/challan.repository";
import { prisma } from "../config/database";

export const getChallansService = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;
  return findChallans({ skip, take: limit, search: query.search as string });
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

// Generate a unique challan number like SCH-2026-001
const generateChallanNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.challan.count();
  const seq = String(count + 1).padStart(3, "0");
  return `SCH-${year}-${seq}`;
};

export const createChallanService = async (payload: any) => {
  // Auto-generate challanNumber if not provided
  const challanNumber = payload.challanNumber || (await generateChallanNumber());

  // Enrich each item with product details from DB (productName, sku, category, price)
  const enrichedItems = await Promise.all(
    (payload.items || []).map(async (item: any) => {
      // If productName already provided, use it as-is
      if (item.productName && item.sku && item.price != null) {
        return item;
      }
      // Otherwise look up product by productId
      if (item.productId) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          const err = new Error(`Product not found: ${item.productId}`) as any;
          err.status = 404;
          throw err;
        }
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          category: product.category || "General",
          price: Number(product.price),
          quantity: item.quantity || 1,
        };
      }
      // Fallback: use provided data
      return item;
    })
  );

  return createChallanRepo({ ...payload, challanNumber, items: enrichedItems });
};

export const updateChallanService = async (id: string, payload: any) => {
  const challan = await findChallan(id);
  if (!challan) {
    const error = new Error("Challan not found.") as any;
    error.status = 404;
    throw error;
  }
  return updateChallan(id, payload);
};

export const confirmChallanService = async (id: string, payload: any) => {
  const challan = await findChallan(id);
  if (!challan) {
    const error = new Error("Challan not found.") as any;
    error.status = 404;
    throw error;
  }
  if (challan.status !== "DRAFT") {
    const error = new Error("Only draft challans can be confirmed.") as any;
    error.status = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    for (const item of challan.items) {
      if (!item.productId) {
        const error = new Error(`Product reference missing for item ${item.id}.`) as any;
        error.status = 400;
        throw error;
      }
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        const error = new Error(`Product not found for item ${item.id}.`) as any;
        error.status = 404;
        throw error;
      }
      const currentStock = product.currentStock ?? 0;
      if (currentStock - item.quantity < 0) {
        const error = new Error(`Insufficient stock for product ${product.name}.`) as any;
        error.status = 400;
        throw error;
      }
      await tx.product.update({ where: { id: product.id }, data: { currentStock: currentStock - item.quantity } });
    }

    return tx.challan.update({ where: { id }, data: { status: "CONFIRMED" } });
  });
};

export const deleteChallanService = async (id: string) => {
  const challan = await findChallan(id);
  if (!challan) {
    const error = new Error("Challan not found.") as any;
    error.status = 404;
    throw error;
  }
  return deleteChallan(id);
};

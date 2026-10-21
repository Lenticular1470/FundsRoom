import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";

export const findProducts = async (options: { search?: string; skip: number; take: number }) => {
  const filter = options.search
    ? {
        OR: [
          { name: { contains: options.search, mode: "insensitive" as Prisma.QueryMode } },
          { sku: { contains: options.search, mode: "insensitive" as Prisma.QueryMode } },
          { category: { contains: options.search, mode: "insensitive" as Prisma.QueryMode } }
        ]
      }
    : undefined;

  const items = await prisma.product.findMany({ where: filter, skip: options.skip, take: options.take, orderBy: { createdAt: "desc" } });
  const total = await prisma.product.count({ where: filter });
  return { items, total, page: Math.floor(options.skip / options.take) + 1, limit: options.take };
};

export const findProductById = async (id: string) => prisma.product.findUnique({ where: { id } });
export const createProduct = async (payload: any) => prisma.$transaction(async (tx) => {
  const { createdById, ...productData } = payload;
  const product = await tx.product.create({ data: productData });
  if (product.currentStock && product.currentStock > 0 && createdById) {
    await tx.stockMovement.create({
      data: {
        productId: product.id,
        quantity: product.currentStock,
        movementType: "IN",
        reason: "Initial stock on product creation",
        createdById,
      },
    });
  }
  return product;
});
export const updateProduct = async (id: string, payload: any) => prisma.product.update({ where: { id }, data: payload });
export const deleteProduct = async (id: string) => prisma.product.delete({ where: { id } });
export const updateProductStock = async (id: string, currentStock: number) => prisma.product.update({ where: { id }, data: { currentStock } });

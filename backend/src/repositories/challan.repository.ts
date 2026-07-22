import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";

export const createChallan = async (payload: any) =>
  prisma.challan.create({
    data: {
      challanNumber: payload.challanNumber,
      customerId: payload.customerId,
      createdById: payload.createdById,
      status: payload.status ?? "DRAFT",
      items: {
        create: payload.items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          category: item.category,
          price: item.price,
          quantity: item.quantity
        }))
      }
    },
    include: { items: true }
  });

export const findChallans = async (options: { search?: string; skip: number; take: number }) => {
  const filter = options.search
    ? {
        OR: [
          { challanNumber: { contains: options.search, mode: "insensitive" as Prisma.QueryMode } },
          { customer: { name: { contains: options.search, mode: "insensitive" as Prisma.QueryMode } } }
        ]
      }
    : undefined;

  const items = await prisma.challan.findMany({
    where: filter,
    skip: options.skip,
    take: options.take,
    orderBy: { createdAt: "desc" },
    include: { items: true, customer: true, createdBy: true }
  });
  const total = await prisma.challan.count({ where: filter });
  return { items, total, page: Math.floor(options.skip / options.take) + 1, limit: options.take };
};

export const findChallan = async (id: string) =>
  prisma.challan.findUnique({ where: { id }, include: { items: true, customer: true, createdBy: true } });

export const updateChallan = async (id: string, payload: any) =>
  prisma.challan.update({ where: { id }, data: payload, include: { items: true, customer: true, createdBy: true } });

export const deleteChallan = async (id: string) => prisma.challan.delete({ where: { id } });

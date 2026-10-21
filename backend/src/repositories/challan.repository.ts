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
    include: { items: true, customer: true }
  });

export const findChallans = async (options: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  warehouse?: string;
  status?: "DRAFT" | "CONFIRMED" | "CANCELLED";
  skip: number;
  take: number;
}) => {
  const createdAt: { gte?: Date; lte?: Date } = {};
  if (options.dateFrom) createdAt.gte = new Date(`${options.dateFrom}T00:00:00.000Z`);
  if (options.dateTo) createdAt.lte = new Date(`${options.dateTo}T23:59:59.999Z`);
  const filter = options.search
    ? {
        OR: [
          { challanNumber: { contains: options.search, mode: "insensitive" as Prisma.QueryMode } },
          { customer: { name: { contains: options.search, mode: "insensitive" as Prisma.QueryMode } } }
        ]
      }
    : {};
  const itemFilter: Prisma.ChallanItemWhereInput | undefined =
    options.category || options.warehouse
      ? {
          ...(options.category ? { category: { equals: options.category, mode: "insensitive" } } : {}),
          ...(options.warehouse
            ? { product: { is: { warehouse: { equals: options.warehouse, mode: "insensitive" } } } }
            : {}),
        }
      : undefined;
  const where: Prisma.ChallanWhereInput = {
    ...filter,
    ...(options.status ? { status: options.status } : {}),
    ...(Object.keys(createdAt).length ? { createdAt } : {}),
    ...(itemFilter ? { items: { some: itemFilter } } : {}),
  };

  const items = await prisma.challan.findMany({
    where,
    skip: options.skip,
    take: options.take,
    orderBy: { createdAt: "desc" },
    include: {
      items: itemFilter ? { where: itemFilter } : true,
      customer: true,
      createdBy: true,
    }
  });
  const total = await prisma.challan.count({ where });
  return {
    items,
    total,
    page: Math.floor(options.skip / options.take) + 1,
    limit: options.take,
    totalPages: Math.ceil(total / options.take) || 1,
  };
};

export const findChallan = async (id: string) =>
  prisma.challan.findUnique({ where: { id }, include: { items: true, customer: true, createdBy: true } });

export const deleteChallan = async (id: string) =>
  prisma.challan.deleteMany({ where: { id, status: "DRAFT" } });

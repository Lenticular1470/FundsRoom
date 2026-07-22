import { prisma } from "../config/database";
import { Prisma, CustomerStatus, CustomerType } from "@prisma/client";

export const findCustomers = async (options: {
  search?: string;
  status?: string;
  type?: string;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const where: Prisma.CustomerWhereInput = {};

  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { businessName: { contains: options.search, mode: "insensitive" } },
      { email: { contains: options.search, mode: "insensitive" } },
      { phone: { contains: options.search, mode: "insensitive" } },
    ];
  }

  if (options.status && options.status !== "ALL") {
    where.status = options.status as CustomerStatus;
  }

  if (options.type && options.type !== "ALL") {
    where.type = options.type as CustomerType;
  }

  const sortField = options.sortBy || "createdAt";
  const sortDirection = options.sortOrder || "desc";
  const orderBy = { [sortField]: sortDirection };

  const items = await prisma.customer.findMany({
    where,
    skip: options.skip,
    take: options.take,
    orderBy,
  });

  const total = await prisma.customer.count({ where });

  return {
    items,
    total,
    page: Math.floor(options.skip / options.take) + 1,
    limit: options.take,
    totalPages: Math.ceil(total / options.take) || 1,
  };
};

export const findCustomerById = async (id: string) => prisma.customer.findUnique({ where: { id } });
export const createCustomer = async (payload: any) =>
  prisma.customer.create({
    data: {
      name: payload.name,
      businessName: payload.businessName,
      gst: payload.gst,
      phone: payload.phone,
      email: payload.email,
      type: payload.type || "RETAIL",
      status: payload.status || "ACTIVE",
      address: payload.address,
      followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : null,
      notes: payload.notes,
      support: payload.support,
    },
  });

export const updateCustomer = async (id: string, payload: any) =>
  prisma.customer.update({
    where: { id },
    data: {
      ...payload,
      followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : payload.followUpDate === null ? null : undefined,
    },
  });

export const deleteCustomer = async (id: string) => prisma.customer.delete({ where: { id } });


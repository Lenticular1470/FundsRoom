import {
  createCustomer,
  deleteCustomer,
  findCustomerById,
  findCustomers,
  updateCustomer
} from "../repositories/customer.repository";

export const getCustomerService = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  return findCustomers({
    search: query.search as string,
    status: query.status as string,
    type: query.type as string,
    sortBy: query.sortBy as string,
    sortOrder: (query.sortOrder as "asc" | "desc") || "desc",
    skip,
    take: limit,
  });
};


export const getCustomerByIdService = async (id: string) => {
  const customer = await findCustomerById(id);
  if (!customer) {
    const error = new Error("Customer not found.") as any;
    error.status = 404;
    throw error;
  }
  return customer;
};

export const createCustomerService = async (payload: any) => createCustomer(payload);

export const updateCustomerService = async (id: string, payload: any) => {
  const customer = await findCustomerById(id);
  if (!customer) {
    const error = new Error("Customer not found.") as any;
    error.status = 404;
    throw error;
  }
  return updateCustomer(id, payload);
};

export const deleteCustomerService = async (id: string) => {
  const customer = await findCustomerById(id);
  if (!customer) {
    const error = new Error("Customer not found.") as any;
    error.status = 404;
    throw error;
  }
  return deleteCustomer(id);
};

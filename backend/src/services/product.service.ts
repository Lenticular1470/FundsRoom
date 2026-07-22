import {
  createProduct,
  deleteProduct,
  findProductById,
  findProducts,
  updateProduct
} from "../repositories/product.repository";

export const getProductService = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;
  return findProducts({ search: query.search as string, skip, take: limit });
};

export const getProductByIdService = async (id: string) => {
  const product = await findProductById(id);
  if (!product) {
    const error = new Error("Product not found.") as any;
    error.status = 404;
    throw error;
  }
  return product;
};

export const createProductService = async (payload: any) => createProduct(payload);

export const updateProductService = async (id: string, payload: any) => {
  const product = await findProductById(id);
  if (!product) {
    const error = new Error("Product not found.") as any;
    error.status = 404;
    throw error;
  }
  return updateProduct(id, payload);
};

export const deleteProductService = async (id: string) => {
  const product = await findProductById(id);
  if (!product) {
    const error = new Error("Product not found.") as any;
    error.status = 404;
    throw error;
  }
  return deleteProduct(id);
};

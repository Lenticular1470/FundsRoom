import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import {
  createProductService,
  deleteProductService,
  getProductByIdService,
  getProductService,
  updateProductService
} from "../services/product.service";

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getProductService(req.query);
    return successResponse(res, "Products fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getProductByIdService(req.params.id);
    return successResponse(res, "Product fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await createProductService(req.body);
    return successResponse(res, "Product created successfully.", data, 201);
  } catch (error) {
    return next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await updateProductService(req.params.id, req.body);
    return successResponse(res, "Product updated successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteProductService(req.params.id);
    return successResponse(res, "Product deleted successfully.", {});
  } catch (error) {
    return next(error);
  }
};

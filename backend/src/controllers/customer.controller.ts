import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import {
  createCustomerService,
  deleteCustomerService,
  getCustomerByIdService,
  getCustomerService,
  updateCustomerService
} from "../services/customer.service";

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getCustomerService(req.query);
    return successResponse(res, "Customers fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getCustomerByIdService(req.params.id);
    return successResponse(res, "Customer fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await createCustomerService(req.body);
    return successResponse(res, "Customer created successfully.", data, 201);
  } catch (error) {
    return next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await updateCustomerService(req.params.id, req.body);
    return successResponse(res, "Customer updated successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteCustomerService(req.params.id);
    return successResponse(res, "Customer deleted successfully.", {});
  } catch (error) {
    return next(error);
  }
};

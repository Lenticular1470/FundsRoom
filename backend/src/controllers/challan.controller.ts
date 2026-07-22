import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import {
  confirmChallanService,
  createChallanService,
  deleteChallanService,
  getChallanByIdService,
  getChallansService,
  updateChallanService
} from "../services/challan.service";

export const getChallans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getChallansService(req.query);
    return successResponse(res, "Challans fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const getChallanById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getChallanByIdService(req.params.id);
    return successResponse(res, "Challan fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const createChallan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const createdById = req.user?.id;
    const data = await createChallanService({ ...req.body, createdById });
    return successResponse(res, "Challan created successfully.", data, 201);
  } catch (error) {
    return next(error);
  }
};

export const updateChallan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await updateChallanService(req.params.id, req.body);
    return successResponse(res, "Challan updated successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const confirmChallan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await confirmChallanService(req.params.id, req.body);
    return successResponse(res, "Challan confirmed successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const deleteChallan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteChallanService(req.params.id);
    return successResponse(res, "Challan deleted successfully.", {});
  } catch (error) {
    return next(error);
  }
};

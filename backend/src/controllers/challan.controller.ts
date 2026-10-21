import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import {
  confirmChallanService,
  cancelChallanService,
  createChallanService,
  deleteChallanService,
  getChallanByIdService,
  getChallansService
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

export const confirmChallan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await confirmChallanService(req.params.id, req.user?.id);
    return successResponse(res, "Challan confirmed successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const cancelChallan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await cancelChallanService(req.params.id);
    return successResponse(res, "Challan cancelled successfully.", data);
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

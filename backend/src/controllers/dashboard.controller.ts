import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import { getDashboardStatsService } from "../services/dashboard.service";

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getDashboardStatsService();
    return successResponse(res, "Dashboard data fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

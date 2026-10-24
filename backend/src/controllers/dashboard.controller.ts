import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import {
  getDashboardStatsService,
  getWarehouseDashboardStatsService,
  getAccountsDashboardStatsService,
} from "../services/dashboard.service";
import { getBdaAnalyticsService } from "../services/bda.service";

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getDashboardStatsService();
    return successResponse(res, "Dashboard data fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const getWarehouseDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getWarehouseDashboardStatsService();
    return successResponse(res, "Warehouse dashboard data fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const getAccountsDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getAccountsDashboardStatsService();
    return successResponse(res, "Accounts dashboard data fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const getBdaDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getBdaAnalyticsService();
    return successResponse(res, "BDA analytics fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

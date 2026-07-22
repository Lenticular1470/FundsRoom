import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import { getReportsService, getInventoryReportService, getMovementsReportService } from "../services/report.service";

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getReportsService();
    return successResponse(res, "Reports fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const getInventoryReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getInventoryReportService(req.query);
    return successResponse(res, "Inventory report fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const getMovementsReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getMovementsReportService(req.query);
    return successResponse(res, "Movements report fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

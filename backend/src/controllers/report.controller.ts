import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import { getReportsService } from "../services/report.service";

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getReportsService();
    return successResponse(res, "Reports fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

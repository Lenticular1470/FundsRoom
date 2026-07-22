import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import { createStockMovementService, getStockMovementsService } from "../services/stock.service";

export const listStockMovements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getStockMovementsService(req.query);
    return successResponse(res, "Stock movements fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const createStockMovement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const data = await createStockMovementService({ ...req.body, createdById: userId });
    return successResponse(res, "Stock movement created successfully.", data, 201);
  } catch (error) {
    return next(error);
  }
};

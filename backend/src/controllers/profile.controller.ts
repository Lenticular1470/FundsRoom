import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import { updateProfileService, viewProfileService } from "../services/profile.service";

export const viewProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const data = await viewProfileService(userId);
    return successResponse(res, "Profile fetched successfully.", data);
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      const error: any = new Error("Unauthorized.");
      error.status = 401;
      throw error;
    }
    const data = await updateProfileService(userId, req.body);
    return successResponse(res, "Profile updated successfully.", data);
  } catch (error) {
    return next(error);
  }
};

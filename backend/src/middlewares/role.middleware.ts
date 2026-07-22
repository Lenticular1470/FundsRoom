import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response";

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return errorResponse(res, "Forbidden.", [], 403);
    }
    return next();
  };
};

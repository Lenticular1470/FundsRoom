import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { errorResponse } from "../utils/response";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return errorResponse(res, "Unauthorized access.", [], 401);
  }

  const token = authorization.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id as string, role: payload.role as string };
    return next();
  } catch (error) {
    return errorResponse(res, "Invalid token.", [], 401);
  }
};

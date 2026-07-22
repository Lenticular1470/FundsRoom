import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import { loginUser, registerUser } from "../services/auth.service";
import { viewProfileService } from "../services/profile.service";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await registerUser(req.body);
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token: result.token,
      data: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await loginUser(req.body);
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: result.token,
      data: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const data = await viewProfileService(userId);
    return successResponse(res, "User fetched.", data);
  } catch (error) {
    return next(error);
  }
};


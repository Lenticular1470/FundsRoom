import { Response } from "express";

export const successResponse = <T>(res: Response, message: string, data: T, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (res: Response, message: string, errors: unknown[] = [], status = 400) => {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
};


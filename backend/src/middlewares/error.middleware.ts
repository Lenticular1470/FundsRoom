import { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error.";
  const errors = err.errors || [];

  res.status(status).json({
    success: false,
    message,
    errors
  });
};


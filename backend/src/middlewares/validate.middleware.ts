import { AnyZodObject } from "zod";
import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response";

export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  const parseResult = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((error) => ({ path: error.path.join("."), message: error.message }));
    return errorResponse(res, "Validation failed.", errors, 400);
  }

  req.body = parseResult.data.body;
  req.params = parseResult.data.params;
  req.query = parseResult.data.query;
  return next();
};

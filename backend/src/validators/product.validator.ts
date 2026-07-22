import { z } from "zod";

const productPayload = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  currentStock: z.number().int().nonnegative().optional(),
  minimumStock: z.number().int().nonnegative().optional(),
  warehouse: z.string().optional()
});

export const createProductSchema = z.object({ body: productPayload });
export const updateProductSchema = z.object({ body: productPayload.partial() });

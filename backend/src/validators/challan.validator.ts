import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive()
});

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    items: z.array(itemSchema).min(1)
  })
});

export const updateChallanSchema = z.object({
  body: z.object({
    status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional()
  })
});

export const confirmChallanSchema = z.object({ body: z.object({}) });

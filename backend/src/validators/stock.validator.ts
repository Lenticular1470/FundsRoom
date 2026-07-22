import { z } from "zod";

export const createStockMovementSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    movementType: z.enum(["IN", "OUT"]),
    reason: z.string().min(5)
  })
});

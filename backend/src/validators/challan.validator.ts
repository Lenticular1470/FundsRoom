import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
}).strict();

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    items: z.array(itemSchema).min(1),
  }).strict(),
});

export const confirmChallanSchema = z.object({ body: z.object({}).optional() });

const reportDate = z.string().optional().refine(
  (value) => value === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)),
  "Date must use YYYY-MM-DD format",
);

export const challanListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    dateFrom: reportDate,
    dateTo: reportDate,
    category: z.string().optional(),
    warehouse: z.string().optional(),
    status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
  }),
});

import { z } from "zod";

const dateFilter = z.string().optional().refine(
  (value) => value === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)),
  "Date must use YYYY-MM-DD format",
);

export const reportFilterSchema = z.object({
  query: z.object({
    dateFrom: dateFilter,
    dateTo: dateFilter,
    category: z.string().trim().min(1).optional(),
    warehouse: z.string().trim().min(1).optional(),
  }).refine(
    ({ dateFrom, dateTo }) => !dateFrom || !dateTo || dateFrom <= dateTo,
    { message: "dateFrom must not be after dateTo", path: ["dateFrom"] },
  ),
});

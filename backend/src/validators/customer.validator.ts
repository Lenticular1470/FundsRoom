import { z } from "zod";

const customerPayload = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  businessName: z.string().optional().nullable(),
  gst: z.string().optional().nullable(),
  phone: z.string().min(3, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  type: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]).default("RETAIL"),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).default("ACTIVE"),
  address: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  support: z.string().optional().nullable(),
});

export const createCustomerSchema = z.object({ body: customerPayload });
export const updateCustomerSchema = z.object({ body: customerPayload.partial() });


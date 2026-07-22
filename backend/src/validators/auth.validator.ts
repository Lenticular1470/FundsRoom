import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Full Name is required" })
      .min(3, "Full Name must be at least 3 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .email("Must be a valid email"),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
      .regex(/[0-9]/, "Password must contain at least 1 number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character"),
    role: z.enum(["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"], {
      required_error: "Role is required",
      invalid_type_error: "Invalid role selected",
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Must be a valid email"),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Must be a valid email").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
  }),
});



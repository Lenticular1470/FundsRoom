import { Role } from "@prisma/client";
import { prisma } from "../config/database";
import { comparePassword, hashPassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";

export const registerUser = async (payload: { name: string; email: string; password: string; role: Role }) => {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const error = new Error("This email is already registered.") as any;
    error.status = 400;
    throw error;
  }

  const user = await prisma.user.create({
    data: {
      name: payload.name.trim(),
      email: normalizedEmail,
      password: await hashPassword(payload.password),
      role: payload.role || Role.ADMIN,
    },
  });

  const token = generateToken({ id: user.id, role: user.role });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
};

export const loginUser = async (payload: { email: string; password: string }) => {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    const error = new Error("Account not found") as any;
    error.status = 404;
    throw error;
  }

  const valid = await comparePassword(payload.password, user.password);
  if (!valid) {
    const error = new Error("Incorrect password") as any;
    error.status = 401;
    throw error;
  }

  const token = generateToken({ id: user.id, role: user.role });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
};


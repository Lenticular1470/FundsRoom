import { prisma } from "../config/database";
import { hashPassword } from "../utils/hash";

export const viewProfileService = async (userId?: string) => {
  if (!userId) {
    const error = new Error("Unauthorized.") as any;
    error.status = 401;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error("Profile not found.") as any;
    error.status = 404;
    throw error;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};

export const updateProfileService = async (userId: string, payload: any) => {
  if (!userId) {
    const error = new Error("Unauthorized.") as any;
    error.status = 401;
    throw error;
  }

  const data: any = {};
  if (payload.name) data.name = payload.name.trim();
  if (payload.email) data.email = payload.email.toLowerCase().trim();
  if (payload.password) data.password = await hashPassword(payload.password);

  const user = await prisma.user.update({ where: { id: userId }, data });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};


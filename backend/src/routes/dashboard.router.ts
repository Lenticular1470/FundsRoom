import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getDashboardStats } from "../controllers/dashboard.controller";

/**
 * @openapi
 * /api/dashboard:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Dashboard
 *     summary: Get dashboard statistics
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 */

const router = Router();

router.get("/", authMiddleware, getDashboardStats);

export default router;

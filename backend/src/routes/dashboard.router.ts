import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getDashboardStats, getWarehouseDashboardStats } from "../controllers/dashboard.controller";

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
 *
 * /api/dashboard/warehouse:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Dashboard
 *     summary: Get warehouse dashboard statistics
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 */

const router = Router();

router.get("/", authMiddleware, getDashboardStats);
router.get("/warehouse", authMiddleware, getWarehouseDashboardStats);

export default router;

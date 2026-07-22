import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getReports } from "../controllers/report.controller";

/**
 * @openapi
 * /api/reports:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Reports
 *     summary: Get reports
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 */

const router = Router();

router.get("/", authMiddleware, getReports);

export default router;

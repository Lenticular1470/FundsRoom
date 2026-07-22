import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getReports, getInventoryReport, getMovementsReport } from "../controllers/report.controller";

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
 *
 * /api/reports/inventory:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Reports
 *     summary: Get inventory report
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *
 * /api/reports/movements:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Reports
 *     summary: Get movements report
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 */

const router = Router();

router.get("/", authMiddleware, getReports);
router.get("/inventory", authMiddleware, getInventoryReport);
router.get("/movements", authMiddleware, getMovementsReport);

export default router;

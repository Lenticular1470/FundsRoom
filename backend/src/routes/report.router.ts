import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { getReports, getInventoryReport, getMovementsReport } from "../controllers/report.controller";
import { reportFilterSchema } from "../validators/report.validator";

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

router.get("/", authMiddleware, requireRole(["ADMIN", "SALES", "ACCOUNTS"]), validate(reportFilterSchema), getReports);
router.get("/inventory", authMiddleware, requireRole(["ADMIN", "WAREHOUSE", "ACCOUNTS"]), validate(reportFilterSchema), getInventoryReport);
router.get("/movements", authMiddleware, requireRole(["ADMIN", "WAREHOUSE", "ACCOUNTS"]), validate(reportFilterSchema), getMovementsReport);

export default router;

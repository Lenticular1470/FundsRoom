import { Router } from "express";
import { createStockMovementSchema } from "../validators/stock.validator";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createStockMovement, listStockMovements } from "../controllers/stock.controller";

/**
 * @openapi
 * /api/stock:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Stock
 *     summary: List stock movements
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Stock
 *     summary: Create stock movement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StockMovement'
 *     responses:
 *       "201":
 *         $ref: '#/components/schemas/SuccessResponse'
 */

const router = Router();

router.get("/", authMiddleware, listStockMovements);
router.post("/", authMiddleware, validate(createStockMovementSchema), createStockMovement);

export default router;

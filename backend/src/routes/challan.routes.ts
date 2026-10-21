import { Router } from "express";
import {
  confirmChallanSchema,
  challanListSchema,
  createChallanSchema,
} from "../validators/challan.validator";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import {
  confirmChallan,
  createChallan,
  cancelChallan,
  deleteChallan,
  getChallanById,
  getChallans,
} from "../controllers/challan.controller";

/**
 * @openapi
 * /api/challans:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Challans
 *     summary: List challans
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Challans
 *     summary: Create challan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Challan'
 *     responses:
 *       "201":
 *         $ref: '#/components/schemas/SuccessResponse'
 *
 * /api/challans/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Challans
 *     summary: Get challan by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Challans
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *
 * /api/challans/{id}/confirm:
 *   post:
 *     summary: Confirm challan
 *     description: Confirm a draft challan, deduct stock, and record inventory movements
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Challans
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *
 * /api/challans/{id}/cancel:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Challans
 *     summary: Cancel a draft challan
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 */

const router = Router();

router.get("/", authMiddleware, requireRole(["ADMIN", "SALES", "ACCOUNTS"]), validate(challanListSchema), getChallans);
router.get("/:id", authMiddleware, requireRole(["ADMIN", "SALES", "ACCOUNTS"]), getChallanById);
router.post("/", authMiddleware, requireRole(["ADMIN", "SALES"]), validate(createChallanSchema), createChallan);
router.post("/:id/confirm", authMiddleware, requireRole(["ADMIN", "SALES"]), validate(confirmChallanSchema), confirmChallan);
router.post("/:id/cancel", authMiddleware, requireRole(["ADMIN", "SALES"]), cancelChallan);
router.delete("/:id", authMiddleware, requireRole(["ADMIN"]), deleteChallan);

export default router;

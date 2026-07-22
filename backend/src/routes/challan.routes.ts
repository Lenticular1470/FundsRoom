import { Router } from "express";
import {
  confirmChallanSchema,
  createChallanSchema,
  updateChallanSchema
} from "../validators/challan.validator";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  confirmChallan,
  createChallan,
  deleteChallan,
  getChallanById,
  getChallans,
  updateChallan
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
 *   put:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Challans
 *     summary: Update challan
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Challan'
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *   post:
 *     summary: Confirm challan
 *     description: Confirm challan and apply stock adjustments
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
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
 */

const router = Router();

router.get("/", authMiddleware, getChallans);
router.get("/:id", authMiddleware, getChallanById);
router.post("/", authMiddleware, validate(createChallanSchema), createChallan);
router.put("/:id", authMiddleware, validate(updateChallanSchema), updateChallan);
router.post("/:id/confirm", authMiddleware, validate(confirmChallanSchema), confirmChallan);
router.delete("/:id", authMiddleware, deleteChallan);

export default router;

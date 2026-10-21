import { Router } from "express";
import { createProductSchema, updateProductSchema } from "../validators/product.validator";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct
} from "../controllers/product.controller";

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: List products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Products
 *     summary: Create product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       "201":
 *         $ref: '#/components/schemas/SuccessResponse'
 *       "400":
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product by ID
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
 *       - Products
 *     summary: Update product
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Products
 *     summary: Delete product
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

router.get("/", authMiddleware, requireRole(["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"]), getProducts);
router.get("/:id", authMiddleware, requireRole(["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"]), getProductById);
router.post("/", authMiddleware, requireRole(["ADMIN", "WAREHOUSE"]), validate(createProductSchema), createProduct);
router.put("/:id", authMiddleware, requireRole(["ADMIN", "WAREHOUSE"]), validate(updateProductSchema), updateProduct);
router.delete("/:id", authMiddleware, requireRole(["ADMIN"]), deleteProduct);

export default router;

import { Router } from "express";
import { createCustomerSchema, updateCustomerSchema } from "../validators/customer.validator";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer
} from "../controllers/customer.controller";

/**
 * @openapi
 * /api/customers:
 *   get:
 *     tags:
 *       - Customers
 *     summary: List customers
 *     description: Retrieve paginated list of customers
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
 *       "500":
 *         $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Customers
 *     summary: Create customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       "201":
 *         $ref: '#/components/schemas/SuccessResponse'
 *       "400":
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/customers/{id}:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get customer by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *       "404":
 *         $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Customers
 *     summary: Update customer
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
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *       "400":
 *         $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Customers
 *     summary: Delete customer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *       "404":
 *         $ref: '#/components/schemas/ErrorResponse'
 */

const router = Router();

router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.post("/", authMiddleware, validate(createCustomerSchema), createCustomer);
router.put("/:id", authMiddleware, validate(updateCustomerSchema), updateCustomer);
router.delete("/:id", authMiddleware, deleteCustomer);

export default router;

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { updateProfile, viewProfile } from "../controllers/profile.controller";
import { changePasswordSchema, updateProfileSchema } from "../validators/auth.validator";
import { validate } from "../middlewares/validate.middleware";
import { changePassword } from "../controllers/profile.controller";

/**
 * @openapi
 * /api/profile:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Profile
 *     summary: View current user's profile
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *   put:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Profile
 *     summary: Update current user's profile
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 *
 * /api/profile/password:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Profile
 *     summary: Change current user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 */

const router = Router();

router.get("/", authMiddleware, viewProfile);
router.put("/", authMiddleware, validate(updateProfileSchema), updateProfile);
router.put("/password", authMiddleware, validate(changePasswordSchema), changePassword);

export default router;

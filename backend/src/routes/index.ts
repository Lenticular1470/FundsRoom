import { Router } from "express";
import { successResponse } from "../utils/response";
import authRouter from "./auth.router";
import customerRouter from "./customer.routes";
import productRouter from "./product.routes";
import stockRouter from "./stock.routes";
import challanRouter from "./challan.routes";
import dashboardRouter from "./dashboard.router";
import reportRouter from "./report.router";
import profileRouter from "./profile.routes";

const router = Router();

router.get("/", (req, res) => {
  return successResponse(res, "API is running.", { status: "ok" });
});

/**
 * @openapi
 * /api/:
 *   get:
 *     tags:
 *       - Root
 *     summary: API root
 *     responses:
 *       "200":
 *         $ref: '#/components/schemas/SuccessResponse'
 */

router.use("/auth", authRouter);
router.use("/customers", customerRouter);
router.use("/products", productRouter);
router.use("/stock", stockRouter);
router.use("/challans", challanRouter);
router.use("/dashboard", dashboardRouter);
router.use("/reports", reportRouter);
router.use("/profile", profileRouter);

export default router;

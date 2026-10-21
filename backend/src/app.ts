import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares/error.middleware";
import { loggerMiddleware } from "./middlewares/logger.middleware";
import apiRouter from "./routes/index";
import { successResponse } from "./utils/response";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { env } from "./config/env";

const app = express();

const allowedOrigins = new Set([
  ...((process.env.NODE_ENV === "production") ? [] : ["http://localhost:3000"]),
  ...env.corsOrigins,
]);

app.use(cors({
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin || process.env.NODE_ENV !== "production" || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
}));
app.use(express.json());
app.use(loggerMiddleware);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

app.use("/api", apiRouter);

app.get("/", (req, res) => successResponse(res, "API is running.", { name: "FundsRoom API" }));
app.get("/health", (req, res) => successResponse(res, "OK", { uptime: process.uptime() }));

app.use(errorHandler);

export default app;

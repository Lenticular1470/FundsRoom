import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares/error.middleware";
import { loggerMiddleware } from "./middlewares/logger.middleware";
import apiRouter from "./routes/index";
import { successResponse } from "./utils/response";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();

app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

app.use("/api", apiRouter);

app.get("/", (req, res) => successResponse(res, "API is running.", { name: "FundsRoom API" }));
app.get("/health", (req, res) => successResponse(res, "OK", { uptime: process.uptime() }));

app.use(errorHandler);

export default app;


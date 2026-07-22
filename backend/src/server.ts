import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";

const server = app.listen(env.port, () => {
  console.log(`Server is running on http://localhost:${env.port}`);
});

const shutdown = async () => {
  console.log("Shutting down server...");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);


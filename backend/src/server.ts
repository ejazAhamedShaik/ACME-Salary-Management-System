import { pathToFileURL } from "node:url";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { createHealthController } from "./controllers/healthController.js";
import { createHealthRouter } from "./routes/healthRoutes.js";
import { createHealthService } from "./services/healthService.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json());

  const healthRouter = createHealthRouter(createHealthController(createHealthService()));
  app.use("/health", healthRouter);

  return app;
}

export const app = createApp();

const isEntryPoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

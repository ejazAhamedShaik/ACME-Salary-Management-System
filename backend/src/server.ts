import { pathToFileURL } from "node:url";
import cors from "cors";
import "dotenv/config";
import express from "express";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { createHealthController } from "./controllers/healthController.js";
import { createHealthRouter } from "./routes/healthRoutes.js";
import { createHealthService } from "./services/healthService.js";
import { createEmployeeController } from "./controllers/employeeController.js";
import { createEmployeeRouter } from "./routes/employeeRoutes.js";
import { createEmployeeService } from "./services/employeeService.js";
import { createEmployeeRepository } from "./repositories/employeeRepository.js";
import { createConfigController } from "./controllers/configController.js";
import { createConfigRouter } from "./routes/configRoutes.js";
import { createConfigService } from "./services/configService.js";
import { bootstrap } from "./db/bootstrap.js";

export function createApp(db: BetterSQLite3Database<Record<string, unknown>>) {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json());

  const healthRouter = createHealthRouter(createHealthController(createHealthService()));
  app.use("/health", healthRouter);

  const employeeRepository = createEmployeeRepository(db);
  const employeeService = createEmployeeService(employeeRepository);
  const employeeRouter = createEmployeeRouter(createEmployeeController(employeeService));
  app.use("/employees", employeeRouter);

  const configRouter = createConfigRouter(createConfigController(createConfigService()));
  app.use("/config", configRouter);

  return app;
}

const isEntryPoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  const { db } = await import("./db/client.js");
  bootstrap(db);

  const app = createApp(db);
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

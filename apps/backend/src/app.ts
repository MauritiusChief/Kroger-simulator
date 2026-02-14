import cors from "cors";
import express from "express";
import { inventoryRouter } from "./routes/inventoryRoutes.js";
import { folderRouter } from "./routes/folderRoutes.js";
import { tagRouter } from "./routes/tagRoutes.js";
import { scanRouter } from "./routes/scanRoutes.js";
import { metricsStore } from "./observability/metrics.js";
import { requestContextMiddleware } from "./observability/requestContext.js";
import { errorHandler, notFoundHandler } from "./domain/errors.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(requestContextMiddleware);

  app.get("/healthz", (_req, res) => {
    res.json({ status: "ok", service: "inventory-aggregation-service" });
  });
  app.get("/metrics", (_req, res) => {
    res.json(metricsStore.snapshot());
  });

  app.use("/api/inventory", inventoryRouter);
  app.use("/api/folders", folderRouter);
  app.use("/api/tags", tagRouter);
  app.use("/api/scans", scanRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

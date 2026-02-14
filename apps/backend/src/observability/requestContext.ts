import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { metricsStore } from "./metrics.js";

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  req.requestId = randomUUID();
  metricsStore.incrementRequests();
  const start = performance.now();
  res.on("finish", () => {
    const duration = Math.round((performance.now() - start) * 100) / 100;
    const log = {
      level: "info",
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      latencyMs: duration
    };
    console.log(JSON.stringify(log));
  });
  next();
}

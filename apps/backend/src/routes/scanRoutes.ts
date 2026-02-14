import { Router } from "express";
import { resolveScan } from "../domain/scanService.js";

export const scanRouter = Router();

scanRouter.post("/resolve", (req, res) => {
  const payload = String(req.body.payload ?? "");
  const result = resolveScan(payload);
  res.json(result);
});

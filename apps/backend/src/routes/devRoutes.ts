import { Router } from "express";
import { resetMockState } from "../mocks/state.js";

export const devRouter = Router();

devRouter.post("/reset", (_req, res) => {
  resetMockState();
  res.status(204).send();
});

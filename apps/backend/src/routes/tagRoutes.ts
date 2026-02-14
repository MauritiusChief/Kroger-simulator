import { Router } from "express";
import { applyTags, listTags } from "../domain/tagService.js";

export const tagRouter = Router();

tagRouter.get("/", (_req, res) => {
  res.json(listTags());
});

tagRouter.post("/apply", (req, res, next) => {
  try {
    const result = applyTags(req.body.itemIds ?? [], req.body.tagIds ?? []);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

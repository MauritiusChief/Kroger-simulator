import { Router } from "express";
import { createFolder, listFolders, updateFolder } from "../domain/folderService.js";

export const folderRouter = Router();

folderRouter.get("/", (_req, res) => {
  res.json(listFolders());
});

folderRouter.post("/", (req, res, next) => {
  try {
    const folder = createFolder(req.body.name ?? "", req.body.parentId ?? null);
    res.status(201).json(folder);
  } catch (error) {
    next(error);
  }
});

folderRouter.patch("/:id", (req, res, next) => {
  try {
    const folder = updateFolder(req.params.id, {
      name: req.body.name,
      parentId: req.body.parentId,
      permission: req.body.permission
    });
    res.json(folder);
  } catch (error) {
    next(error);
  }
});

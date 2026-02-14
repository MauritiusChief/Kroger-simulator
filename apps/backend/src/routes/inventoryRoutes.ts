import { Router } from "express";
import { getInventoryItemDetail, listInventory } from "../domain/inventoryService.js";

export const inventoryRouter = Router();

inventoryRouter.get("/items", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? "1");
    const pageSize = Number(req.query.pageSize ?? "10");
    const keyword = typeof req.query.keyword === "string" ? req.query.keyword : undefined;
    const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
    const folder = typeof req.query.folder === "string" ? req.query.folder : undefined;
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const data = await listInventory({
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10,
      keyword,
      tag,
      folder,
      sort: sort === "name" || sort === "stock" || sort === "sales" ? sort : undefined
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

inventoryRouter.get("/items/:id", async (req, res, next) => {
  try {
    const data = await getInventoryItemDetail(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

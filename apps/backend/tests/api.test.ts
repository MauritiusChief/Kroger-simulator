import request from "supertest";
import { createApp } from "../src/app.js";

describe("Inventory aggregation API", () => {
  const app = createApp();

  it("lists items with pagination and filtering", async () => {
    const response = await request(app)
      .get("/api/inventory/items")
      .query({ page: 1, pageSize: 2, sort: "sales", keyword: "organic" })
      .expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(2);
    expect(response.body.total).toBe(1);
    expect(response.body.data[0].id).toBe("item-1003");
  });

  it("returns item detail with normalized fields", async () => {
    const response = await request(app).get("/api/inventory/items/item-1001").expect(200);
    expect(response.body.id).toBe("item-1001");
    expect(Array.isArray(response.body.stores)).toBe(true);
    expect(Array.isArray(response.body.trends7d)).toBe(true);
    expect(Array.isArray(response.body.alerts)).toBe(true);
  });

  it("prevents folder move cycles", async () => {
    await request(app).patch("/api/folders/folder-root-1").send({ parentId: "folder-child-1" }).expect(400);
  });

  it("resolves UPC/EAN/QR scans and handles unresolved payload", async () => {
    const upc = await request(app).post("/api/scans/resolve").send({ payload: "041303120001" }).expect(200);
    expect(upc.body.status).toBe("resolved");
    expect(upc.body.itemId).toBe("item-1001");

    const ean = await request(app).post("/api/scans/resolve").send({ payload: "5901234123457" }).expect(200);
    expect(ean.body.status).toBe("resolved");
    expect(ean.body.itemId).toBe("item-1003");

    const qr = await request(app).post("/api/scans/resolve").send({ payload: "QR:ITEM:item-1002" }).expect(200);
    expect(qr.body.status).toBe("resolved");
    expect(qr.body.itemId).toBe("item-1002");

    const unknown = await request(app).post("/api/scans/resolve").send({ payload: "999999999999" }).expect(200);
    expect(unknown.body.status).toBe("unresolved");
  });
});

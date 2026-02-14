import type {
  InventoryItemDetail,
  InventoryItemSummary,
  PaginatedResponse
} from "@kroger-mini/contracts";
import {
  fetchLegacyInventory,
  fetchLegacyProduct,
  fetchLegacyStoreStock,
  fetchLegacyTrends30,
  fetchLegacyTrends7
} from "../mocks/legacyApis.js";
import { HttpError } from "./errors.js";
import { metricsStore } from "../observability/metrics.js";

function normalizeItem(record: Awaited<ReturnType<typeof fetchLegacyInventory>>[number]): InventoryItemSummary {
  return {
    id: record.item_id,
    name: record.title,
    category: record.category_name,
    sku: record.sku_code,
    folderId: record.folder_ref,
    tags: record.labels,
    currentStock: record.on_hand_qty,
    sales7d: record.sold_7d,
    sales30d: record.sold_30d
  };
}

type ListParams = {
  page: number;
  pageSize: number;
  keyword?: string;
  tag?: string;
  folder?: string;
  sort?: "name" | "stock" | "sales";
};

export async function listInventory(params: ListParams): Promise<PaginatedResponse<InventoryItemSummary>> {
  const start = performance.now();
  const records = await fetchLegacyInventory();
  let items = records.map(normalizeItem);

  if (params.keyword) {
    const q = params.keyword.toLowerCase();
    items = items.filter((item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q));
  }
  if (params.tag) {
    items = items.filter((item) => item.tags.includes(params.tag!));
  }
  if (params.folder) {
    items = items.filter((item) => item.folderId === params.folder);
  }

  if (params.sort === "name") {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else if (params.sort === "stock") {
    items.sort((a, b) => b.currentStock - a.currentStock);
  } else if (params.sort === "sales") {
    items.sort((a, b) => b.sales30d - a.sales30d);
  }

  const total = items.length;
  const startIndex = (params.page - 1) * params.pageSize;
  const paged = items.slice(startIndex, startIndex + params.pageSize);
  metricsStore.recordAggregationLatency(Math.round((performance.now() - start) * 100) / 100);

  return {
    data: paged,
    page: params.page,
    pageSize: params.pageSize,
    total
  };
}

export async function getInventoryItemDetail(itemId: string): Promise<InventoryItemDetail> {
  const start = performance.now();
  const records = await fetchLegacyInventory();
  const base = records.find((record) => record.item_id === itemId);
  if (!base) {
    throw new HttpError(404, "ITEM_NOT_FOUND", `Item not found: ${itemId}`);
  }

  const [product, stores, trends7, trends30] = await Promise.all([
    fetchLegacyProduct(itemId),
    fetchLegacyStoreStock(itemId),
    fetchLegacyTrends7(itemId),
    fetchLegacyTrends30(itemId)
  ]);
  if (!product) {
    throw new HttpError(404, "ITEM_NOT_FOUND", `Item metadata not found: ${itemId}`);
  }

  metricsStore.recordAggregationLatency(Math.round((performance.now() - start) * 100) / 100);
  return {
    ...normalizeItem(base),
    description: product.product_desc,
    stores: stores.map((store) => ({
      storeId: store.id,
      storeName: store.store_name,
      onHand: store.in_stock,
      reserved: store.held
    })),
    trends7d: trends7.map((point) => ({ date: point.d, value: point.units })),
    trends30d: trends30.map((point) => ({ date: point.d, value: point.units })),
    alerts: product.warnings.map((warning) => ({
      id: warning.warning_id,
      severity: warning.warning_level,
      message: warning.text
    }))
  };
}

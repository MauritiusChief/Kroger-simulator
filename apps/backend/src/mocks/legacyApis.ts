import {
  inventoryEntities,
  storeStockSeed,
  trends30Seed,
  trends7Seed
} from "./state.js";

export interface LegacyInventoryRecord {
  item_id: string;
  title: string;
  category_name: string;
  sku_code: string;
  folder_ref: string | null;
  labels: string[];
  on_hand_qty: number;
  sold_7d: number;
  sold_30d: number;
}

export interface LegacyProductRecord {
  itemRef: string;
  product_desc: string;
  upc_code: string;
  ean_code: string;
  qr_payload: string;
  warnings: { warning_id: string; warning_level: "low" | "medium" | "high"; text: string }[];
}

export async function fetchLegacyInventory(): Promise<LegacyInventoryRecord[]> {
  return inventoryEntities.map((item) => ({
    item_id: item.id,
    title: item.name,
    category_name: item.category,
    sku_code: item.sku,
    folder_ref: item.folderId,
    labels: item.tags,
    on_hand_qty: item.currentStock,
    sold_7d: item.sales7d,
    sold_30d: item.sales30d
  }));
}

export async function fetchLegacyProduct(itemId: string): Promise<LegacyProductRecord | null> {
  const item = inventoryEntities.find((entity) => entity.id === itemId);
  if (!item) {
    return null;
  }
  return {
    itemRef: item.id,
    product_desc: item.description,
    upc_code: item.barcodeUpc,
    ean_code: item.barcodeEan,
    qr_payload: item.barcodeQr,
    warnings: item.alerts.map((alert) => ({
      warning_id: alert.id,
      warning_level: alert.severity,
      text: alert.message
    }))
  };
}

export async function fetchLegacyStoreStock(itemId: string): Promise<{ id: string; store_name: string; in_stock: number; held: number }[]> {
  return storeStockSeed[itemId] ?? [];
}

export async function fetchLegacyTrends7(itemId: string): Promise<{ d: string; units: number }[]> {
  return trends7Seed[itemId] ?? [];
}

export async function fetchLegacyTrends30(itemId: string): Promise<{ d: string; units: number }[]> {
  return trends30Seed[itemId] ?? [];
}

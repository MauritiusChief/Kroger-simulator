import type { ScanResolveResponse } from "@kroger-mini/contracts";
import { inventoryEntities } from "../mocks/state.js";
import { metricsStore } from "../observability/metrics.js";

export function resolveScan(payload: string): ScanResolveResponse {
  const normalized = payload.trim();
  let itemId: string | undefined;
  if (normalized.startsWith("QR:ITEM:")) {
    itemId = normalized.split("QR:ITEM:")[1];
  } else if (/^\d{12}$/.test(normalized)) {
    itemId = inventoryEntities.find((item) => item.barcodeUpc === normalized)?.id;
  } else if (/^\d{13}$/.test(normalized)) {
    itemId = inventoryEntities.find((item) => item.barcodeEan === normalized)?.id;
  }

  if (itemId && inventoryEntities.find((item) => item.id === itemId)) {
    metricsStore.recordScan("resolved");
    return { status: "resolved", itemId };
  }
  metricsStore.recordScan("unresolved");
  return { status: "unresolved", reason: "No item mapping for payload." };
}

export type UserRole = "manager" | "associate";

export interface ApiError {
  code: string;
  message: string;
  requestId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface Alert {
  id: string;
  severity: "low" | "medium" | "high";
  message: string;
}

export interface StoreStock {
  storeId: string;
  storeName: string;
  onHand: number;
  reserved: number;
}

export interface InventoryItemSummary {
  id: string;
  name: string;
  category: string;
  sku: string;
  folderId: string | null;
  tags: string[];
  currentStock: number;
  sales7d: number;
  sales30d: number;
}

export interface InventoryItemDetail extends InventoryItemSummary {
  description: string;
  stores: StoreStock[];
  trends7d: TrendPoint[];
  trends30d: TrendPoint[];
  alerts: Alert[];
}

export interface FolderPermission {
  manager: "edit";
  associate: "read";
}

export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  permission: FolderPermission;
  children?: FolderNode[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ScanResolveRequest {
  payload: string;
}

export interface ScanResolveResponse {
  status: "resolved" | "unresolved";
  itemId?: string;
  reason?: string;
}

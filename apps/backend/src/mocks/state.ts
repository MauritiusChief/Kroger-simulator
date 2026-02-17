import type {
  FolderNode,
  InventoryItemDetail,
  Tag
} from "@kroger-mini/contracts";

const today = new Date();

function daysAgo(days: number): string {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function makeTrend(length: number, base: number): { date: string; value: number }[] {
  return Array.from({ length }, (_, index) => {
    const reverseIndex = length - index - 1;
    return {
      date: daysAgo(reverseIndex),
      value: Math.max(0, base + ((index % 5) - 2))
    };
  });
}

export interface InventoryEntity extends Omit<InventoryItemDetail, "stores" | "trends7d" | "trends30d"> {
  barcodeUpc: string;
  barcodeEan: string;
  barcodeQr: string;
}

type MutableState = {
  tags: Tag[];
  folders: FolderNode[];
  inventoryEntities: InventoryEntity[];
  storeStockSeed: Record<string, { id: string; store_name: string; in_stock: number; held: number }[]>;
  trends7Seed: Record<string, { d: string; units: number }[]>;
  trends30Seed: Record<string, { d: string; units: number }[]>;
};

function buildInitialState(): MutableState {
  const initialTags: Tag[] = [
    { id: "tag-fast", name: "Fast Moving", color: "#0f766e" },
    { id: "tag-promo", name: "Promotion", color: "#c2410c" },
    { id: "tag-risk", name: "Low Stock Risk", color: "#991b1b" }
  ];

  const initialFolders: FolderNode[] = [
    {
      id: "folder-root-1",
      name: "Produce",
      parentId: null,
      permission: { manager: "edit", associate: "read" }
    },
    {
      id: "folder-root-2",
      name: "Dairy",
      parentId: null,
      permission: { manager: "edit", associate: "read" }
    },
    {
      id: "folder-child-1",
      name: "Seasonal",
      parentId: "folder-root-1",
      permission: { manager: "edit", associate: "read" }
    }
  ];

  const initialInventoryEntities: InventoryEntity[] = [
    {
      id: "item-1001",
      name: "Fresh Avocado Bag",
      category: "Produce",
      sku: "AVO-302",
      folderId: "folder-root-1",
      tags: ["tag-fast"],
      currentStock: 120,
      sales7d: 52,
      sales30d: 211,
      description: "Six-count avocado bag.",
      alerts: [{ id: "alert-1", severity: "low", message: "Demand spike expected this weekend." }],
      barcodeUpc: "041303120001",
      barcodeEan: "4006381333931",
      barcodeQr: "QR:ITEM:item-1001"
    },
    {
      id: "item-1002",
      name: "Greek Yogurt 32oz",
      category: "Dairy",
      sku: "YOG-913",
      folderId: "folder-root-2",
      tags: ["tag-promo"],
      currentStock: 44,
      sales7d: 29,
      sales30d: 122,
      description: "Plain greek yogurt family size.",
      alerts: [{ id: "alert-2", severity: "medium", message: "Inventory dropped below target threshold." }],
      barcodeUpc: "036000291452",
      barcodeEan: "5012345678900",
      barcodeQr: "QR:ITEM:item-1002"
    },
    {
      id: "item-1003",
      name: "Organic Blueberries",
      category: "Produce",
      sku: "BLU-100",
      folderId: "folder-child-1",
      tags: ["tag-risk"],
      currentStock: 18,
      sales7d: 40,
      sales30d: 166,
      description: "Pint-sized organic blueberries.",
      alerts: [{ id: "alert-3", severity: "high", message: "Potential out-of-stock within 48 hours." }],
      barcodeUpc: "025000041234",
      barcodeEan: "5901234123457",
      barcodeQr: "QR:ITEM:item-1003"
    }
  ];

  const initialStoreStockSeed: Record<string, { id: string; store_name: string; in_stock: number; held: number }[]> = {
    "item-1001": [
      { id: "001", store_name: "Cincinnati 1", in_stock: 38, held: 4 },
      { id: "002", store_name: "Cincinnati 2", in_stock: 42, held: 3 },
      { id: "003", store_name: "Dayton", in_stock: 40, held: 2 }
    ],
    "item-1002": [
      { id: "001", store_name: "Cincinnati 1", in_stock: 21, held: 3 },
      { id: "002", store_name: "Cincinnati 2", in_stock: 10, held: 1 },
      { id: "003", store_name: "Dayton", in_stock: 13, held: 2 }
    ],
    "item-1003": [
      { id: "001", store_name: "Cincinnati 1", in_stock: 9, held: 1 },
      { id: "002", store_name: "Cincinnati 2", in_stock: 3, held: 1 },
      { id: "003", store_name: "Dayton", in_stock: 6, held: 0 }
    ]
  };

  const initialTrends7Seed: Record<string, { d: string; units: number }[]> = {};
  const initialTrends30Seed: Record<string, { d: string; units: number }[]> = {};
  for (const item of initialInventoryEntities) {
    initialTrends7Seed[item.id] = makeTrend(7, Math.floor(item.sales7d / 7)).map((point) => ({
      d: point.date,
      units: point.value
    }));
    initialTrends30Seed[item.id] = makeTrend(30, Math.floor(item.sales30d / 30)).map((point) => ({
      d: point.date,
      units: point.value
    }));
  }

  return {
    tags: initialTags,
    folders: initialFolders,
    inventoryEntities: initialInventoryEntities,
    storeStockSeed: initialStoreStockSeed,
    trends7Seed: initialTrends7Seed,
    trends30Seed: initialTrends30Seed
  };
}

function syncRecordArray<T>(target: T[], source: T[]): void {
  target.splice(0, target.length, ...source);
}

function syncRecordMap<T extends object>(target: Record<string, T>, source: Record<string, T>): void {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  for (const [key, value] of Object.entries(source)) {
    target[key] = value;
  }
}

export const tags: Tag[] = [];
export const folders: FolderNode[] = [];
export const inventoryEntities: InventoryEntity[] = [];
export const storeStockSeed: Record<string, { id: string; store_name: string; in_stock: number; held: number }[]> = {};
export const trends7Seed: Record<string, { d: string; units: number }[]> = {};
export const trends30Seed: Record<string, { d: string; units: number }[]> = {};

export function resetMockState(): void {
  const initialState = buildInitialState();
  syncRecordArray(tags, initialState.tags);
  syncRecordArray(folders, initialState.folders);
  syncRecordArray(inventoryEntities, initialState.inventoryEntities);
  syncRecordMap(storeStockSeed, initialState.storeStockSeed);
  syncRecordMap(trends7Seed, initialState.trends7Seed);
  syncRecordMap(trends30Seed, initialState.trends30Seed);
}

resetMockState();

import type {
  FolderNode,
  InventoryItemDetail,
  InventoryItemSummary,
  PaginatedResponse,
  ScanResolveResponse,
  Tag
} from "@kroger-mini/contracts";

export interface ApiClientOptions {
  baseUrl: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      },
      ...init
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ?? `Request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  listInventory(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    sort?: "name" | "stock" | "sales";
    tag?: string;
    folder?: string;
  }): Promise<PaginatedResponse<InventoryItemSummary>> {
    const query = new URLSearchParams();
    query.set("page", String(params.page));
    query.set("pageSize", String(params.pageSize));
    if (params.keyword) query.set("keyword", params.keyword);
    if (params.sort) query.set("sort", params.sort);
    if (params.tag) query.set("tag", params.tag);
    if (params.folder) query.set("folder", params.folder);
    return this.request<PaginatedResponse<InventoryItemSummary>>(`/api/inventory/items?${query.toString()}`);
  }

  getItem(id: string): Promise<InventoryItemDetail> {
    return this.request<InventoryItemDetail>(`/api/inventory/items/${id}`);
  }

  listFolders(): Promise<FolderNode[]> {
    return this.request<FolderNode[]>("/api/folders");
  }

  patchFolder(folderId: string, payload: Partial<Pick<FolderNode, "name" | "parentId" | "permission">>): Promise<FolderNode> {
    return this.request<FolderNode>(`/api/folders/${folderId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }

  listTags(): Promise<Tag[]> {
    return this.request<Tag[]>("/api/tags");
  }

  applyTags(itemIds: string[], tagIds: string[]): Promise<{ updatedCount: number }> {
    return this.request<{ updatedCount: number }>("/api/tags/apply", {
      method: "POST",
      body: JSON.stringify({ itemIds, tagIds })
    });
  }

  resolveScan(payload: string): Promise<ScanResolveResponse> {
    return this.request<ScanResolveResponse>("/api/scans/resolve", {
      method: "POST",
      body: JSON.stringify({ payload })
    });
  }
}

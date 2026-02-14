import type { FolderNode } from "@kroger-mini/contracts";
import { folders } from "../mocks/state.js";
import { HttpError } from "./errors.js";

function treeify(nodes: FolderNode[]): FolderNode[] {
  const map = new Map<string, FolderNode>();
  const roots: FolderNode[] = [];
  for (const node of nodes) {
    map.set(node.id, { ...node, children: [] });
  }
  for (const node of map.values()) {
    if (!node.parentId) {
      roots.push(node);
      continue;
    }
    const parent = map.get(node.parentId);
    if (parent) {
      parent.children!.push(node);
    }
  }
  return roots;
}

function assertNoCycle(folderId: string, candidateParentId: string | null): void {
  let current = candidateParentId;
  while (current) {
    if (current === folderId) {
      throw new HttpError(400, "INVALID_FOLDER_PARENT", "Folder move would create a cycle.");
    }
    current = folders.find((folder) => folder.id === current)?.parentId ?? null;
  }
}

export function listFolders(): FolderNode[] {
  return treeify(folders);
}

export function createFolder(name: string, parentId: string | null): FolderNode {
  if (!name.trim()) {
    throw new HttpError(400, "INVALID_FOLDER_NAME", "Folder name is required.");
  }
  if (parentId && !folders.find((folder) => folder.id === parentId)) {
    throw new HttpError(400, "INVALID_FOLDER_PARENT", "Parent folder does not exist.");
  }
  const folder: FolderNode = {
    id: `folder-${Date.now()}`,
    name: name.trim(),
    parentId,
    permission: { manager: "edit", associate: "read" }
  };
  folders.push(folder);
  return folder;
}

export function updateFolder(
  folderId: string,
  payload: {
    name?: string;
    parentId?: string | null;
    permission?: FolderNode["permission"];
  }
): FolderNode {
  const folder = folders.find((node) => node.id === folderId);
  if (!folder) {
    throw new HttpError(404, "FOLDER_NOT_FOUND", `Folder not found: ${folderId}`);
  }
  if (payload.name !== undefined) {
    if (!payload.name.trim()) {
      throw new HttpError(400, "INVALID_FOLDER_NAME", "Folder name cannot be empty.");
    }
    folder.name = payload.name.trim();
  }
  if (payload.parentId !== undefined) {
    if (payload.parentId && !folders.find((node) => node.id === payload.parentId)) {
      throw new HttpError(400, "INVALID_FOLDER_PARENT", "Parent folder does not exist.");
    }
    assertNoCycle(folderId, payload.parentId);
    folder.parentId = payload.parentId;
  }
  if (payload.permission) {
    folder.permission = payload.permission;
  }
  return folder;
}

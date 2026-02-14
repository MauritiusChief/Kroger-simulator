import type { Tag } from "@kroger-mini/contracts";
import { inventoryEntities, tags } from "../mocks/state.js";
import { HttpError } from "./errors.js";

export function listTags(): Tag[] {
  return tags;
}

export function applyTags(itemIds: string[], tagIds: string[]): { updatedCount: number } {
  if (!itemIds.length || !tagIds.length) {
    throw new HttpError(400, "INVALID_TAG_REQUEST", "itemIds and tagIds are required.");
  }
  const existingTags = new Set(tags.map((tag) => tag.id));
  for (const tagId of tagIds) {
    if (!existingTags.has(tagId)) {
      throw new HttpError(400, "TAG_NOT_FOUND", `Unknown tagId: ${tagId}`);
    }
  }

  let updatedCount = 0;
  for (const id of itemIds) {
    const item = inventoryEntities.find((entity) => entity.id === id);
    if (!item) {
      continue;
    }
    item.tags = Array.from(new Set([...item.tags, ...tagIds]));
    updatedCount += 1;
  }
  return { updatedCount };
}

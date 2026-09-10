export const MEDIA_TYPES = ["photo", "video", "graphic"] as const;
export type MediaType = typeof MEDIA_TYPES[number];
export type LibraryFilter = MediaType | "all";

export function isMediaType(value: unknown): value is MediaType {
  return MEDIA_TYPES.some(type => type === value);
}

export function filterMedia<T extends { type: string }>(items: T[], filter: LibraryFilter): T[] {
  return filter === "all" ? items : items.filter(item => item.type === filter);
}

/** Reorder only the visible subset, keeping other categories in their slots. */
export function mergeMediaOrder<T extends { id: number }>(all: T[], reordered: T[]): T[] {
  const ids = new Set(reordered.map(item => item.id));
  if (ids.size !== reordered.length || reordered.some(item => !all.some(original => original.id === item.id))) {
    throw new Error("Invalid library order.");
  }
  let index = 0;
  return all.map(item => ids.has(item.id) ? reordered[index++] : item);
}

export function canChangeMediaType(from: MediaType, to: MediaType) {
  return from === to || (from !== "video" && to !== "video");
}

export type PhotoDetails = {
  event?: string;
  date?: string;
  location?: string;
  role?: string;
};

export type PhotoStory = {
  slug: string;
  title: string;
  category: string;
  description: string;
  photoIds: number[];
  published: boolean;
};

export type Presentation = {
  version: 1;
  editorPhotoIds: number[];
  stories: PhotoStory[];
  photoDetails: Record<string, PhotoDetails>;
};

/** Resolve the edit in its chosen order. Removed media never leaves broken cards. */
export function resolvePhotos<T extends { id: number; type: string; blobUrl: string | null }>(items: T[], ids: number[]): T[] {
  const photos = new Map(items.filter(item => item.type === "photo" && item.blobUrl).map(item => [item.id, item]));
  return [...new Set(ids)].flatMap(id => photos.has(id) ? [photos.get(id)!] : []);
}

export function photoCaption(item: { caption: string | null; altText: string | null; fileName: string | null }): string {
  if (item.caption?.trim()) return item.caption.trim();
  const alt = item.altText?.trim();
  const fileLabel = item.fileName?.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  return alt && alt !== fileLabel ? alt : "";
}

export function photoAlt(item: { caption: string | null; altText: string | null; fileName: string | null }): string {
  // Prefer manually written alt text; old uploads often used only a filename.
  return photoCaption({ ...item, caption: null }) || item.caption?.trim() || "Photograph by Eli Larson";
}

/** Bound and normalize admin input before it reaches storage or public pages. */
export function parsePresentation(value: unknown): Presentation {
  function object(input: unknown): Record<string, unknown> {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid presentation data.");
    return input as Record<string, unknown>;
  }
  function text(input: unknown, max: number, required = false): string {
    if (typeof input !== "string" || input.length > max || (required && !input.trim())) throw new Error(`Text must be ${required ? "1" : "0"}–${max} characters.`);
    return input.trim();
  }
  function ids(input: unknown, max: number): number[] {
    if (!Array.isArray(input) || input.length > max || input.some(id => !Number.isSafeInteger(id) || id <= 0) || new Set(input).size !== input.length) throw new Error(`Choose up to ${max} different photographs.`);
    return input;
  }
  const data = object(value);
  if (data.version !== 1 || !Array.isArray(data.stories) || data.stories.length > 12) throw new Error("Invalid presentation version or story count.");
  const stories = data.stories.map(value => {
    const story = object(value);
    const slug = text(story.slug, 80, true);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Story addresses use lowercase letters, numbers and single hyphens.");
    if (typeof story.published !== "boolean") throw new Error("Choose whether the story is published.");
    const photoIds = ids(story.photoIds, 10);
    if (story.published && photoIds.length < 6) throw new Error("Published stories need 6–10 photographs.");
    return { slug, title: text(story.title, 100, true), category: text(story.category, 80), description: text(story.description, 600), photoIds, published: story.published };
  });
  if (new Set(stories.map(story => story.slug)).size !== stories.length) throw new Error("Each story needs a different address.");
  const entries = Object.entries(object(data.photoDetails));
  if (entries.length > 1000) throw new Error("Too many photo details.");
  const photoDetails: Record<string, PhotoDetails> = {};
  for (const [id, value] of entries) {
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) throw new Error("Invalid photograph ID.");
    const details = object(value);
    photoDetails[id] = Object.fromEntries(["event", "date", "location", "role"].flatMap(key => details[key] === undefined ? [] : [[key, text(details[key], 180)]]));
  }
  return { version: 1, editorPhotoIds: ids(data.editorPhotoIds, 18), stories, photoDetails };
}

/** Match the Info panel CSS so the fitted photograph never sits behind it. */
export function viewerPadding(width: number, height: number, infoOpen: boolean) {
  const desktop = width >= 900;
  return {
    top: 64,
    left: desktop ? 64 : 16,
    right: desktop ? (infoOpen ? 392 : 64) : 16,
    bottom: infoOpen && !desktop ? Math.min(280, Math.round(height * 0.36)) + 32 : 48,
  };
}

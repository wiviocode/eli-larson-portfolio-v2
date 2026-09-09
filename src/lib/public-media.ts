import { cache } from "react";
import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { getPublicMediaUrl } from "./media-url";
import { getPresentation } from "./presentation-store";
import { resolvePhotos } from "./presentation";

export const getPublicMedia = cache(async () => {
  const rows = await db.select({
    id: mediaItems.id, type: mediaItems.type, blobUrl: mediaItems.blobUrl,
    hqBlobUrl: mediaItems.hqBlobUrl, fileName: mediaItems.fileName,
    videoEmbedUrl: mediaItems.videoEmbedUrl, videoThumbnailUrl: mediaItems.videoThumbnailUrl,
    width: mediaItems.width, height: mediaItems.height, altText: mediaItems.altText,
    caption: mediaItems.caption, dominantColor: mediaItems.dominantColor,
    isFeatured: mediaItems.isFeatured,
    isCropped: sql<boolean>`${mediaItems.cropData} IS NOT NULL AND ${mediaItems.cropData} <> ''`,
  }).from(mediaItems).orderBy(asc(mediaItems.sortOrder));
  return rows.map(item => ({
    ...item,
    blobUrl: getPublicMediaUrl(item.blobUrl),
    hqBlobUrl: getPublicMediaUrl(item.hqBlobUrl),
    videoThumbnailUrl: getPublicMediaUrl(item.videoThumbnailUrl),
  }));
});

export const getPortfolio = cache(async () => {
  const [media, { config }] = await Promise.all([getPublicMedia(), getPresentation()]);
  const items = media.map(item => ({ ...item, details: config.photoDetails[item.id] }));
  const stories = config.stories.filter(story => story.published).map(story => ({
    ...story, photos: resolvePhotos(items, story.photoIds),
  })).filter(story => story.photos.length >= 6);
  return { items, stories, editorPhotoIds: config.editorPhotoIds, featured: items.find(item => item.type === "photo" && item.isFeatured) || null };
});

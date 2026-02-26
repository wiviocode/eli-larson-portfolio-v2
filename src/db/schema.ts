import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const mediaItems = pgTable("media_items", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().$type<"photo" | "video">(),
  blobUrl: text("blob_url"),
  fileName: text("file_name"),
  videoEmbedUrl: text("video_embed_url"),
  videoThumbnailUrl: text("video_thumbnail_url"),
  width: integer("width"),
  height: integer("height"),
  altText: text("alt_text"),
  caption: text("caption"),
  dominantColor: text("dominant_color"),
  hqBlobUrl: text("hq_blob_url"),
  cropData: text("crop_data"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MediaItem = typeof mediaItems.$inferSelect;
export type NewMediaItem = typeof mediaItems.$inferInsert;

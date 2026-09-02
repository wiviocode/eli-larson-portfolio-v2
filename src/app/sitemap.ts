import type { MetadataRoute } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";

async function latestMediaUpdate(): Promise<Date> {
  try {
    const [row] = await db
      .select({ latest: sql<string | null>`max(${mediaItems.updatedAt})` })
      .from(mediaItems);
    return row?.latest ? new Date(row.latest) : new Date();
  } catch {
    return new Date();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = await latestMediaUpdate();

  return [
    {
      url: "https://www.eli-larson.com",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.eli-larson.com/about",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

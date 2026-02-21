import type { Metadata } from "next";
import DragPlayground from "@/components/playground/DragPlayground";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore | Eli Larson",
};

async function getPhotos() {
  try {
    const items = await db
      .select()
      .from(mediaItems)
      .orderBy(asc(mediaItems.sortOrder));

    return items
      .filter((i) => i.type === "photo" && i.blobUrl)
      .map((i) => ({
        src: i.blobUrl!,
        label: i.altText || i.fileName || "Photo",
        w: i.width || 400,
        h: i.height || 300,
      }));
  } catch {
    return [];
  }
}

export default async function ExplorePage() {
  const photos = await getPhotos();

  return (
    <DragPlayground photos={photos} />
  );
}

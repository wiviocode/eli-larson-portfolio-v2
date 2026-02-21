import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DragPlayground from "@/components/playground/DragPlayground";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { asc } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Explore | Eli Larson",
};

async function getPhotos() {
  try {
    const items = await db
      .select()
      .from(mediaItems)
      .orderBy(asc(mediaItems.sortOrder))
      .limit(8);

    return items
      .filter((i) => i.type === "photo" && i.blobUrl)
      .map((i) => ({
        src: i.blobUrl!,
        label: i.altText || i.fileName || "Photo",
        w: i.width || 260,
        h: i.height || 180,
      }));
  } catch {
    return [];
  }
}

export default async function ExplorePage() {
  const photos = await getPhotos();

  return (
    <>
      <Header />
      <main className="pt-[60px]">
        {photos.length > 0 ? (
          <DragPlayground photos={photos} />
        ) : (
          <div className="playground flex items-center justify-center">
            <div className="pg-header">
              <div>
                <h2 className="font-display text-[clamp(24px,4vw,48px)] text-white">
                  Explore
                </h2>
                <div className="text-[10px] font-bold uppercase tracking-[.2em] text-white/30 mt-1.5">
                  Interactive Gallery
                </div>
              </div>
            </div>
            <p className="text-white/40 text-sm z-10">
              Upload photos in the admin panel to populate the playground.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

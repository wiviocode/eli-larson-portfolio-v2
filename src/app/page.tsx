import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/gallery/HeroSection";
import JustifiedGrid from "@/components/gallery/JustifiedGrid";
import AboutSection from "@/components/sections/AboutSection";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { asc } from "drizzle-orm";

// Static page: admin mutations regenerate it on demand via
// revalidatePublicPages(). The daily revalidate is only a safety net for
// out-of-band DB edits (scripts), so visitors don't wake the database.
export const revalidate = 86400;

async function getData() {
  // Let a failed regeneration throw so ISR keeps serving the last good page
  // instead of caching an empty gallery.
  const items = await db
    .select({
      id: mediaItems.id,
      type: mediaItems.type,
      blobUrl: mediaItems.blobUrl,
      hqBlobUrl: mediaItems.hqBlobUrl,
      fileName: mediaItems.fileName,
      videoEmbedUrl: mediaItems.videoEmbedUrl,
      videoThumbnailUrl: mediaItems.videoThumbnailUrl,
      width: mediaItems.width,
      height: mediaItems.height,
      altText: mediaItems.altText,
      caption: mediaItems.caption,
      dominantColor: mediaItems.dominantColor,
      isFeatured: mediaItems.isFeatured,
    })
    .from(mediaItems)
    .orderBy(asc(mediaItems.sortOrder));

  const featured = items.find((i) => i.isFeatured) || null;
  return { items, featured };
}

export default async function Home() {
  const { items, featured } = await getData();

  return (
    <>
      <Header active="work" />
      <main id="main">
        <HeroSection featuredImage={featured} />

        <div
          className="py-[60px] pb-20 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,.12)] max-md:py-10 max-md:pb-[50px]"
          id="work"
        >
          {items.length > 0 ? (
            <JustifiedGrid items={items} />
          ) : (
            <div className="max-w-[1300px] mx-auto px-10 text-center text-[#999] py-20">
              <p className="text-sm">
                No media items yet.
              </p>
            </div>
          )}
        </div>

        <AboutSection />
      </main>
      <Footer />
    </>
  );
}

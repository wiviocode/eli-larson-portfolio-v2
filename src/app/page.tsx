import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/gallery/HeroSection";
import MasonryGrid from "@/components/gallery/MasonryGrid";
import AboutSection from "@/components/sections/AboutSection";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const items = await db
      .select()
      .from(mediaItems)
      .orderBy(asc(mediaItems.sortOrder));

    const featured = items.find((i) => i.isFeatured) || null;
    return { items, featured };
  } catch {
    return { items: [], featured: null };
  }
}

export default async function Home() {
  const { items, featured } = await getData();

  return (
    <>
      <Header />
      <main>
        <HeroSection featuredImage={featured} />

        <div
          className="py-[60px] pb-20 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,.12)] max-md:py-10 max-md:pb-[50px]"
          id="work"
        >
          <div className="gallery-label max-w-[1300px] mx-auto px-10 pb-8 text-[10px] font-extrabold uppercase tracking-[.25em] text-brand max-lg:px-6 max-lg:pb-6 max-md:px-4 max-md:pb-5">
            Selected Work
          </div>
          {items.length > 0 ? (
            <MasonryGrid items={items} />
          ) : (
            <div className="max-w-[1300px] mx-auto px-10 text-center text-[#999] py-20">
              <p className="text-sm">
                No media items yet. Upload photos in the{" "}
                <a href="/admin" className="text-brand underline">
                  admin panel
                </a>
                .
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

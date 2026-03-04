import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/gallery/HeroSection";
import JustifiedGrid from "@/components/gallery/JustifiedGrid";
import AboutSection from "@/components/sections/AboutSection";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const revalidate = 3600;

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

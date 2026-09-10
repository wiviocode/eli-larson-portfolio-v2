import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/gallery/HeroSection";
import JustifiedGrid from "@/components/gallery/JustifiedGrid";
import AboutSection from "@/components/sections/AboutSection";
import { getPortfolio } from "@/lib/public-media";

export const revalidate = 3600;

export default async function Home() {
  const { items, featured, editorPhotoIds, stories } = await getPortfolio();

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
            <JustifiedGrid items={items.filter(item => item.type === "photo")} editorPhotoIds={editorPhotoIds} hasStories={stories.length > 0} />
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

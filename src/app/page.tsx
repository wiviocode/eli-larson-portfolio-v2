import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/gallery/HeroSection";
import JustifiedGrid from "@/components/gallery/JustifiedGrid";
import AboutSection from "@/components/sections/AboutSection";
import { getPortfolio } from "@/lib/public-media";

export const revalidate = 3600;

export default async function Home() {
  const { items, featured, editorPhotoIds } = await getPortfolio();

  return (
    <>
      <Header active="work" />
      <main id="main">
        <HeroSection featuredImage={featured} />

        <div
          className="pt-8 pb-20 max-md:pt-4 max-md:pb-[50px]"
          id="work"
        >
          {items.length > 0 ? (
            <JustifiedGrid items={items.filter(item => item.type === "photo")} editorPhotoIds={editorPhotoIds} />
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

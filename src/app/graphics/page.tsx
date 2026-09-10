import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GalleryItem from "@/components/gallery/GalleryItem";
import PhotoSwipeGallery from "@/components/gallery/PhotoSwipeGallery";
import { getPublicMedia } from "@/lib/public-media";
import WorkNavigation from "@/components/gallery/WorkNavigation";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Graphics",
  description: "Graphic design and visual work by Eli Larson.",
  alternates: { canonical: "/graphics" },
};

export default async function GraphicsPage() {
  const graphics = (await getPublicMedia()).filter(item => item.type === "graphic");
  return <>
    <Header active="graphics" />
    <main id="main" className="work-page">
      <h1 className="sr-only">Graphics</h1>
      <WorkNavigation active="graphic" />
      {graphics.length ? <>
        <PhotoSwipeGallery galleryId="graphics-gallery" label="Graphic design" kind="graphic" />
        <div id="graphics-gallery" className="graphics-gallery">
          {graphics.map((item, index) => <figure className="graphic-card" key={item.id}>
            <div className="graphic-image" style={{ aspectRatio: `${item.width || 1200} / ${item.height || 800}` }}>
              <GalleryItem item={item} quality={95} preload={index === 0} sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1300px) calc((100vw - 120px) / 2), 590px" />
            </div>
            {(item.altText || item.caption) && <figcaption>{item.altText && <h2>{item.altText}</h2>}{item.caption && item.caption !== item.altText && <p>{item.caption}</p>}</figcaption>}
          </figure>)}
        </div>
      </> : <div className="work-empty"><p>Graphics coming soon.</p><Link href="/#work" className="text-link">View photographs →</Link></div>}
    </main>
    <Footer />
  </>;
}

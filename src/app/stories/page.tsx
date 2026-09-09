import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getPortfolio } from "@/lib/public-media";
import { getPhotoSource } from "@/lib/gallery-image";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Photo stories",
  description: "Short photographic sequences by Eli Larson. Sport, atmosphere and the moments around the action.",
  alternates: { canonical: "/stories" },
};

export default async function Stories() {
  const { stories } = await getPortfolio();
  return <>
    <Header active="stories" />
    <main id="main" className="stories-page">
      <div className="stories-intro">
        <p className="gallery-label">A closer look</p>
        <h1>Photo stories<span>.</span></h1>
        <p>A few frames, held together. Short sequences from the action and the moments around it.</p>
      </div>
      <div className="story-cards">
        {stories.map((story, index) => {
          const cover = story.photos[0];
          return <Link href={`/stories/${story.slug}`} prefetch={false} className="story-card" key={story.slug}>
            <div className="story-card-image" style={{ aspectRatio: `${cover.width || 1200} / ${cover.height || 800}`, background: cover.dominantColor || "#ddd" }}>
              <Image src={getPhotoSource(cover)!} alt={cover.caption || cover.altText || story.title} fill quality={85} preload={index === 0} sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1300px) calc(50vw - 60px), 590px" />
            </div>
            <div className="story-card-meta"><span>{story.category}</span><span>{story.photos.length} photographs</span></div>
            <h2>{story.title}<span aria-hidden="true">↗</span></h2>
            <p>{story.description}</p>
            <span className="text-link">View story <span aria-hidden="true">→</span></span>
          </Link>;
        })}
      </div>
      {!stories.length && <p className="py-16 text-[#666]">New photo stories are on the way. <Link href="/#work" className="text-link">Explore the photographs →</Link></p>}
      <Link href="/#work" className="text-link stories-back">← Back to all work</Link>
    </main>
    <Footer />
  </>;
}

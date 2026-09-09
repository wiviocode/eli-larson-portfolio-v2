import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GalleryItem from "@/components/gallery/GalleryItem";
import PhotoSwipeGallery from "@/components/gallery/PhotoSwipeGallery";
import { getPortfolio } from "@/lib/public-media";
import { photoCaption } from "@/lib/presentation";

export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };

// New stories can be published from admin without a redeploy.
export async function generateStaticParams() { return []; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { stories } = await getPortfolio();
  const story = stories.find(story => story.slug === slug);
  if (!story) notFound();
  return { title: story.title, description: story.description, alternates: { canonical: `/stories/${story.slug}` } };
}

export default async function Story({ params }: Props) {
  const { slug } = await params;
  const { stories } = await getPortfolio();
  const index = stories.findIndex(story => story.slug === slug);
  if (index < 0) notFound();
  const story = stories[index];
  const next = stories.length > 1 ? stories[(index + 1) % stories.length] : null;
  return <>
    <Header active="stories" />
    <main id="main" className="stories-page story-page">
      <div className="stories-intro">
        <Link href="/stories" className="text-link">← Photo stories</Link>
        <p className="gallery-label">{story.category} · {story.photos.length} photographs</p>
        <h1>{story.title}<span>.</span></h1>
        <p>{story.description}</p>
        <p className="story-byline">Photography by Eli Larson <span aria-hidden="true">/</span> Select any frame to look closer.</p>
      </div>
      <PhotoSwipeGallery galleryId="story-gallery" label={story.title} />
      <div id="story-gallery" className="story-sequence">
        {story.photos.map((photo, i) => {
          const portrait = (photo.height || 800) > (photo.width || 1200);
          const caption = photoCaption(photo);
          return <figure className={`story-frame${portrait ? " story-frame-portrait" : ""}`} key={photo.id}>
            <div className="story-photo" style={{ aspectRatio: `${photo.width || 1200} / ${photo.height || 800}` }}>
              <GalleryItem item={photo} preload={i === 0} quality={90} sizes={portrait ? "(max-width: 768px) calc(100vw - 32px), 640px" : "(max-width: 768px) calc(100vw - 32px), (max-width: 1300px) calc(100vw - 80px), 1220px"} />
            </div>
            <figcaption><span className="story-frame-number">{String(i + 1).padStart(2, "0")} / {String(story.photos.length).padStart(2, "0")}</span>{caption && <p>{caption}</p>}</figcaption>
          </figure>;
        })}
      </div>
      <div className="story-ending">
        <p className="gallery-label">Keep looking</p>
        {next && <Link href={`/stories/${next.slug}`} prefetch={false} className="story-next">{next.title} <span aria-hidden="true">→</span></Link>}
        <Link href="/#work" className="text-link">Return to all photographs →</Link>
      </div>
    </main>
    <Footer />
  </>;
}

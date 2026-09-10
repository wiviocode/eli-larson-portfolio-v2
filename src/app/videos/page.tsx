import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import JustifiedGrid from "@/components/gallery/JustifiedGrid";
import { getPublicMedia } from "@/lib/public-media";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Videos",
  description: "Sports films and video work by Eli Larson.",
  alternates: { canonical: "/videos" },
};

export default async function VideosPage() {
  const videos = (await getPublicMedia()).filter(item => item.type === "video");
  return <>
    <Header active="videos" />
    <main id="main" className="work-page">
      <div className="work-page-intro">
        <p className="gallery-label">Work in motion</p>
        <h1>Videos<span>.</span></h1>
        <p>The atmosphere, the action, and the moments in between.</p>
      </div>
      {videos.length ? <JustifiedGrid items={videos} mediaType="video" /> : <div className="work-empty"><p>New films are on the way.</p><Link href="/#work" className="text-link">Explore the photographs →</Link></div>}
    </main>
    <Footer />
  </>;
}

import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import JustifiedGrid from "@/components/gallery/JustifiedGrid";
import { getPublicMedia } from "@/lib/public-media";
import WorkNavigation from "@/components/gallery/WorkNavigation";

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
      <h1 className="sr-only">Videos</h1>
      {videos.length ? <JustifiedGrid items={videos} mediaType="video" /> : <><WorkNavigation active="video" /><div className="work-empty"><p>New films are on the way.</p><Link href="/#work" className="text-link">Explore the photographs →</Link></div></>}
    </main>
    <Footer />
  </>;
}

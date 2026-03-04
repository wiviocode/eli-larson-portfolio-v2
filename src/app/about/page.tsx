import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AboutContent from "@/components/about/AboutContent";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { eq, and, sql, asc } from "drizzle-orm";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Eli Larson — Media Assistant for Nebraska Men's Basketball, Social Media Manager for Nebraska Track & Field, and freelance sports photographer. Lincoln, NE.",
  openGraph: {
    title: "About — Eli Larson",
    description:
      "Media Assistant for Nebraska Men's Basketball, Social Media Manager for Nebraska Track & Field, and freelance sports photographer. Lincoln, NE.",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

async function getHeroImages() {
  try {
    const photos = await db
      .select({ blobUrl: mediaItems.blobUrl })
      .from(mediaItems)
      .where(
        and(
          eq(mediaItems.type, "photo"),
          sql`${mediaItems.width} > ${mediaItems.height}`
        )
      )
      .orderBy(asc(mediaItems.id));

    return photos.map((p) => p.blobUrl).filter(Boolean) as string[];
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const heroImages = await getHeroImages();

  return (
    <>
      <Header variant="dark" />
      <main id="main" className="bg-[#111]">
        <AboutContent heroImages={heroImages} />
      </main>
      <Footer />
    </>
  );
}

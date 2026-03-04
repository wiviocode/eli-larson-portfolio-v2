import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AboutHero from "@/components/about/AboutHero";
import AboutIntro from "@/components/about/AboutIntro";
import ContactCTA from "@/components/about/ContactCTA";
import ScrollFadeIn from "@/components/gallery/ScrollFadeIn";
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

const experience = [
  {
    title: "Media Assistant & Photographer",
    subtitle: "Men\u2019s Basketball",
    org: "University of Nebraska Athletics (Huskers)",
    dates: "2023 \u2014 Present",
    summary:
      "I capture photography and video for Nebraska Men\u2019s Basketball, creating game-day and social content that reaches over 500K followers. I work closely with the creative staff on content strategy and deliver time-sensitive edits during live events.",
  },
  {
    title: "Social Media Manager",
    subtitle: "Track & Field",
    org: "University of Nebraska Athletics (Huskers)",
    dates: "2023 \u2014 Present",
    summary:
      "I run the social accounts for Nebraska Track & Field\u2014planning content calendars, shooting meets and practices, and turning raw footage into polished posts that build the program\u2019s brand.",
  },
  {
    title: "Freelance Sports Photographer",
    subtitle: "",
    org: "Self-Employed",
    dates: "2021 \u2014 Present",
    summary:
      "I provide professional photography for sporting events and athletic portraits, managing every step from shoot to delivery while building long-term relationships with coaches, athletes, and organizations.",
  },
];

const skillCategories = [
  {
    name: "Photography",
    skills: ["Photography", "Portrait Photography", "Event Coverage"],
  },
  {
    name: "Video",
    skills: ["Videography", "Video Editing"],
  },
  {
    name: "Post-Production",
    skills: [
      "Adobe Lightroom",
      "Photoshop",
      "Premiere Pro",
      "After Effects",
      "Color Grading",
    ],
  },
  {
    name: "Content & Social",
    skills: ["Social Media", "Content Creation"],
  },
];

const awards = [
  "College Photographer of the Year \u2014 Honorable Mention",
  "Nebraska Press Photographers Association \u2014 Best Sports Feature",
];

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
        {/* 1. Cinematic Hero */}
        <AboutHero images={heroImages} />

        {/* 2. Personal Intro */}
        <AboutIntro />

        {/* 3. Experience Cards */}
        <section className="bg-[#111] text-white">
          <div className="max-w-[1300px] mx-auto px-10 py-20 max-lg:px-6 max-lg:py-14 max-md:px-4 max-md:py-10">
            <ScrollFadeIn>
              <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-10">
                Experience
              </h3>
            </ScrollFadeIn>

            <div className="flex flex-col gap-8">
              {experience.map((role, i) => (
                <ScrollFadeIn key={role.title} delay={i * 100}>
                  <div className="border border-white/[.08] rounded-lg p-8 max-md:p-5 transition-colors duration-300 hover:border-white/[.15]">
                    <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                      <div>
                        <h4
                          className="text-[22px] text-white leading-tight max-md:text-[19px]"
                          style={{
                            fontFamily: "'Instrument Serif', serif",
                          }}
                        >
                          {role.title}
                          {role.subtitle && (
                            <>
                              {" "}
                              <span className="text-white/40">&mdash;</span>{" "}
                              {role.subtitle}
                            </>
                          )}
                        </h4>
                        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/40 mt-1.5">
                          {role.org}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[.15em] text-white/30 shrink-0">
                        {role.dates}
                      </span>
                    </div>
                    <p className="text-white/60 text-[14px] leading-[1.7] mt-4 max-md:text-[13px]">
                      {role.summary}
                    </p>
                  </div>
                </ScrollFadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Education & Awards */}
        <section className="bg-[#111] text-white">
          <div className="max-w-[1300px] mx-auto px-10 pb-20 max-lg:px-6 max-lg:pb-14 max-md:px-4 max-md:pb-10">
            <ScrollFadeIn>
              <div className="border-t border-white/[.06] pt-12 grid grid-cols-2 gap-16 max-lg:gap-10 max-md:grid-cols-1 max-md:gap-8">
                {/* Education */}
                <div>
                  <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-6">
                    Education
                  </h3>
                  <p
                    className="text-[20px] text-white leading-tight"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    University of Nebraska&ndash;Lincoln
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/40 mt-1.5">
                    Advertising &amp; Public Relations &middot; 2024 &ndash; 2028
                  </p>
                </div>

                {/* Awards */}
                <div>
                  <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-6">
                    Awards
                  </h3>
                  <ul className="list-none space-y-3">
                    {awards.map((award) => (
                      <li
                        key={award}
                        className="text-white/60 text-[13px] leading-[1.5] pl-7 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-4 before:h-[2px] before:bg-brand"
                      >
                        {award}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollFadeIn>
          </div>
        </section>

        {/* 5. Skills — Categorized Grid */}
        <section className="bg-[#111] text-white">
          <div className="max-w-[1300px] mx-auto px-10 pb-20 max-lg:px-6 max-lg:pb-14 max-md:px-4 max-md:pb-10">
            <ScrollFadeIn>
              <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-10">
                Skills
              </h3>
            </ScrollFadeIn>

            <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
              {skillCategories.map((cat, i) => (
                <ScrollFadeIn key={cat.name} delay={i * 80}>
                  <div className="border border-white/[.08] rounded-lg p-6 transition-colors duration-300 hover:border-white/20">
                    <h4 className="text-[14px] font-bold text-white mb-3">
                      {cat.name}
                    </h4>
                    <p className="text-white/40 text-[12px] leading-[1.8]">
                      {cat.skills.join(" \u00B7 ")}
                    </p>
                  </div>
                </ScrollFadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Closing CTA */}
        <ContactCTA />
      </main>
      <Footer />
    </>
  );
}

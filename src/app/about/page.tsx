import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AboutSection from "@/components/sections/AboutSection";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Eli Larson — Media Assistant for Nebraska Men's Basketball, Social Media Manager for Nebraska Track & Field, and freelance sports photographer. Lincoln, NE.",
};

export default function AboutPage() {
  return (
    <>
      <Header variant="dark" />
      <main className="pt-[60px] bg-[#111]">
        <AboutSection />

        {/* Resume Content */}
        <div className="bg-[#111] text-white">
          <div className="max-w-[1300px] mx-auto px-10 pb-[100px] max-lg:px-6 max-md:px-4">
            {/* Experience */}
            <div className="border-t border-white/[.06] pt-12 mb-16">
              <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-8">
                Experience
              </h3>

              <div className="mb-10">
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <div>
                    <h4 className="text-[13px] font-bold uppercase tracking-[.1em] text-white">
                      Media Assistant & Photographer — Men&apos;s Basketball
                    </h4>
                    <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/40 mt-1">
                      University of Nebraska Athletics (Huskers)
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[.15em] text-white/30">
                    2023 — Present
                  </span>
                </div>
                <ul className="list-none space-y-2 mt-4">
                  {[
                    "Capture high-quality photography and videography for Nebraska Men's Basketball",
                    "Create engaging content for social media platforms reaching 500K+ followers",
                    "Collaborate with creative directors on game day content strategy",
                    "Edit and deliver time-sensitive content during live events",
                  ].map((item) => (
                    <li
                      key={item}
                      className="text-white/40 text-[10px] font-bold uppercase tracking-[.15em] pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[6px] before:w-1.5 before:h-[1px] before:bg-brand"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <div>
                    <h4 className="text-[13px] font-bold uppercase tracking-[.1em] text-white">
                      Social Media Manager — Track & Field
                    </h4>
                    <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/40 mt-1">
                      University of Nebraska Athletics (Huskers)
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[.15em] text-white/30">
                    2023 — Present
                  </span>
                </div>
                <ul className="list-none space-y-2 mt-4">
                  {[
                    "Manage social media accounts for Nebraska Track & Field",
                    "Plan and execute content strategy across platforms",
                    "Produce photo and video content for meets and events",
                  ].map((item) => (
                    <li
                      key={item}
                      className="text-white/40 text-[10px] font-bold uppercase tracking-[.15em] pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[6px] before:w-1.5 before:h-[1px] before:bg-brand"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <div>
                    <h4 className="text-[13px] font-bold uppercase tracking-[.1em] text-white">
                      Freelance Sports Photographer
                    </h4>
                    <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/40 mt-1">
                      Self-Employed
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[.15em] text-white/30">
                    2021 — Present
                  </span>
                </div>
                <ul className="list-none space-y-2 mt-4">
                  {[
                    "Provide professional photography services for sporting events and athletic portraits",
                    "Build and maintain client relationships with coaches, athletes, and organizations",
                    "Manage end-to-end workflow from shoot to delivery",
                  ].map((item) => (
                    <li
                      key={item}
                      className="text-white/40 text-[10px] font-bold uppercase tracking-[.15em] pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[6px] before:w-1.5 before:h-[1px] before:bg-brand"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Education */}
            <div className="border-t border-white/[.06] pt-12 mb-16">
              <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-8">
                Education
              </h3>
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h4 className="text-[13px] font-bold uppercase tracking-[.1em] text-white">
                    University of Nebraska–Lincoln
                  </h4>
                  <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/40 mt-1">
                    Advertising & Public Relations
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[.15em] text-white/30">
                  2024 — 2028
                </span>
              </div>
            </div>

            {/* Skills */}
            <div className="border-t border-white/[.06] pt-12 mb-16">
              <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-8">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Photography",
                  "Videography",
                  "Adobe Lightroom",
                  "Adobe Premiere Pro",
                  "Adobe Photoshop",
                  "Adobe After Effects",
                  "Video Editing",
                  "Color Grading",
                  "Social Media",
                  "Content Creation",
                  "Event Coverage",
                  "Portrait Photography",
                ].map((skill) => (
                  <span
                    key={skill}
                    className="text-[9px] font-bold uppercase tracking-[.15em] text-white/50 border border-white/10 rounded px-3 py-1.5"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Awards */}
            <div className="border-t border-white/[.06] pt-12">
              <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-8">
                Awards
              </h3>
              <ul className="list-none space-y-3">
                {[
                  "College Photographer of the Year — Honorable Mention",
                  "Nebraska Press Photographers Association — Best Sports Feature",
                ].map((award) => (
                  <li
                    key={award}
                    className="text-white/40 text-[10px] font-bold uppercase tracking-[.15em]"
                  >
                    {award}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

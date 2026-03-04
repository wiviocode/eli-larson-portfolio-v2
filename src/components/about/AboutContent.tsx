import Image from "next/image";
import AboutHero from "@/components/about/AboutHero";
import ContactCTA from "@/components/about/ContactCTA";
import CountUp from "@/components/about/CountUp";
import SocialIcons from "@/components/about/SocialIcons";
import ScrollFadeIn from "@/components/gallery/ScrollFadeIn";
import { experience, skillCategories, awards, stats, bio, email, phone, phoneHref, serif } from "./data";

export default function AboutContent({ heroImages }: { heroImages: string[] }) {
  return (
    <>
      <AboutHero images={heroImages} />

      {/* Bento grid */}
      <section className="bg-[#111] text-white">
        <div className="max-w-[1300px] mx-auto px-10 py-20 max-lg:px-6 max-md:px-4 max-md:py-10">

          {/* Row 1: Headshot + Bio + Stats */}
          <div className="grid grid-cols-12 gap-4 mb-4 max-md:grid-cols-1">
            <ScrollFadeIn variant="fade-in-left" className="col-span-3 max-md:col-span-1">
              <div className="bg-[#1a1a1a] rounded-xl overflow-hidden h-full border border-white/[.06] relative min-h-[280px]">
                <Image src="/eli-headshot.png" alt="Eli Larson" fill sizes="(max-width: 768px) 100vw, 25vw" quality={85} className="object-cover object-[center_10%]" />
              </div>
            </ScrollFadeIn>
            <ScrollFadeIn variant="fade-in-up" delay={100} className="col-span-5 max-md:col-span-1">
              <div className="bg-[#1a1a1a] rounded-xl p-8 h-full border border-white/[.06] flex flex-col justify-center max-md:p-5">
                <p className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-4">The Photographer</p>
                <p className="text-white/70 text-[14px] leading-[1.8]">{bio}</p>
                <div className="mt-5 flex flex-col gap-2">
                  <a href={`mailto:${email}`} className="text-[16px] text-brand no-underline relative inline-block self-start after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-brand break-all" style={serif}>{email}</a>
                  <div className="flex items-center gap-4 flex-wrap">
                    <a href={phoneHref} className="text-white/40 text-[10px] font-bold uppercase tracking-[.15em] no-underline hover:text-brand transition-colors">{phone}</a>
                    <SocialIcons size={16} />
                  </div>
                </div>
              </div>
            </ScrollFadeIn>
            <ScrollFadeIn variant="fade-in-right" delay={200} className="col-span-4 max-md:col-span-1">
              <div className="bg-[#1a1a1a] rounded-xl p-8 h-full border border-white/[.06] flex flex-col justify-center max-md:p-5">
                {stats.map((s, i) => (
                  <div key={s.label} className={i > 0 ? "mt-6" : ""}>
                    <p className="text-[44px] leading-none text-white max-md:text-[32px]" style={serif}><CountUp end={s.end} suffix={s.suffix} /></p>
                    <p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/40 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </ScrollFadeIn>
          </div>

          {/* Row 2: Experience cards */}
          <div className="grid grid-cols-3 gap-4 mb-4 max-lg:grid-cols-2 max-md:grid-cols-1">
            {experience.map((role, i) => (
              <ScrollFadeIn key={role.title} delay={i * 80}>
                <div className="bg-[#1a1a1a] rounded-xl p-7 h-full border border-white/[.06] hover:border-white/[.12] transition-colors max-md:p-5">
                  <span className="text-[10px] font-bold uppercase tracking-[.15em] text-brand/50">{role.dates}</span>
                  <h3 className="text-[20px] text-white leading-tight mt-2 max-md:text-[17px]" style={serif}>
                    {role.title}{role.subtitle && <> &mdash; {role.subtitle}</>}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/35 mt-1">{role.org}</p>
                  <p className="text-white/50 text-[13px] leading-[1.7] mt-3">{role.summary}</p>
                </div>
              </ScrollFadeIn>
            ))}
          </div>

          {/* Row 3: Education + Awards + Skills */}
          <div className="grid grid-cols-12 gap-4 max-md:grid-cols-1">
            <ScrollFadeIn className="col-span-3 max-md:col-span-1">
              <div className="bg-[#1a1a1a] rounded-xl p-7 h-full border border-white/[.06] max-md:p-5">
                <h2 className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-4">Education</h2>
                <p className="text-[18px] text-white leading-tight" style={serif}>University of Nebraska&ndash;Lincoln</p>
                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/40 mt-1.5">Advertising &amp; PR<br />2024&ndash;2028</p>
              </div>
            </ScrollFadeIn>
            <ScrollFadeIn delay={80} className="col-span-4 max-md:col-span-1">
              <div className="bg-[#1a1a1a] rounded-xl p-7 h-full border border-white/[.06] max-md:p-5">
                <h2 className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-4">Awards</h2>
                {awards.map((a) => (
                  <p key={a} className="text-white/60 text-[12px] leading-[1.6] pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[8px] before:w-3 before:h-[2px] before:bg-brand mb-2 last:mb-0">{a}</p>
                ))}
              </div>
            </ScrollFadeIn>
            <ScrollFadeIn delay={160} className="col-span-5 max-md:col-span-1">
              <div className="bg-[#1a1a1a] rounded-xl p-7 h-full border border-white/[.06] max-md:p-5">
                <h2 className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-4">Skills</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {skillCategories.map((cat) => (
                    <div key={cat.name}>
                      <h3 className="text-[11px] font-bold text-white mb-1">{cat.name}</h3>
                      <p className="text-white/40 text-[10px] leading-[1.6]">{cat.skills.join(", ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollFadeIn>
          </div>
        </div>
      </section>

      <ContactCTA />
    </>
  );
}

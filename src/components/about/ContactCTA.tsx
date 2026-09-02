import ScrollFadeIn from "@/components/gallery/ScrollFadeIn";
import SocialIcons from "@/components/about/SocialIcons";
import { email, phone, phoneHref } from "./data";

export default function ContactCTA() {
  return (
    <section className="bg-[#0a0a0a] text-white py-24 max-md:py-16">
      <div className="max-w-[1300px] mx-auto px-10 text-center max-lg:px-6 max-md:px-4">
        <ScrollFadeIn variant="fade-in-scale">
          <h2
            className="font-serif-display text-[clamp(32px,5vw,56px)] leading-[1.1] text-white mb-6"
          >
            Let&apos;s Work Together
          </h2>
          <a
            href={`mailto:${email}`}
            className="font-serif-display text-[clamp(18px,3vw,28px)] text-brand no-underline relative inline-block
              after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-brand"
          >
            {email}
          </a>
          <div className="mt-5 flex justify-center items-center gap-4">
            <a
              href={phoneHref}
              className="text-white/40 text-[10px] font-bold uppercase tracking-[.15em] no-underline transition-colors duration-300 hover:text-brand"
            >
              {phone}
            </a>
            <span className="text-white/20">|</span>
            <SocialIcons size={18} />
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}

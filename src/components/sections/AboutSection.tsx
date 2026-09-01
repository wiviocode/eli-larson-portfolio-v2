import SocialIcons from "@/components/about/SocialIcons";
import {
  shortBio,
  skillHighlights,
  email,
  phone,
  phoneHref,
  location,
} from "@/components/about/data";

export default function AboutSection() {
  return (
    <div className="bg-[#111] text-white overflow-hidden">
      <div className="max-w-[1300px] mx-auto px-10 pt-[100px] pb-[60px] max-lg:px-6 max-lg:pt-[60px] max-lg:pb-10 max-md:px-4 max-md:pt-[60px] max-md:pb-8">
        <h2 className="font-serif-display text-[clamp(36px,6vw,80px)] leading-[1.05] text-white">
          Capturing Moments<br />
          That <span className="text-brand">Matter</span>.
        </h2>
      </div>

      <div className="max-w-[1300px] mx-auto px-10 pt-12 pb-[100px] grid grid-cols-3 gap-10 border-t border-white/[.06] max-lg:px-6 max-lg:pt-10 max-lg:pb-[60px] max-lg:gap-8 max-md:grid-cols-1 max-md:px-4 max-md:pt-8 max-md:pb-[60px] max-md:gap-8">
        <div>
          <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-4">
            Background
          </h3>
          <p className="text-white/50 text-[10px] font-bold leading-[2] uppercase tracking-[.15em]">
            {shortBio}
          </p>
        </div>
        <div>
          <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-4">
            Skills
          </h3>
          <ul className="list-none">
            {skillHighlights.map((skill) => (
              <li
                key={skill}
                className="text-white/60 text-[10px] font-bold uppercase tracking-[.15em] mb-2"
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-4">
            Contact
          </h3>
          <p className="text-white/50 text-[10px] font-bold leading-[2] uppercase tracking-[.15em]">
            {location}
          </p>
          <a
            href={`mailto:${email}`}
            className="font-serif-display text-[22px] text-brand no-underline relative inline-block max-md:text-[18px]
              after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-brand"
          >
            {email}
          </a>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[.15em] mt-3">
            <a href={phoneHref} className="text-white/50 no-underline transition-colors duration-300 hover:text-brand">
              {phone}
            </a>
          </p>
          <div className="mt-4">
            <SocialIcons size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

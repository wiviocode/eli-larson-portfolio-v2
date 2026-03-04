import ScrollFadeIn from "@/components/gallery/ScrollFadeIn";

export default function AboutIntro() {
  return (
    <section className="bg-[#111] text-white">
      <div className="max-w-[1300px] mx-auto px-10 py-20 max-lg:px-6 max-lg:py-14 max-md:px-4 max-md:py-10">
        <div className="grid grid-cols-[2fr_3fr] gap-16 items-start max-lg:gap-10 max-md:grid-cols-1 max-md:gap-8">
          {/* Headshot */}
          <ScrollFadeIn variant="fade-in-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/eli-headshot.png"
              alt="Eli Larson"
              className="w-full max-h-[400px] object-cover object-[center_10%] rounded-lg shadow-2xl max-md:max-w-[320px] max-md:mx-auto"
            />
          </ScrollFadeIn>

          {/* Text content */}
          <div>
            <ScrollFadeIn variant="fade-in-right">
              <p className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-5">
                The Photographer
              </p>
              <p className="text-white/70 text-[15px] leading-[1.8] max-md:text-[14px]">
                I&apos;m Eli Larson, a sports photographer and content creator based in
                Lincoln, Nebraska. Currently serving as a Creative Media Assistant for
                Nebraska Men&apos;s Basketball and Social Media Manager for Nebraska Track
                &amp; Field, I&apos;ve spent over five years turning game-day energy into
                imagery that connects fans to the moments that matter.
              </p>
            </ScrollFadeIn>

            {/* Contact row */}
            <ScrollFadeIn variant="fade-in-right" delay={100}>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-[.15em]">
                  Lincoln, NE
                </span>
                <a
                  href="mailto:eli.s.landerson@gmail.com"
                  className="text-[18px] text-brand no-underline relative inline-block
                    after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-brand"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  eli.s.landerson@gmail.com
                </a>
                <a
                  href="tel:+14029755981"
                  className="text-white/40 text-[10px] font-bold uppercase tracking-[.15em] no-underline transition-colors duration-300 hover:text-brand"
                >
                  (402) 975-5981
                </a>
                <div className="flex gap-3 items-center">
                  <a
                    href="https://www.instagram.com/strike_lnk/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="text-brand transition-opacity duration-300 hover:opacity-60"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/eli-larson/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    className="text-brand transition-opacity duration-300 hover:opacity-60"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                </div>
              </div>
            </ScrollFadeIn>

            {/* Stats row */}
            <ScrollFadeIn variant="fade-in-up" delay={200}>
              <div className="mt-10 grid grid-cols-3 gap-6 max-md:gap-4">
                {[
                  { number: "5+", label: "Years Experience" },
                  { number: "3.8M+", label: "Impressions" },
                  { number: "10+", label: "Sports Covered" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p
                      className="text-[48px] leading-none text-white max-md:text-[36px]"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      {stat.number}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/40 mt-2">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollFadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}

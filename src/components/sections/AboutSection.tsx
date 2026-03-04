export default function AboutSection() {
  return (
    <div className="bg-[#111] text-white overflow-hidden">
      <div className="max-w-[1300px] mx-auto px-10 pt-[100px] pb-[60px] grid grid-cols-3 gap-10 items-end max-lg:px-6 max-lg:pt-[60px] max-lg:pb-10 max-lg:gap-8 max-md:grid-cols-1 max-md:px-4 max-md:pt-[60px] max-md:pb-8 max-md:gap-6">
        <h2 className="text-[clamp(36px,6vw,80px)] leading-[1.05] text-white col-span-2 max-md:col-span-1" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Capturing Moments<br />
          That <span className="text-brand">Matter</span>.
        </h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/eli-headshot.png"
          alt="Eli Larson"
          width={640}
          height={640}
          className="h-[120px] rounded-lg object-cover object-[center_10%] scale-[1.15] overflow-hidden max-lg:h-[100px] max-md:w-full max-md:h-auto max-md:max-w-[320px] max-md:aspect-square max-md:scale-100"
        />
      </div>

      <div className="max-w-[1300px] mx-auto px-10 pt-12 pb-[100px] grid grid-cols-3 gap-10 border-t border-white/[.06] max-lg:px-6 max-lg:pt-10 max-lg:pb-[60px] max-lg:gap-8 max-md:grid-cols-1 max-md:px-4 max-md:pt-8 max-md:pb-[60px] max-md:gap-8">
        <div>
          <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-4">
            Background
          </h3>
          <p className="text-white/50 text-[10px] font-bold leading-[2] uppercase tracking-[.15em]">
            Over five years in sports media. Currently a Creative Media
            Assistant for Nebraska Men&apos;s Basketball and Social Media
            Manager for Nebraska Track & Field.
          </p>
        </div>
        <div>
          <h3 className="about-col-heading text-[10px] font-extrabold uppercase tracking-[.2em] text-brand mb-4">
            Skills
          </h3>
          <ul className="list-none">
            {[
              "Photography",
              "Videography",
              "Adobe Suite",
              "Video Editing",
              "Social Media",
              "Content Creation",
            ].map((skill) => (
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
            Lincoln, NE
          </p>
          <a
            href="mailto:eli.s.landerson@gmail.com"
            className="text-[22px] text-brand no-underline relative inline-block max-md:text-[18px]
              after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-brand"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            eli.s.landerson@gmail.com
          </a>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[.15em] mt-3">
            <a href="tel:+14029755981" className="text-white/50 no-underline transition-colors duration-300 hover:text-brand">
              +1 (402) 975-5981
            </a>
          </p>
          <div className="mt-4 flex gap-3.5 items-center">
            <a
              href="https://www.instagram.com/strike_lnk/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="text-brand transition-opacity duration-300 hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 rounded-sm"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/eli-larson/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="text-brand transition-opacity duration-300 hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 rounded-sm"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

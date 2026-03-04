export default function AboutHero() {
  return (
    <section className="relative w-full h-[70vh] max-md:h-[50vh] overflow-hidden">
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/about-hero.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#111]" />

      {/* Overlaid text */}
      <div className="absolute bottom-0 left-0 right-0 px-10 pb-12 max-lg:px-6 max-md:px-4 max-md:pb-8">
        <div className="max-w-[1300px] mx-auto">
          <h1
            className="text-[clamp(40px,7vw,80px)] leading-[1.05] text-white mb-3"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Behind The Lens
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[.25em] text-white/60">
            Sports Creative &middot; Lincoln, NE
          </p>
        </div>
      </div>
    </section>
  );
}

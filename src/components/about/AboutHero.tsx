import Image from "next/image";

export default function AboutHero({ images }: { images: string[] }) {
  // A stable server-rendered hero lets the browser discover its image and
  // preload immediately, without a second download after hydration.
  const heroImage = images[0];

  return (
    <section className="relative w-full h-[70vh] max-md:h-[50vh] overflow-hidden bg-[#111]">
      {heroImage && (
        <Image
          src={heroImage}
          alt="Sports photography by Eli Larson"
          fill
          preload
          sizes="100vw"
          quality={90}
          className="object-cover object-top"
        />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#111]" />

      {/* Overlaid text */}
      <div className="absolute bottom-0 left-0 right-0 px-10 pb-12 max-lg:px-6 max-md:px-4 max-md:pb-8">
        <div className="max-w-[1300px] mx-auto">
          <h1
            className="font-serif-display text-[clamp(40px,7vw,80px)] leading-[1.05] text-white mb-3"
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

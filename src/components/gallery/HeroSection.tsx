import Image from "next/image";
import type { MediaItem } from "@/db/schema";

export default function HeroSection({
  featuredImage,
}: {
  featuredImage?: MediaItem | null;
}) {
  return (
    <section className="pt-20">
      <div className="max-w-[1300px] mx-auto px-10 pt-20 pb-10 grid grid-cols-2 gap-10 items-center max-lg:px-6 max-lg:pt-15 max-lg:pb-8 max-lg:gap-6 max-md:grid-cols-1 max-md:px-4 max-md:pt-10 max-md:pb-6 max-md:gap-5">
        <div>
          <h1
            className="font-[family-name:var(--font-instrument-serif)] text-[clamp(48px,8vw,110px)] leading-[.9] text-[#111] relative inline-block pb-[1px] max-md:text-[clamp(40px,12vw,64px)] max-md:pb-0
            after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-brand after:scale-x-0 after:origin-left after:animate-[line-in_1.2s_.5s_cubic-bezier(.22,1,.36,1)_forwards] max-md:after:h-[3px]"
          >
            Eli Larson<span className="text-brand">.</span>
          </h1>
          <div className="text-xs font-semibold uppercase tracking-[.2em] text-[#666] mt-5 max-md:text-[11px] max-md:tracking-[.15em] max-md:mt-3.5">
            Sports Photography &amp; Videography
          </div>
          <div className="text-[11px] text-[#999] mt-2 tracking-[.1em]">
            Lincoln, NE
          </div>
        </div>
        {featuredImage?.blobUrl && (
          <div className="hero-img-wrapper relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,.12)] rounded-[3px] transition-all duration-400 cursor-pointer">
            <Image
              src={featuredImage.blobUrl}
              alt={featuredImage.altText || "Featured sports photograph by Eli Larson"}
              width={featuredImage.width || 800}
              height={featuredImage.height || 533}
              priority
              className="w-full h-auto block"
            />
          </div>
        )}
        {!featuredImage?.blobUrl && (
          <div className="hero-img-wrapper relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,.12)] rounded-[3px] transition-all duration-400 cursor-pointer">
            <div className="bg-[#ddd] w-full aspect-[3/2] flex items-center justify-center text-[#999] text-sm">
              Upload a featured photo in the admin panel
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-100 bg-[rgba(245,245,245,.92)] backdrop-blur-[8px] border-b border-black/[.08]">
      <nav className="max-w-[1300px] mx-auto px-10 py-[18px] flex items-center justify-between max-lg:px-6 max-lg:py-3.5 max-md:px-4 max-md:py-3">
        <Link
          href="/"
          className="font-display text-[28px] text-[#111] no-underline relative inline-block group max-md:text-[22px]"
        >
          Eli Larson<span className="text-brand">.</span>
          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
        </Link>
        <div className="flex gap-6 max-md:gap-4">
          <Link
            href="/"
            className="text-xs font-semibold text-[#111] no-underline uppercase tracking-[.1em] transition-colors duration-300 hover:text-brand max-md:text-[11px] max-md:tracking-[.06em]"
          >
            Work
          </Link>
          <Link
            href="/explore"
            className="text-xs font-semibold text-[#111] no-underline uppercase tracking-[.1em] transition-colors duration-300 hover:text-brand max-md:text-[11px] max-md:tracking-[.06em]"
          >
            Explore
          </Link>
          <Link
            href="/about"
            className="text-xs font-semibold text-[#111] no-underline uppercase tracking-[.1em] transition-colors duration-300 hover:text-brand max-md:text-[11px] max-md:tracking-[.06em]"
          >
            About
          </Link>
        </div>
      </nav>
    </header>
  );
}

import Link from "next/link";

interface HeaderProps {
  variant?: "light" | "dark";
  active?: "work" | "videos" | "graphics" | "about" | "stories";
}

export default function Header({ variant = "light", active }: HeaderProps) {
  const isDark = variant === "dark";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-100 backdrop-blur-[8px] border-b animate-[header-fade-in_0.5s_ease-out_both] ${
        isDark
          ? "bg-[rgba(17,17,17,.92)] border-white/[.08]"
          : "bg-[rgba(245,245,245,.92)] border-black/[.08]"
      }`}
    >
      <nav
        aria-label="Primary"
        className={`site-navigation ${isDark ? "site-navigation-dark" : ""}`}
      >
        <Link
          href="/"
          className={`font-serif-display text-[28px] no-underline relative inline-block group max-md:text-[22px] ${
            isDark ? "text-white" : "text-[#111]"
          }`}
        >
          Eli Larson<span className="text-brand">.</span>
          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
        </Link>
        <div className="site-work-links">
          <Link
            href="/#work"
            aria-current={active === "work" ? "page" : undefined}
            className={`relative text-xs font-semibold no-underline uppercase tracking-[.1em] transition-colors duration-300 hover:text-brand max-md:text-[11px] max-md:tracking-[.06em] group ${
              isDark ? "text-white" : "text-[#111]"
            }`}
          >
            Photos
            <span className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-brand scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
          </Link>
          <Link href="/videos" prefetch={false} aria-current={active === "videos" ? "page" : undefined}>Videos</Link>
          <Link href="/graphics" prefetch={false} aria-current={active === "graphics" ? "page" : undefined}>Graphics</Link>
        </div>
        <div className="site-more-links">
          <Link
            href="/stories"
            prefetch={false}
            aria-current={active === "stories" ? "page" : undefined}
            className={`text-xs font-semibold no-underline uppercase tracking-[.1em] hover:text-brand max-md:text-[11px] max-md:tracking-[.06em] ${isDark ? "text-white" : "text-[#111]"}`}
          >
            Stories
          </Link>
          <Link
            href="/about"
            aria-current={active === "about" ? "page" : undefined}
            className={`relative text-xs font-semibold no-underline uppercase tracking-[.1em] transition-colors duration-300 hover:text-brand max-md:text-[11px] max-md:tracking-[.06em] group ${
              isDark ? "text-white" : "text-[#111]"
            }`}
          >
            About
            <span className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-brand scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

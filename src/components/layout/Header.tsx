import Link from "next/link";

interface HeaderProps {
  variant?: "light" | "dark";
  active?: "work" | "about";
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
        className="max-w-[1300px] mx-auto px-10 py-[18px] flex items-center justify-between max-lg:px-6 max-lg:py-3.5 max-md:px-4 max-md:py-3"
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
        <div className="flex gap-6 max-md:gap-4">
          <Link
            href="/"
            aria-current={active === "work" ? "page" : undefined}
            className={`relative text-xs font-semibold no-underline uppercase tracking-[.1em] transition-colors duration-300 hover:text-brand max-md:text-[11px] max-md:tracking-[.06em] group ${
              isDark ? "text-white" : "text-[#111]"
            }`}
          >
            Work
            <span className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-brand scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
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

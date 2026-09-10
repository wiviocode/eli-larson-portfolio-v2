import Link from "next/link";

interface HeaderProps {
  variant?: "light" | "dark";
  active?: "work" | "videos" | "graphics" | "about" | "stories";
}

export default function Header({ variant = "light", active }: HeaderProps) {
  const isDark = variant === "dark";
  return (
    <header className={`fixed top-0 left-0 right-0 z-100 backdrop-blur-[8px] border-b ${isDark ? "bg-[rgba(17,17,17,.92)] border-white/[.08]" : "bg-[rgba(245,245,245,.92)] border-black/[.08]"}`}>
      <nav aria-label="Primary" className={`site-navigation ${isDark ? "site-navigation-dark" : ""}`}>
        <Link href="/" className="site-logo font-serif-display">Eli Larson<span className="text-brand">.</span></Link>
        <div className="site-more-links">
          <Link href="/#work" aria-current={active && active !== "about" ? "page" : undefined}>Work</Link>
          <Link href="/about" aria-current={active === "about" ? "page" : undefined}>About</Link>
        </div>
      </nav>
    </header>
  );
}

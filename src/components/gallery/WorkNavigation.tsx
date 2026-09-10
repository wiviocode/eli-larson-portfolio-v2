import Link from "next/link";
import type { ReactNode } from "react";

export default function WorkNavigation({ active, children }: { active: "photo" | "video" | "graphic"; children?: ReactNode }) {
  return (
    <div className="work-toolbar" id={active === "photo" ? undefined : "work"}>
      <nav aria-label="Work categories" className="work-categories">
        <Link href="/#work" aria-current={active === "photo" ? "page" : undefined}>Photos</Link>
        <Link href="/videos#work" aria-current={active === "video" ? "page" : undefined}>Videos</Link>
        <Link href="/graphics#work" aria-current={active === "graphic" ? "page" : undefined}>Graphics</Link>
      </nav>
      {children}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

type Variant = "fade-in-up" | "fade-in-left" | "fade-in-right" | "fade-in-scale";

export default function ScrollFadeIn({
  children,
  delay = 0,
  className = "",
  variant = "fade-in-up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: Variant;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.classList.add("visible");
          }, delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`${variant} ${className}`}>
      {children}
    </div>
  );
}

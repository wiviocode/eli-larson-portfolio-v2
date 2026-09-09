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
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Server-rendered content stays readable if JavaScript never runs. Animate
    // only offscreen content, avoiding a visible flash after hydration.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.classList.remove('visible');
    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => {
            el.classList.add("visible");
          }, delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      el.classList.add('visible');
    };
  }, [delay]);

  return (
    <div ref={ref} className={`${variant} visible ${className}`}>
      {children}
    </div>
  );
}

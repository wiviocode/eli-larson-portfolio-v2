"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({
  end,
  suffix = "",
  duration = 1500,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out curve
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  const display =
    end >= 1_000_000
      ? `${(value / 1_000_000).toFixed(value < end ? 1 : 1)}M`
      : String(value);

  return (
    <span ref={ref}>
      {display}{suffix}
    </span>
  );
}

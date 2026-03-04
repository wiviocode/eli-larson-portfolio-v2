"use client";

import { useEffect, useRef } from "react";

export default function HapticsProvider() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { WebHaptics } = await import("web-haptics");
      if (!WebHaptics.isSupported || cancelled) return;

      const haptics = new WebHaptics();

      function handleClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const el = target.closest("a, button, .p-card, .filter-tab");
        if (!el) return;

        const pattern = el.getAttribute("data-haptic");
        if (pattern === "none") return;

        if (pattern) {
          haptics.trigger(pattern as "success" | "nudge" | "error" | "buzz");
        } else if (el.matches("a")) {
          haptics.trigger([30]);
        } else {
          haptics.trigger("nudge");
        }
      }

      document.addEventListener("click", handleClick, { passive: true });

      cleanupRef.current = () => {
        document.removeEventListener("click", handleClick);
        haptics.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
  }, []);

  return null;
}

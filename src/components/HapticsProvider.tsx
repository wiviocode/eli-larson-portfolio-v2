"use client";

import { useEffect, useRef } from "react";
import { WebHaptics } from "web-haptics";

export default function HapticsProvider() {
  const hapticsRef = useRef<WebHaptics | null>(null);

  useEffect(() => {
    if (!WebHaptics.isSupported) return;

    const haptics = new WebHaptics();
    hapticsRef.current = haptics;

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const el = target.closest("a, button, .p-card, .filter-tab");
      if (!el) return;

      const pattern = el.getAttribute("data-haptic");
      if (pattern === "none") return;

      if (pattern) {
        haptics.trigger(pattern as "success" | "nudge" | "error" | "buzz");
      } else if (el.matches(".filter-tab")) {
        haptics.trigger("nudge");
      } else if (el.matches("button, .p-card")) {
        haptics.trigger("nudge");
      } else if (el.matches("a")) {
        haptics.trigger([30]);
      }
    }

    document.addEventListener("click", handleClick, { passive: true });
    return () => {
      document.removeEventListener("click", handleClick);
      haptics.destroy();
    };
  }, []);

  return null;
}

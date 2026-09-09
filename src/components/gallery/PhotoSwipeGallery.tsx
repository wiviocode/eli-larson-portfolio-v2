"use client";

import { useEffect } from "react";
import type PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";

export default function PhotoSwipeGallery({
  galleryId,
}: {
  galleryId: string;
}) {
  useEffect(() => {
    let lightbox: PhotoSwipeLightbox | null = null;
    let cancelled = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotion = () => {
      if (!lightbox) return;
      lightbox.options.showAnimationDuration = reducedMotion.matches ? 0 : 450;
      lightbox.options.hideAnimationDuration = reducedMotion.matches ? 0 : 300;
      lightbox.options.zoomAnimationDuration = reducedMotion.matches ? 0 : 333;
    };

    async function init() {
      const PhotoSwipeLightbox = (await import("photoswipe/lightbox")).default;
      if (cancelled) return;

      const instance = new PhotoSwipeLightbox({
        gallery: `#${galleryId}`,
        children: "a.p-card",
        pswpModule: () => import("photoswipe"),
        preload: [0, 1],
        bgOpacity: 0.4,
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        showHideAnimationType: "zoom",
        showAnimationDuration: reducedMotion.matches ? 0 : 450,
        hideAnimationDuration: reducedMotion.matches ? 0 : 300,
        zoomAnimationDuration: reducedMotion.matches ? 0 : 333,
        arrowPrev: true,
        arrowNext: true,
        zoom: true,
        tapAction: "toggle-controls",
      });
      lightbox = instance;

      instance.addFilter("domItemData", (data, _element, link) => {
        data.alt = link.dataset.pswpAlt || data.alt || "";
        return data;
      });

      instance.on("afterInit", () => {
        instance.pswp?.element?.setAttribute("aria-label", "Selected photography");
        instance.pswp?.element?.setAttribute("aria-modal", "true");
      });

      instance.on("uiRegister", function () {
        instance.pswp?.ui?.registerElement({
          name: "caption",
          order: 9,
          isButton: false,
          appendTo: "wrapper",
          onInit: (el, pswp) => {
            Object.assign(el.style, {
              position: "absolute",
              bottom: "0",
              left: "0",
              right: "0",
              padding: "32px 16px 14px",
              background: "linear-gradient(transparent, rgba(0,0,0,.55))",
              color: "#fff",
              fontSize: "15px",
              fontWeight: "600",
              lineHeight: "1.5",
              letterSpacing: ".01em",
              pointerEvents: "none",
              whiteSpace: "normal",
              wordBreak: "break-word",
            });

            const update = () => {
              const caption =
                pswp.currSlide?.data?.element?.dataset?.pswpCaption;
              if (caption) {
                el.textContent = caption;
                el.style.display = "";
              } else {
                el.style.display = "none";
              }
            };

            pswp.on("change", update);
            update();
          },
        });
      });

      instance.init();
    }

    reducedMotion.addEventListener("change", updateMotion);
    // Native image links remain usable if this optional enhancement fails.
    void init().catch(() => {});
    return () => {
      cancelled = true;
      reducedMotion.removeEventListener("change", updateMotion);
      lightbox?.destroy();
    };
  }, [galleryId]);

  return null;
}

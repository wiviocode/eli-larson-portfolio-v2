"use client";

import { useEffect } from "react";
import "photoswipe/style.css";

export default function PhotoSwipeGallery({
  galleryId,
}: {
  galleryId: string;
}) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lightbox: any = null;

    async function init() {
      const PhotoSwipeLightbox = (await import("photoswipe/lightbox")).default;
      const PhotoSwipe = (await import("photoswipe")).default;

      lightbox = new PhotoSwipeLightbox({
        gallery: `#${galleryId}`,
        children: "a.p-card",
        pswpModule: PhotoSwipe,
        bgOpacity: 0.4,
        padding: { top: 20, bottom: 60, left: 20, right: 20 },
        showHideAnimationType: "zoom",
        showAnimationDuration: 450,
        hideAnimationDuration: 300,
        arrowPrev: false,
        arrowNext: false,
        zoom: false,
      });

      // Add caption below image in lightbox
      lightbox.on("uiRegister", function () {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (lightbox as any).pswp.ui.registerElement({
          name: "caption",
          order: 9,
          isButton: false,
          appendTo: "root",
          onInit: (el: HTMLElement) => {
            Object.assign(el.style, {
              position: "absolute",
              bottom: "16px",
              left: "0",
              right: "0",
              textAlign: "center",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              pointerEvents: "none",
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (lightbox as any).pswp.on("change", () => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const slide = (lightbox as any).pswp.currSlide;
              el.textContent =
                slide?.data?.element?.dataset?.pswpCaption || "";
            });
          },
        });
      });

      lightbox.init();
    }

    init();
    return () => {
      lightbox?.destroy();
    };
  }, [galleryId]);

  return null;
}

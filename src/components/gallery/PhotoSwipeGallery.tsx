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
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        showHideAnimationType: "zoom",
        showAnimationDuration: 450,
        hideAnimationDuration: 300,
        arrowPrev: false,
        arrowNext: false,
        zoom: false,
        tapAction: "close",
      });

      // Add overlay bar caption with red top border
      lightbox.on("uiRegister", function () {
        lightbox.pswp.ui.registerElement({
          name: "caption",
          order: 9,
          isButton: false,
          appendTo: "wrapper",
          onInit: (el: HTMLElement) => {
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
                lightbox.pswp.currSlide?.data?.element?.dataset?.pswpCaption;
              if (caption) {
                el.textContent = caption;
                el.style.display = "";
              } else {
                el.style.display = "none";
              }
            };

            lightbox.pswp.on("change", update);
            update();
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

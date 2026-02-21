"use client";

import { useEffect } from "react";
import "photoswipe/style.css";

export default function PhotoSwipeGallery({
  galleryId,
}: {
  galleryId: string;
}) {
  useEffect(() => {
    let lightbox: { init: () => void; destroy: () => void } | null = null;

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

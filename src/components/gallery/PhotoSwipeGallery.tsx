"use client";

import { useEffect } from "react";
import type PhotoSwipeLightbox from "photoswipe/lightbox";
import { viewerPadding } from "@/lib/presentation";
import "photoswipe/style.css";

export default function PhotoSwipeGallery({
  galleryId,
  label = "Selected photography",
}: {
  galleryId: string;
  label?: string;
}) {
  useEffect(() => {
    let lightbox: PhotoSwipeLightbox | null = null;
    let cancelled = false;
    let infoOpen = false;
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
        bgOpacity: 1,
        paddingFn: viewport => viewerPadding(viewport.x, viewport.y, infoOpen),
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
        instance.pswp?.element?.setAttribute("aria-label", label);
        instance.pswp?.element?.setAttribute("aria-modal", "true");
      });

      instance.on("uiRegister", function () {
        const pswp = instance.pswp!;
        let panel: HTMLElement;
        let infoButton: HTMLElement;
        infoOpen = false;
        const setInfo = (open: boolean) => {
          infoOpen = open;
          if (!open && panel.contains(document.activeElement)) infoButton.focus();
          panel.hidden = !open;
          infoButton.setAttribute("aria-expanded", String(open));
          pswp.element?.classList.toggle("pswp--info-open", open);
          pswp.updateSize(true);
          if (pswp.currSlide) pswp.zoomTo(pswp.currSlide.zoomLevels.initial, undefined, 0);
        };
        pswp.ui?.registerElement({
          name: "photo-info",
          order: 8,
          isButton: true,
          title: "Photo information (I)",
          ariaLabel: "Photo information",
          html: "Info",
          onInit: el => {
            infoButton = el;
            (el as HTMLButtonElement).disabled = true;
            el.setAttribute("aria-expanded", "false");
            el.setAttribute("aria-controls", `${galleryId}-info`);
          },
          onClick: () => setInfo(!infoOpen),
        });
        pswp.ui?.registerElement({
          name: "photo-details",
          tagName: "section",
          appendTo: "root",
          onInit: el => {
            panel = el;
            el.id = `${galleryId}-info`;
            el.hidden = true;
            el.setAttribute("aria-label", "Photo details");
            // Keep scrolling and selecting text inside the panel independent
            // from PhotoSwipe's image drag/zoom gestures.
            el.addEventListener("pointerdown", event => event.stopPropagation());
            el.addEventListener("wheel", event => event.stopPropagation());
            const close = document.createElement("button");
            close.type = "button";
            close.className = "photo-details-close";
            close.textContent = "Close info ×";
            close.onclick = () => { setInfo(false); infoButton.focus(); };
            const heading = document.createElement("h2");
            heading.textContent = "Behind the frame";
            const caption = document.createElement("p");
            caption.className = "photo-details-caption";
            const details = document.createElement("dl");
            const credit = document.createElement("p");
            credit.className = "photo-details-credit";
            credit.textContent = "Photography by Eli Larson";
            el.append(close, heading, caption, details, credit);
            const update = () => {
              const data = pswp.currSlide?.data?.element?.dataset;
              caption.textContent = data?.pswpCaption || "";
              caption.hidden = !caption.textContent;
              details.replaceChildren();
              for (const [key, name] of [["pswpEvent", "Event"], ["pswpDate", "Date"], ["pswpLocation", "Location"], ["pswpRole", "Role"]]) {
                if (!data?.[key]) continue;
                const term = document.createElement("dt");
                term.textContent = name;
                const value = document.createElement("dd");
                value.textContent = data[key]!;
                details.append(term, value);
              }
              el.scrollTop = 0;
            };
            pswp.on("change", update);
            update();
          },
        });
        pswp.on("keydown", event => {
          if (pswp.opener.isOpen && event.originalEvent.key.toLowerCase() === "i" && !event.originalEvent.metaKey && !event.originalEvent.ctrlKey && !event.originalEvent.altKey) {
            event.preventDefault();
            event.originalEvent.preventDefault();
            setInfo(!infoOpen);
          }
        });
        pswp.on("openingAnimationEnd", () => {
          (infoButton as HTMLButtonElement).disabled = false;
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
  }, [galleryId, label]);

  return null;
}

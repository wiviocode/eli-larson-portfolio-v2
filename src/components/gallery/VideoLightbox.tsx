"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";

function getEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) return null;
    const host = parsed.hostname.replace(/^www\./, "");
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (["youtube.com", "m.youtube.com", "youtube-nocookie.com", "youtu.be"].includes(host)) {
      const id = host === "youtu.be" ? parts[0]
        : parsed.pathname === "/watch" ? parsed.searchParams.get("v")
        : ["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : null;
      if (id && /^[\w-]+$/.test(id)) {
        return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1&controls=1`;
      }
    }

    if (["vimeo.com", "player.vimeo.com"].includes(host)) {
      const idIndex = parts[0] === "video" ? 1 : 0;
      const id = parts[idIndex];
      if (id && /^\d+$/.test(id)) {
        const embed = new URL(`https://player.vimeo.com/video/${id}`);
        embed.searchParams.set("autoplay", "1");
        const hash = parsed.searchParams.get("h") || parts[idIndex + 1];
        if (hash) embed.searchParams.set("h", hash);
        return embed.toString();
      }
    }
  } catch {
    // Invalid links still open a closable fallback dialog below.
  }
  return null;
}

function isDirectVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol)
      && /\.(mp4|webm|mov|ogg)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export default function VideoLightbox({
  videoUrl,
  blobUrl,
  onClose,
}: {
  videoUrl: string;
  blobUrl?: string | null;
  onClose: () => void;
}) {
  const embedUrl = getEmbedUrl(videoUrl);
  const directUrl = !embedUrl && blobUrl ? blobUrl : (!embedUrl && isDirectVideoUrl(videoUrl) ? videoUrl : null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleClose = useCallback(() => {
    if (closeTimerRef.current !== null) return;
    setClosing(true);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300;
    closeTimerRef.current = setTimeout(() => onCloseRef.current(), delay);
  }, []);

  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      // Keep Tab focus inside the dialog
      if (e.key === "Tab" && contentRef.current) {
        const focusables = contentRef.current.querySelectorAll<HTMLElement>(
          "button, a[href], iframe, video[controls], [tabindex]:not([tabindex='-1'])"
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !contentRef.current.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [handleClose]
  );

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeydown);
    const frame = requestAnimationFrame(() => setVisible(true));
    closeButtonRef.current?.focus();
    return () => {
      cancelAnimationFrame(frame);
      if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeydown);
      previouslyFocused?.focus();
    };
  }, [handleKeydown]);

  const lightbox = (
    <div
      className="video-lightbox-backdrop"
      style={{ opacity: visible && !closing ? 1 : 0 }}
      onClick={handleClose}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label="Video player"
        className="video-lightbox-content"
        style={{
          opacity: visible && !closing ? 1 : 0,
          transform: visible && !closing ? "scale(1)" : "scale(0.92)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" ref={closeButtonRef} onClick={handleClose} className="video-lightbox-close" aria-label="Close video">
          &times;
        </button>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Video by Eli Larson"
            className="video-lightbox-player"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : directUrl ? (
          <video
            src={directUrl}
            className="video-lightbox-player"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <div className="video-lightbox-player flex items-center justify-center p-8 text-center text-white" role="status">
            This video is unavailable. Please close the player and choose another video.
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(lightbox, document.body);
}

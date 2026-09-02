"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=0&playsinline=1&controls=1&showinfo=0`;
  }

  // Vimeo
  const vimeoMatch = url.match(
    /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/
  );
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return null;
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url);
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

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      // Keep Tab focus inside the dialog
      if (e.key === "Tab" && contentRef.current) {
        const focusables = contentRef.current.querySelectorAll<HTMLElement>(
          "button, iframe, video, [tabindex]:not([tabindex='-1'])"
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
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeydown);
    requestAnimationFrame(() => setVisible(true));
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeydown);
      previouslyFocused?.focus();
    };
  }, [handleKeydown]);

  if (!embedUrl && !directUrl) return null;

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
        <button ref={closeButtonRef} onClick={handleClose} className="video-lightbox-close" aria-label="Close video">
          &times;
        </button>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="video-lightbox-player"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          <video
            src={directUrl!}
            className="video-lightbox-player"
            controls
            autoPlay
          />
        )}
      </div>
    </div>
  );

  return createPortal(lightbox, document.body);
}

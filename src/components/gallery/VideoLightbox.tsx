"use client";

import { useEffect, useCallback } from "react";

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  }

  // Vimeo
  const vimeoMatch = url.match(
    /(?:vimeo\.com\/)(\d+)/
  );
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return null;
}

export default function VideoLightbox({
  videoUrl,
  onClose,
}: {
  videoUrl: string;
  onClose: () => void;
}) {
  const embedUrl = getEmbedUrl(videoUrl);

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEsc);
    };
  }, [handleEsc]);

  if (!embedUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-[900px] aspect-video"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-2xl font-bold hover:text-brand transition-colors cursor-pointer"
        >
          &times;
        </button>
        <iframe
          src={embedUrl}
          className="w-full h-full rounded"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}

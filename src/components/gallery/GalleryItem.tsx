"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { GalleryMediaItem } from "@/db/schema";
import { getPhotoSource } from "@/lib/gallery-image";
import { photoCaption, photoAlt } from "@/lib/presentation";

function cleanFileName(name: string | null) {
  if (!name) return "Untitled";
  return name
    .replace(/\.[^.]+$/, "")   // remove extension
    .replace(/[-_]/g, " ")      // dashes/underscores to spaces
    .replace(/\s+/g, " ")       // collapse whitespace
    .trim();
}

export default function GalleryItem({
  item,
  sizes,
  preload = false,
  quality = 85,
  onVideoClick,
}: {
  item: GalleryMediaItem;
  sizes?: string;
  preload?: boolean;
  quality?: number;
  onVideoClick?: (embedUrl: string, blobUrl?: string | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const w = item.width || 1200;
  const h = item.height || 800;
  const label = item.caption || item.altText || cleanFileName(item.fileName);
  const altLabel = item.type !== "video" ? photoAlt(item) : item.altText || item.caption || cleanFileName(item.fileName);
  const hasDirectVideo = !!item.blobUrl;
  const thumbnail = item.videoThumbnailUrl || null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || thumbnail || !item.blobUrl) return;

    // Clips without a poster need metadata for a first-frame preview, but only
    // when their card is approaching the viewport.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!video.getAttribute("src")) video.src = item.blobUrl!;
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(video);
    return () => observer.disconnect();
  }, [item.blobUrl, thumbnail]);

  function startPreview() {
    const video = videoRef.current;
    if (!video || !item.blobUrl || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!video.getAttribute("src")) video.src = item.blobUrl;
    // Attach the rejection handler immediately: autoplay can be denied, or a
    // quick pointer exit can interrupt a pending play request.
    void video.play().catch(() => {});
  }

  function stopPreview() {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    if (video.readyState > 0) video.currentTime = 0;
  }

  if (item.type === "video") {
    return (
      <button
        type="button"
        aria-label={`Play video: ${label}`}
        className="p-card group text-left border-none"
        style={{ width: "100%", height: "100%", background: "#000" }}
        onClick={() => {
          stopPreview();
          onVideoClick?.(item.videoEmbedUrl || "", item.blobUrl);
        }}
        onPointerEnter={(event) => { if (event.pointerType === "mouse") startPreview(); }}
        onPointerLeave={stopPreview}
        onFocus={startPreview}
        onBlur={stopPreview}
      >
        {hasDirectVideo ? (
          <video
            ref={videoRef}
            muted
            playsInline
            loop
            preload="metadata"
            className="w-full h-full block object-contain"
            poster={thumbnail || undefined}
            aria-hidden="true"
          />
        ) : thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={altLabel}
            loading="lazy"
            decoding="async"
            className="w-full h-full block object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-end justify-center p-6 pb-12 text-xs text-white/70" aria-hidden="true">
            {label}
          </div>
        )}
        <div className="video-badge">Video</div>
        <div className="video-play-btn" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div className="card-label">{label}</div>
      </button>
    );
  }

  return (
    <a
      className="p-card group"
      style={{ width: "100%", height: "100%", background: item.dominantColor || "#e8e8e8" }}
      href={getPhotoSource(item) || "#"}
      data-pswp-width={w}
      data-pswp-height={h}
      data-pswp-caption={photoCaption(item)}
      data-pswp-alt={altLabel}
      data-pswp-event={item.details?.event}
      data-pswp-date={item.details?.date}
      data-pswp-location={item.details?.location}
      data-pswp-role={item.details?.role}
    >
      {item.blobUrl && (
        <Image
          src={getPhotoSource(item)!}
          alt={altLabel}
          fill
          quality={quality}
          preload={preload}
          sizes={sizes || "(max-width: 768px) calc(100vw - 32px), 33vw"}
          className="img-fade"
          ref={(el) => { if (el?.complete) el.classList.add("loaded"); }}
          onLoad={(e) => e.currentTarget.classList.add("loaded")}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}
      <div className="card-label" aria-hidden="true">{label}</div>
    </a>
  );
}

"use client";

import { useRef } from "react";
import type { MediaItem } from "@/db/schema";

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
  onVideoClick,
}: {
  item: MediaItem;
  onVideoClick?: (url: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const w = item.width || 1200;
  const h = item.height || 800;
  const label = item.altText || cleanFileName(item.fileName);

  if (item.type === "video") {
    return (
      <div
        className="p-card group"
        style={{ aspectRatio: `${w}/${h}` }}
        onClick={() => onVideoClick?.(item.videoEmbedUrl || "")}
        onMouseEnter={() => videoRef.current?.play()}
        onMouseLeave={() => {
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
        }}
      >
        {item.videoThumbnailUrl ? (
          <video
            ref={videoRef}
            src={item.blobUrl || undefined}
            muted
            playsInline
            loop
            className="w-full h-full block object-cover"
            poster={item.videoThumbnailUrl}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.videoThumbnailUrl || "/placeholder.jpg"}
            alt={label}
            className="w-full h-full block object-cover"
          />
        )}
        <div className="video-badge">Video</div>
        <div className="card-label">{label}</div>
      </div>
    );
  }

  return (
    <a
      className="p-card group"
      style={{ aspectRatio: `${w}/${h}`, background: item.dominantColor || "#e8e8e8" }}
      href={item.blobUrl || "#"}
      data-pswp-width={w}
      data-pswp-height={h}
      target="_blank"
      rel="noreferrer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.blobUrl || ""}
        alt={label}
        width={w}
        height={h}
        loading="lazy"
        decoding="async"
        className="img-fade"
        ref={(el) => { if (el?.complete) el.classList.add("loaded"); }}
        onLoad={(e) => e.currentTarget.classList.add("loaded")}
      />
      <div className="card-label">{label}</div>
    </a>
  );
}

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
  justified,
  onVideoClick,
}: {
  item: MediaItem;
  justified?: boolean;
  onVideoClick?: (embedUrl: string, blobUrl?: string | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPromise = useRef<Promise<void> | null>(null);

  const w = item.width || 1200;
  const h = item.height || 800;
  const label = item.caption || item.altText || cleanFileName(item.fileName);
  const altLabel = item.altText || cleanFileName(item.fileName);
  const hasDirectVideo = !!item.blobUrl;
  const thumbnail = item.videoThumbnailUrl || null;

  if (item.type === "video") {
    return (
      <button
        type="button"
        aria-label={`Play video: ${label}`}
        className="p-card group text-left border-none"
        style={justified
          ? { width: "100%", height: "100%", background: "#000" }
          : { aspectRatio: "3/2", background: "#000" }
        }
        onClick={() => onVideoClick?.(item.videoEmbedUrl || "", item.blobUrl)}
        onMouseEnter={() => {
          if (videoRef.current && hasDirectVideo) {
            playPromise.current = videoRef.current.play();
          }
        }}
        onMouseLeave={() => {
          if (videoRef.current && hasDirectVideo) {
            const p = playPromise.current;
            if (p) {
              p.then(() => {
                videoRef.current?.pause();
                if (videoRef.current) videoRef.current.currentTime = 0;
              }).catch(() => {});
              playPromise.current = null;
            } else {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
            }
          }
        }}
      >
        {hasDirectVideo ? (
          <video
            ref={videoRef}
            src={item.blobUrl || undefined}
            muted
            playsInline
            loop
            preload="metadata"
            className="w-full h-full block object-contain"
            poster={thumbnail || undefined}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail || ""}
            alt={altLabel}
            className="w-full h-full block object-contain"
          />
        )}
        <div className="video-badge">Video</div>
        <div className="video-play-btn" aria-label="Play video">
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
      style={justified
        ? { width: "100%", height: "100%", background: item.dominantColor || "#e8e8e8" }
        : { aspectRatio: `${w}/${h}`, background: item.dominantColor || "#e8e8e8" }
      }
      href={item.blobUrl || "#"}
      data-pswp-width={w}
      data-pswp-height={h}
      data-pswp-caption={label}
      target="_blank"
      rel="noreferrer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.blobUrl || ""}
        alt={altLabel}
        width={w}
        height={h}
        loading="lazy"
        decoding="async"
        className="img-fade"
        ref={(el) => { if (el?.complete) el.classList.add("loaded"); }}
        onLoad={(e) => e.currentTarget.classList.add("loaded")}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <div className="card-label">{label}</div>
    </a>
  );
}

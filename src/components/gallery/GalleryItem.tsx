"use client";

import { useRef } from "react";
import type { MediaItem } from "@/db/schema";

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

  if (item.type === "video") {
    return (
      <div
        className="p-card"
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
          <>
            <video
              ref={videoRef}
              src={item.blobUrl || undefined}
              muted
              playsInline
              loop
              className="w-full h-full block object-cover"
              poster={item.videoThumbnailUrl}
            />
            <div className="video-badge">Video</div>
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.videoThumbnailUrl || "/placeholder.jpg"}
              alt={item.altText || "Video thumbnail"}
              className="w-full h-full block object-cover"
            />
            <div className="video-badge">Video</div>
          </>
        )}
      </div>
    );
  }

  return (
    <a
      className="p-card"
      style={{ aspectRatio: `${w}/${h}`, background: "#e8e8e8" }}
      href={item.blobUrl || "#"}
      data-pswp-width={w}
      data-pswp-height={h}
      target="_blank"
      rel="noreferrer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.blobUrl || ""}
        alt={item.altText || "Photo"}
        width={w}
        height={h}
        loading="lazy"
        decoding="async"
        className="img-fade"
        onLoad={(e) => e.currentTarget.classList.add("loaded")}
      />
    </a>
  );
}

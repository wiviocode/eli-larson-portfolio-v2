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

  if (item.type === "video") {
    return (
      <div
        className="p-card"
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
              className="w-full h-auto block"
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
              className="w-full h-auto block"
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
      href={item.blobUrl || "#"}
      data-pswp-width={item.width || 1200}
      data-pswp-height={item.height || 800}
      target="_blank"
      rel="noreferrer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.blobUrl || ""}
        alt={item.altText || "Photo"}
        width={600}
        height={Math.round(600 * ((item.height || 800) / (item.width || 1200)))}
        loading="lazy"
        decoding="async"
      />
    </a>
  );
}

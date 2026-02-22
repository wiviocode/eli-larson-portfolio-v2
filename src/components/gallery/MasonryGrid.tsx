"use client";

import { useState } from "react";
import type { MediaItem } from "@/db/schema";
import PhotoSwipeGallery from "./PhotoSwipeGallery";
import VideoLightbox from "./VideoLightbox";
import GalleryItem from "./GalleryItem";

export default function MasonryGrid({ items }: { items: MediaItem[] }) {
  const [videoState, setVideoState] = useState<{ embedUrl: string; blobUrl?: string | null } | null>(null);

  return (
    <>
      <PhotoSwipeGallery galleryId="pswp-gallery" />
      <div className="masonry" id="pswp-gallery">
        {items.map((item) => (
          <GalleryItem
            key={item.id}
            item={item}
            onVideoClick={(embedUrl, blobUrl) => setVideoState({ embedUrl, blobUrl })}
          />
        ))}
      </div>
      {videoState && (
        <VideoLightbox
          videoUrl={videoState.embedUrl}
          blobUrl={videoState.blobUrl}
          onClose={() => setVideoState(null)}
        />
      )}
    </>
  );
}

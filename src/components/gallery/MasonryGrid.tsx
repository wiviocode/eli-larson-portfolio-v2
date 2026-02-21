"use client";

import { useState } from "react";
import type { MediaItem } from "@/db/schema";
import PhotoSwipeGallery from "./PhotoSwipeGallery";
import VideoLightbox from "./VideoLightbox";
import GalleryItem from "./GalleryItem";

export default function MasonryGrid({ items }: { items: MediaItem[] }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  return (
    <>
      <PhotoSwipeGallery galleryId="pswp-gallery" />
      <div className="masonry" id="pswp-gallery">
        {items.map((item) => (
          <GalleryItem
            key={item.id}
            item={item}
            onVideoClick={(url) => setVideoUrl(url)}
          />
        ))}
      </div>
      {videoUrl && (
        <VideoLightbox videoUrl={videoUrl} onClose={() => setVideoUrl(null)} />
      )}
    </>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import type { MediaItem } from "@/db/schema";
import PhotoSwipeGallery from "./PhotoSwipeGallery";
import VideoLightbox from "./VideoLightbox";
import GalleryItem from "./GalleryItem";

function useColumns() {
  const [cols, setCols] = useState(1);

  useEffect(() => {
    function update() {
      if (window.innerWidth >= 1024) setCols(3);
      else if (window.innerWidth >= 768) setCols(2);
      else setCols(1);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return cols;
}

export default function MasonryGrid({ items }: { items: MediaItem[] }) {
  const [videoState, setVideoState] = useState<{ embedUrl: string; blobUrl?: string | null } | null>(null);
  const cols = useColumns();

  const columns = useMemo(() => {
    const result: MediaItem[][] = Array.from({ length: cols }, () => []);
    items.forEach((item, i) => {
      result[i % cols].push(item);
    });
    return result;
  }, [items, cols]);

  return (
    <>
      <PhotoSwipeGallery galleryId="pswp-gallery" />
      <div className="masonry" id="pswp-gallery">
        {columns.map((colItems, colIndex) => (
          <div className="masonry-col" key={colIndex}>
            {colItems.map((item) => (
              <GalleryItem
                key={item.id}
                item={item}
                onVideoClick={(embedUrl, blobUrl) => setVideoState({ embedUrl, blobUrl })}
              />
            ))}
          </div>
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

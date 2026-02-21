"use client";

import { useState, useMemo, useEffect } from "react";
import type { MediaItem } from "@/db/schema";
import PhotoSwipeGallery from "./PhotoSwipeGallery";
import VideoLightbox from "./VideoLightbox";
import GalleryItem from "./GalleryItem";

/**
 * Reorder items so CSS columns (which fill top-to-bottom) display them
 * in horizontal reading order (left-to-right, row by row).
 *
 * For `cols` columns and `n` items, CSS columns distributes roughly
 * ceil(n/cols) items per column. We reverse that mapping: place item 0
 * in position that lands in col 0 row 0, item 1 in col 1 row 0, etc.
 */
function interleaveForColumns<T>(items: T[], cols: number): T[] {
  if (cols <= 1 || items.length <= cols) return items;

  const n = items.length;
  const rows = Math.ceil(n / cols);
  const result: T[] = new Array(n);

  // CSS columns fills each column top-to-bottom. Column j gets items
  // at indices [j*rows .. (j+1)*rows-1] (last column may be shorter).
  // We want visual row i, col j → source item i*cols + j.
  // That item should go to CSS index j*rows + i.

  for (let i = 0; i < n; i++) {
    const srcRow = Math.floor(i / cols);
    const srcCol = i % cols;
    const destIdx = srcCol * rows + srcRow;
    if (destIdx < n) {
      result[destIdx] = items[i];
    } else {
      // Overflow — last column is shorter, just append
      result[i] = items[i];
    }
  }

  // Fill any gaps caused by uneven columns
  let fill = 0;
  for (let i = 0; i < n; i++) {
    if (result[i] === undefined) {
      while (fill < n && result[fill] !== undefined) fill++;
      if (fill < n) result[i] = items[fill++];
    }
  }

  return result;
}

function useColumns() {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setCols(w >= 1024 ? 3 : w >= 768 ? 2 : 1);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

export default function MasonryGrid({ items }: { items: MediaItem[] }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const cols = useColumns();
  const ordered = useMemo(() => interleaveForColumns(items, cols), [items, cols]);

  return (
    <>
      <PhotoSwipeGallery galleryId="pswp-gallery" />
      <div className="masonry" id="pswp-gallery">
        {ordered.map((item) => (
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

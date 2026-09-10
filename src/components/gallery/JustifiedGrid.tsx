"use client";

import { useState, useMemo, useCallback } from "react";
import type { GalleryMediaItem } from "@/db/schema";
import PhotoSwipeGallery from "./PhotoSwipeGallery";
import VideoLightbox from "./VideoLightbox";
import GalleryItem from "./GalleryItem";
import { resolvePhotos } from "@/lib/presentation";
import WorkNavigation from "./WorkNavigation";

// Content width the server-rendered layout assumes: 1300px max-width minus
// 2x40px padding. Rows are emitted with relative (calc %) geometry, so the
// markup scales at any real width. Keep row membership stable across hydration
// and navigation; CSS stacks the same photographs on mobile.
const ASSUMED_CONTENT_WIDTH = 1220;

// --- Justified layout algorithm ---

interface LayoutItem {
  item: GalleryMediaItem;
  aspectRatio: number;
}

interface LayoutRow {
  items: LayoutItem[];
  height: number;
  isLast: boolean;
}

function computeRows(
  items: GalleryMediaItem[],
  containerWidth: number,
  targetHeight: number,
  gap: number
): LayoutRow[] {
  const layoutItems: LayoutItem[] = items.map((item) => {
    const ar =
      item.type === "video"
        ? 3 / 2
        : (item.width || 1200) / (item.height || 800);
    return { item, aspectRatio: ar };
  });

  const rows: LayoutRow[] = [];
  let currentRow: LayoutItem[] = [];
  let arSum = 0;

  for (let i = 0; i < layoutItems.length; i++) {
    const li = layoutItems[i];
    currentRow.push(li);
    arSum += li.aspectRatio;

    // Compute what row height would be if we completed this row
    const rowGap = (currentRow.length - 1) * gap;
    const rowHeight = (containerWidth - rowGap) / arSum;

    if (rowHeight <= targetHeight) {
      rows.push({ items: currentRow, height: rowHeight, isLast: false });
      currentRow = [];
      arSum = 0;
    }
  }

  // Last incomplete row - render at targetHeight, left-aligned
  if (currentRow.length > 0) {
    rows.push({ items: currentRow, height: targetHeight, isLast: true });
  }

  return rows;
}

// --- Component ---

export default function JustifiedGrid({ items, editorPhotoIds = [], mediaType = "photo" }: { items: GalleryMediaItem[]; editorPhotoIds?: number[]; mediaType?: "photo" | "video" }) {
  const [videoState, setVideoState] = useState<{
    embedUrl: string;
    blobUrl?: string | null;
  } | null>(null);
  const [selection, setSelection] = useState(true);
  const editorItems = useMemo(() => resolvePhotos(items, editorPhotoIds), [items, editorPhotoIds]);
  const contentWidth = ASSUMED_CONTENT_WIDTH;
  const targetHeight = 420;
  const gap = 10;

  const filteredItems = useMemo(() => {
    return mediaType === "photo" && selection && editorItems.length ? editorItems : items.filter((i) => i.type === mediaType);
  }, [items, mediaType, selection, editorItems]);

  const rows = useMemo(() => {
    return computeRows(filteredItems, contentWidth, targetHeight, gap);
  }, [filteredItems, contentWidth, targetHeight, gap]);

  const handleVideoClick = useCallback(
    (embedUrl: string, blobUrl?: string | null) => {
      setVideoState({ embedUrl, blobUrl });
    },
    []
  );

  return (
    <>
      {mediaType === "photo" && <PhotoSwipeGallery galleryId="pswp-gallery" />}

      <WorkNavigation active={mediaType}>
        {mediaType === "photo" && editorItems.length > 0 && (
          <select className="photo-selection" aria-label="Photograph selection" value={selection ? "selected" : "all"} onChange={event => setSelection(event.target.value === "selected")}>
            <option value="selected">Selected</option>
            <option value="all">All photos</option>
          </select>
        )}
      </WorkNavigation>
      <p className="sr-only" role="status">{filteredItems.length} {mediaType === "video" ? "videos" : selection && editorItems.length ? "photographs in Editor’s Selection" : "photographs"}.</p>

      <div
        className="justified-grid"
      >

        <div id={mediaType === "photo" ? "pswp-gallery" : "video-gallery"} className="justified-rows">
          {rows.map((row, rowIndex) => {
            const gapTotal = (row.items.length - 1) * gap;
            const arSum = row.items.reduce((s, li) => s + li.aspectRatio, 0);
            return (
              <div
                className="justified-row"
                key={rowIndex}
                style={{ gap: `${gap}px` }}
              >
                {row.items.map((li) => {
                  // Width as a fraction of the row so the SSR markup scales to
                  // any real container width; a short last row keeps the size
                  // it would have at targetHeight instead of stretching.
                  const frac = row.isLast
                    ? (li.aspectRatio * row.height) / (contentWidth - gapTotal)
                    : li.aspectRatio / arSum;
                  return (
                    <div
                      key={li.item.id}
                      style={{
                        width: `calc((100% - ${gapTotal}px) * ${frac.toFixed(6)})`,
                        aspectRatio: `${li.aspectRatio.toFixed(6)}`,
                        flexShrink: 0,
                      }}
                    >
                      <GalleryItem
                        item={li.item}
                        sizes={`auto, (max-width: 768px) 100vw, ${Math.round(
                          frac * (contentWidth - gapTotal)
                        )}px`}
                        onVideoClick={handleVideoClick}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
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

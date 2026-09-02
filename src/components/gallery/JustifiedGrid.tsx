"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { GalleryMediaItem } from "@/db/schema";
import PhotoSwipeGallery from "./PhotoSwipeGallery";
import VideoLightbox from "./VideoLightbox";
import GalleryItem from "./GalleryItem";

// --- Hooks ---

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentBoxSize[0].inlineSize);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return width;
}

// Content width the server-rendered layout assumes: 1300px max-width minus
// 2x40px padding. Rows are emitted with relative (calc %) geometry, so the
// markup stays correct at any real width; measurement only re-groups rows.
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

// --- Filter types ---

type FilterType = "photo" | "video";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "Images", value: "photo" },
  { label: "Videos", value: "video" },
];

// --- Component ---

export default function JustifiedGrid({ items }: { items: GalleryMediaItem[] }) {
  const [videoState, setVideoState] = useState<{
    embedUrl: string;
    blobUrl?: string | null;
  } | null>(null);
  const [filter, setFilter] = useState<FilterType>("photo");
  const [fadeIn, setFadeIn] = useState(true);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleFilterChange(value: FilterType) {
    if (value === filter) return;
    clearTimeout(fadeTimerRef.current);
    setFadeIn(false);
    fadeTimerRef.current = setTimeout(() => {
      setFilter(value);
      setFadeIn(true);
    }, 250);
  }

  useEffect(() => {
    return () => clearTimeout(fadeTimerRef.current);
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);

  const contentWidth = containerWidth || ASSUMED_CONTENT_WIDTH;
  const isCompact = contentWidth < 976;
  const targetHeight = isCompact ? 280 : 420;
  const gap = isCompact ? 8 : 10;

  const hasVideos = useMemo(() => items.some((i) => i.type === "video"), [items]);

  const filteredItems = useMemo(() => {
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

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
      <PhotoSwipeGallery galleryId="pswp-gallery" />

      {/* Gallery header - uses original 1300px width */}
      <div className="gallery-header max-w-[1300px] mx-auto px-10 pb-14 max-lg:px-6 max-lg:pb-10 max-md:px-4 max-md:pb-7">
        <h2 className="gallery-label">Selected Work</h2>
        {hasVideos && (
          <nav className="filter-bar" aria-label="Filter media">
            <div
              className="filter-bar-slider"
              style={{
                width: `calc(${100 / FILTERS.length}% - 2px)`,
                transform: `translateX(${FILTERS.findIndex((f) => f.value === filter) * 100}%)`,
              }}
            />
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                className={`filter-tab${filter === f.value ? " active" : ""}`}
                style={{ width: `${100 / FILTERS.length}%` }}
                onClick={() => handleFilterChange(f.value)}
              >
                {f.label}
              </button>
            ))}
          </nav>
        )}
      </div>

      <div
        className="justified-grid"
        ref={containerRef}
        style={{ opacity: fadeIn ? 1 : 0.5, transition: "opacity 0.35s ease-in-out" }}
      >

        <div id="pswp-gallery" className="justified-rows">
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
                        sizes={`(max-width: 768px) calc(100vw - 32px), ${Math.round(
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

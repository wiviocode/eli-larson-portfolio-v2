"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { MediaItem } from "@/db/schema";
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

type LayoutMode = "desktop" | "tablet" | "mobile";

function useLayoutParams(): { mode: LayoutMode; targetHeight: number; gap: number } {
  const [mode, setMode] = useState<LayoutMode>("desktop");

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1024) setMode("desktop");
      else if (w >= 768) setMode("tablet");
      else setMode("mobile");
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (mode === "desktop") return { mode, targetHeight: 420, gap: 10 };
  if (mode === "tablet") return { mode, targetHeight: 280, gap: 8 };
  return { mode, targetHeight: 0, gap: 8 };
}

// --- Justified layout algorithm ---

interface LayoutItem {
  item: MediaItem;
  aspectRatio: number;
}

interface LayoutRow {
  items: LayoutItem[];
  height: number;
  isLast: boolean;
}

function computeRows(
  items: MediaItem[],
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

export default function JustifiedGrid({ items }: { items: MediaItem[] }) {
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
  const { mode, targetHeight, gap } = useLayoutParams();

  const hasVideos = useMemo(() => items.some((i) => i.type === "video"), [items]);

  const filteredItems = useMemo(() => {
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  const rows = useMemo(() => {
    if (mode === "mobile" || containerWidth === 0) return [];
    return computeRows(filteredItems, containerWidth, targetHeight, gap);
  }, [filteredItems, containerWidth, targetHeight, gap, mode]);

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

        <div id="pswp-gallery">
          {mode === "mobile" || containerWidth === 0 ? (
            /* Mobile or pre-measurement: single column stack (shows placeholders immediately) */
            <div className="justified-mobile">
              {filteredItems.map((item) => (
                <GalleryItem
                  key={item.id}
                  item={item}
                  onVideoClick={handleVideoClick}
                />
              ))}
            </div>
          ) : (
            /* Desktop / Tablet: justified rows */
            rows.map((row, rowIndex) => (
              <div
                className="justified-row"
                key={rowIndex}
                style={{ gap: `${gap}px`, marginBottom: rowIndex < rows.length - 1 ? `${gap}px` : undefined }}
              >
                {row.items.map((li) => {
                  const itemWidth = li.aspectRatio * row.height;
                  return (
                    <div
                      key={li.item.id}
                      style={{
                        width: `${itemWidth}px`,
                        height: `${row.height}px`,
                        flexShrink: 0,
                      }}
                    >
                      <GalleryItem
                        item={li.item}
                        justified
                        onVideoClick={handleVideoClick}
                      />
                    </div>
                  );
                })}
              </div>
            ))
          )}
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

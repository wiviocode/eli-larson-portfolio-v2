"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MediaItem } from "@/db/schema";

export default function SortableMediaCard({
  item,
  onDelete,
  onToggleFeatured,
}: {
  item: MediaItem;
  onDelete: (id: number) => void;
  onToggleFeatured: (id: number, current: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const thumbnailUrl =
    item.type === "video" ? item.videoThumbnailUrl : item.blobUrl;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-card group !cursor-grab active:!cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      {/* Action buttons overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Featured star — always visible when featured */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFeatured(item.id, item.isFeatured);
          }}
          className={`pointer-events-auto absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            item.isFeatured
              ? "bg-brand text-white shadow-lg"
              : "bg-black/60 text-white/60 opacity-0 group-hover:opacity-100"
          }`}
          title={item.isFeatured ? "Remove featured" : "Set as featured"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="pointer-events-auto absolute bottom-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white/60 hover:bg-brand hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Delete"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Sort order badge */}
        <div className="pointer-events-none absolute top-2 left-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
          {item.sortOrder + 1}
        </div>
      </div>

      {/* Image — natural aspect ratio, matching public gallery */}
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt={item.altText || ""}
          className="w-full h-auto block"
          draggable={false}
        />
      ) : (
        <div className="w-full aspect-video bg-[#f0f0f0] flex items-center justify-center text-[#ccc] text-xs">
          No preview
        </div>
      )}

      {/* Video badge */}
      {item.type === "video" && <div className="video-badge">Video</div>}

      {/* Featured label */}
      {item.isFeatured && (
        <div className="absolute bottom-0 left-0 bg-brand text-white px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.15em]">
          Featured
        </div>
      )}
    </div>
  );
}

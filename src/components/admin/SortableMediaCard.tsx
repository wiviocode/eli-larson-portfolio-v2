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
      className="relative bg-white rounded-lg overflow-hidden shadow-sm border border-black/[.06] group"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 w-6 h-6 bg-black/50 rounded flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="white"
        >
          <circle cx="4" cy="2" r="1" />
          <circle cx="8" cy="2" r="1" />
          <circle cx="4" cy="6" r="1" />
          <circle cx="8" cy="6" r="1" />
          <circle cx="4" cy="10" r="1" />
          <circle cx="8" cy="10" r="1" />
        </svg>
      </div>

      {/* Featured star */}
      <button
        onClick={() => onToggleFeatured(item.id, item.isFeatured)}
        className={`absolute top-2 right-2 z-10 w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
          item.isFeatured
            ? "bg-brand text-white"
            : "bg-black/50 text-white/60 opacity-0 group-hover:opacity-100"
        }`}
        title={item.isFeatured ? "Remove featured" : "Set as featured"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="absolute bottom-2 right-2 z-10 w-6 h-6 bg-black/50 rounded flex items-center justify-center text-white/60 hover:bg-brand hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
        title="Delete"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Thumbnail */}
      <div className="aspect-square bg-[#f0f0f0]">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={item.altText || ""}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#ccc] text-xs">
            No preview
          </div>
        )}
      </div>

      {/* Video badge */}
      {item.type === "video" && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
          Video
        </div>
      )}
    </div>
  );
}

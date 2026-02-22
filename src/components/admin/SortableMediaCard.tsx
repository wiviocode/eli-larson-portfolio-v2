"use client";

import { useState, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MediaItem } from "@/db/schema";

function cleanFileName(name: string | null) {
  if (!name) return "Untitled";
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function SortableMediaCard({
  item,
  index,
  total,
  isSelected,
  onToggleSelect,
  onDelete,
  onToggleFeatured,
  onSendToTop,
  onSendToBottom,
  onUpdateAltText,
}: {
  item: MediaItem;
  index: number;
  total: number;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleFeatured: (id: number, current: boolean) => void;
  onSendToTop: (id: number) => void;
  onSendToBottom: (id: number) => void;
  onUpdateAltText: (id: number, altText: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const thumbnailUrl =
    item.type === "video" ? item.videoThumbnailUrl : item.blobUrl;
  const label = item.altText || cleanFileName(item.fileName);

  function startEditing() {
    setEditValue(label);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function saveEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== label) {
      onUpdateAltText(item.id, trimmed);
    }
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg overflow-hidden bg-white border-2 transition-colors ${
        isSelected ? "border-brand" : "border-transparent hover:border-black/10"
      }`}
    >
      {/* Drag handle — the image area */}
      <div
        className="cursor-grab active:cursor-grabbing relative"
        {...attributes}
        {...listeners}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={label}
            className="w-full h-auto object-cover block"
            draggable={false}
          />
        ) : (
          <div className="w-full aspect-video bg-[#f0f0f0] flex items-center justify-center text-[#ccc] text-xs">
            No preview
          </div>
        )}

        {/* Selection checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleSelect(item.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
            isSelected
              ? "bg-brand border-brand"
              : "bg-black/40 border-white/40 opacity-0 group-hover:opacity-100"
          }`}
        >
          {isSelected && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </button>

        {/* Featured star */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleFeatured(item.id, item.isFeatured);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${
            item.isFeatured
              ? "bg-brand text-white"
              : "bg-black/40 text-white/50 opacity-0 group-hover:opacity-100"
          }`}
          title={item.isFeatured ? "Remove featured" : "Set as featured"}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>

        {/* Video badge */}
        {item.type === "video" && <div className="video-badge">Video</div>}

        {/* Featured badge */}
        {item.isFeatured && (
          <div className="absolute bottom-0 left-0 bg-brand text-white px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[.15em]">
            Featured
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="px-2.5 py-2 flex items-center justify-between gap-1">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              className="text-[10px] font-semibold text-[#333] w-full border border-brand/40 rounded px-1 py-0.5 outline-none focus:border-brand"
              autoFocus
            />
          ) : (
            <div
              className="text-[10px] font-semibold text-[#333] truncate cursor-text hover:text-brand transition-colors"
              title="Double-click to edit"
              onDoubleClick={startEditing}
            >
              {label}
            </div>
          )}
          <div className="text-[9px] text-[#aaa] font-medium">
            #{index + 1} of {total}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {/* Edit title */}
          <button
            onClick={startEditing}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-6 h-6 flex items-center justify-center rounded text-[#999] hover:text-[#111] hover:bg-black/5 transition-colors cursor-pointer"
            title="Edit title"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </button>

          {/* Send to top */}
          <button
            onClick={() => onSendToTop(item.id)}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={index === 0}
            className="w-6 h-6 flex items-center justify-center rounded text-[#999] hover:text-[#111] hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
            title="Send to top"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M7 14l5-5 5 5" />
              <path d="M7 8h10" />
            </svg>
          </button>

          {/* Send to bottom */}
          <button
            onClick={() => onSendToBottom(item.id)}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={index === total - 1}
            className="w-6 h-6 flex items-center justify-center rounded text-[#999] hover:text-[#111] hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
            title="Send to bottom"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M7 10l5 5 5-5" />
              <path d="M7 16h10" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(item.id)}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-6 h-6 flex items-center justify-center rounded text-[#999] hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer"
            title="Delete"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

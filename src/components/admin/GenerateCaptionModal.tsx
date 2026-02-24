"use client";

import { useState } from "react";
import type { MediaItem } from "@/db/schema";

export default function GenerateCaptionModal({
  item,
  onClose,
  onSave,
}: {
  item: MediaItem;
  onClose: () => void;
  onSave: (id: number, caption: string) => void;
}) {
  const [note, setNote] = useState("");
  const [caption, setCaption] = useState(item.caption || "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const imageUrl = item.type === "video" ? item.videoThumbnailUrl : item.blobUrl;

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/media/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          note: note.trim() || undefined,
          metadata: {
            fileName: item.fileName,
            width: item.width,
            height: item.height,
            altText: item.altText,
            createdAt: item.createdAt,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate caption");
      }
      const data = await res.json();
      setCaption(data.caption);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate caption");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!caption.trim()) return;
    setSaving(true);
    try {
      onSave(item.id, caption.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl"
      >
        <h2
          className="text-xl mb-4"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Generate Caption<span className="text-brand">.</span>
        </h2>

        {/* Image preview */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={item.altText || ""}
            className="w-full max-h-48 object-contain rounded mb-4 bg-[#f5f5f5]"
          />
        )}

        {error && (
          <div className="text-brand text-xs font-semibold mb-3">{error}</div>
        )}

        {/* Note input */}
        <label className="block text-[10px] font-bold uppercase tracking-[.15em] text-[#999] mb-1.5">
          Context Note
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Braden Frager #5, Nebraska vs Creighton, Dec 7 2025, Nebraska won 71-50"
          rows={2}
          className="w-full border border-black/10 rounded px-4 py-3 text-sm placeholder-[#ccc] focus:outline-none focus:border-brand transition-colors resize-none mb-3"
        />

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full text-[10px] font-bold uppercase tracking-[.15em] bg-[#111] text-white px-4 py-2.5 rounded hover:bg-brand transition-colors cursor-pointer disabled:opacity-50 mb-4"
        >
          {generating ? "Generating..." : "Generate Caption"}
        </button>

        {/* Caption review/edit */}
        <label className="block text-[10px] font-bold uppercase tracking-[.15em] text-[#999] mb-1.5">
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Generated caption will appear here..."
          rows={5}
          className="w-full border border-black/10 rounded px-4 py-3 text-sm placeholder-[#ccc] focus:outline-none focus:border-brand transition-colors resize-y mb-1"
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999] px-4 py-2 hover:text-[#666] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !caption.trim()}
            className="text-[10px] font-bold uppercase tracking-[.15em] bg-brand text-white px-4 py-2 rounded hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Caption"}
          </button>
        </div>
      </div>
    </div>
  );
}

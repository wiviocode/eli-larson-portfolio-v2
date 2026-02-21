"use client";

import { useState } from "react";

function extractVideoInfo(url: string) {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/
  );
  if (ytMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      thumbnailUrl: null, // Vimeo thumbnails need API call
    };
  }

  return null;
}

export default function AddVideoModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const info = extractVideoInfo(url);
    if (!info) {
      setError("Please enter a valid YouTube or Vimeo URL");
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "video",
          videoEmbedUrl: info.embedUrl,
          videoThumbnailUrl: info.thumbnailUrl,
          width: 1920,
          height: 1080,
          altText: "Video",
        }),
      });
      onAdded();
      onClose();
    } catch {
      setError("Failed to add video");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
      >
        <h2 className="text-xl mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Add Video<span className="text-brand">.</span>
        </h2>

        {error && (
          <div className="text-brand text-xs font-semibold mb-3">{error}</div>
        )}

        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube or Vimeo URL"
          className="w-full border border-black/10 rounded px-4 py-3 text-sm placeholder-[#ccc] focus:outline-none focus:border-brand transition-colors"
          autoFocus
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999] px-4 py-2 hover:text-[#666] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="text-[10px] font-bold uppercase tracking-[.15em] bg-brand text-white px-4 py-2 rounded hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Adding..." : "Add Video"}
          </button>
        </div>
      </form>
    </div>
  );
}

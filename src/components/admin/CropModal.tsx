"use client";

import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import type { MediaItem } from "@/db/schema";

export default function CropModal({
  item,
  onClose,
  onCropped,
}: {
  item: MediaItem;
  onClose: () => void;
  onCropped: (updated: MediaItem) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [error, setError] = useState("");

  const imageUrl = item.hqBlobUrl || item.blobUrl || "";
  const hasCrop = !!item.cropData;

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleApply() {
    if (!croppedAreaPixels) return;
    setError("");
    setApplying(true);
    try {
      const res = await fetch(`/api/media/${item.id}/crop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(croppedAreaPixels),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Crop failed");
      }
      const updated = await res.json();
      onCropped(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crop failed");
    } finally {
      setApplying(false);
    }
  }

  async function handleRevert() {
    setError("");
    setReverting(true);
    try {
      const res = await fetch(`/api/media/${item.id}/crop`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Revert failed");
      }
      const updated = await res.json();
      onCropped(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revert failed");
    } finally {
      setReverting(false);
    }
  }

  const busy = applying || reverting;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl"
      >
        <h2
          className="text-xl mb-4"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Crop Image<span className="text-brand">.</span>
        </h2>

        {error && (
          <div className="text-brand text-xs font-semibold mb-3">{error}</div>
        )}

        {/* Crop area */}
        <div className="relative w-full h-[400px] bg-[#111] rounded overflow-hidden mb-4">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999] shrink-0">
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-brand"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            {hasCrop && (
              <button
                onClick={handleRevert}
                disabled={busy}
                className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999] px-4 py-2 hover:text-brand transition-colors cursor-pointer disabled:opacity-50"
              >
                {reverting ? "Reverting..." : "Revert to Original"}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999] px-4 py-2 hover:text-[#666] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={busy || !croppedAreaPixels}
              className="text-[10px] font-bold uppercase tracking-[.15em] bg-brand text-white px-4 py-2 rounded hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {applying ? "Applying..." : "Apply Crop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { type Area, type MediaSize } from "react-easy-crop";
import type { MediaItem } from "@/db/schema";

// "original" is a sentinel — replaced at runtime with the image's natural ratio
const ORIGINAL_SENTINEL = -1;

type AspectOption = { label: string; value: number };

const ASPECT_OPTIONS: AspectOption[] = [
  { label: "Original", value: ORIGINAL_SENTINEL },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:4", value: 3 / 4 },
  { label: "2:3", value: 2 / 3 },
  { label: "9:16", value: 9 / 16 },
];

interface CropState {
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  aspect: number;
}

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
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number>(ORIGINAL_SENTINEL);
  const [naturalAspect, setNaturalAspect] = useState(4 / 3);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [error, setError] = useState("");

  // Undo/redo history — use refs to avoid stale closures
  const MAX_HISTORY = 50;
  const historyRef = useRef<CropState[]>([
    { crop: { x: 0, y: 0 }, zoom: 1, rotation: 0, aspect: ORIGINAL_SENTINEL },
  ]);
  const historyIndexRef = useRef(0);
  const [, forceUpdate] = useState(0);
  const suppressHistoryRef = useRef(false);

  const imageUrl = item.hqBlobUrl || item.blobUrl || "";
  const hasCrop = !!item.cropData;

  // Resolve the sentinel to the actual image aspect ratio
  const resolvedAspect = aspect === ORIGINAL_SENTINEL ? naturalAspect : aspect;

  const onMediaLoaded = useCallback((mediaSize: MediaSize) => {
    if (mediaSize.naturalWidth && mediaSize.naturalHeight) {
      setNaturalAspect(mediaSize.naturalWidth / mediaSize.naturalHeight);
    }
  }, []);

  function pushHistory(state: CropState) {
    if (suppressHistoryRef.current) return;
    const truncated = historyRef.current.slice(0, historyIndexRef.current + 1);
    truncated.push(state);
    if (truncated.length > MAX_HISTORY) truncated.shift();
    historyRef.current = truncated;
    historyIndexRef.current = truncated.length - 1;
    forceUpdate((n) => n + 1);
  }

  function restoreState(state: CropState) {
    suppressHistoryRef.current = true;
    setCrop(state.crop);
    setZoom(state.zoom);
    setRotation(state.rotation);
    setAspect(state.aspect);
    suppressHistoryRef.current = false;
  }

  function handleUndo() {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    restoreState(historyRef.current[historyIndexRef.current]);
    forceUpdate((n) => n + 1);
  }

  function handleRedo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    restoreState(historyRef.current[historyIndexRef.current]);
    forceUpdate((n) => n + 1);
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // Push history snapshot after a crop/zoom drag ends (not on every micro-movement)
  const onInteractionEnd = useCallback(() => {
    pushHistory({ crop, zoom, rotation, aspect });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop, zoom, rotation, aspect]);

  function handleAspectChange(value: number) {
    setAspect(value);
    pushHistory({ crop, zoom, rotation, aspect: value });
  }

  function handleRotationChange(value: number) {
    setRotation(value);
    pushHistory({ crop, zoom, rotation: value, aspect });
  }

  function handleRotate90(direction: 1 | -1) {
    const next = Math.max(-180, Math.min(180, rotation + direction * 90));
    setRotation(next);
    pushHistory({ crop, zoom, rotation: next, aspect });
  }

  async function handleApply() {
    if (!croppedAreaPixels) return;
    setError("");
    setApplying(true);
    try {
      const res = await fetch(`/api/media/${item.id}/crop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...croppedAreaPixels, rotation }),
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
  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const labelClass =
    "text-[10px] font-bold uppercase tracking-[.15em] text-[#999] shrink-0 w-16";

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
            rotation={rotation}
            aspect={resolvedAspect}
            onMediaLoaded={onMediaLoaded}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onInteractionEnd={onInteractionEnd}
            showGrid
          />
        </div>

        {/* Aspect ratio selector */}
        <div className="flex items-center gap-3 mb-3">
          <label className={labelClass}>Aspect</label>
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleAspectChange(opt.value)}
                className={`text-[10px] font-bold uppercase tracking-[.1em] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  aspect === opt.value
                    ? "bg-brand text-white border-brand"
                    : "border-[#ddd] text-[#999] hover:border-[#999] hover:text-[#666]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 mb-3">
          <label className={labelClass}>Zoom</label>
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

        {/* Rotation slider + quick buttons */}
        <div className="flex items-center gap-3 mb-4">
          <label className={labelClass}>Rotate</label>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotation}
            onChange={(e) => handleRotationChange(Number(e.target.value))}
            className="flex-1 accent-brand"
          />
          <span className="text-[10px] font-mono text-[#999] w-10 text-right shrink-0">
            {rotation}°
          </span>
          <button
            onClick={() => handleRotate90(-1)}
            title="Rotate -90°"
            className="text-sm text-[#999] hover:text-brand transition-colors cursor-pointer px-1"
          >
            ↺
          </button>
          <button
            onClick={() => handleRotate90(1)}
            title="Rotate +90°"
            className="text-sm text-[#999] hover:text-brand transition-colors cursor-pointer px-1"
          >
            ↻
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {hasCrop && (
              <button
                onClick={handleRevert}
                disabled={busy}
                className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999] px-4 py-2 hover:text-brand transition-colors cursor-pointer disabled:opacity-50"
              >
                {reverting ? "Reverting..." : "Revert"}
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleUndo}
              disabled={!canUndo || busy}
              title="Undo"
              className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999] px-2 py-2 hover:text-brand transition-colors cursor-pointer disabled:opacity-30"
            >
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo || busy}
              title="Redo"
              className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999] px-2 py-2 hover:text-brand transition-colors cursor-pointer disabled:opacity-30"
            >
              Redo
            </button>
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

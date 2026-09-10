"use client";

import { useState, useRef, useCallback } from "react";

function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve({ width: 1200, height: 800 });
    img.src = URL.createObjectURL(file);
  });
}

export default function UploadDropzone({
  onUploadComplete,
  mediaType = "photo",
  onBusyChange,
}: {
  onUploadComplete: () => void;
  mediaType?: "photo" | "graphic";
  onBusyChange?: (busy: boolean) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const [errors, setErrors] = useState<string[]>([]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      if (busy.current) return;
      const fileArr = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (fileArr.length === 0) { setErrors(["Choose image files to upload."]); return; }

      busy.current = true;
      setUploading(true);
      onBusyChange?.(true);
      setErrors([]);
      setProgress({ done: 0, total: fileArr.length });

      for (const file of fileArr) {
        try {
          const dims = await getImageDimensions(file);

          // 1. Get presigned URL from our API
          const uploadRes = await fetch("/api/media/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              contentType: file.type,
              size: file.size,
            }),
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.error || "Failed to get upload URL");
          }

          const { presignedUrl, objectKey } = await uploadRes.json();

          // 2. PUT file directly to R2
          const putRes = await fetch(presignedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!putRes.ok) {
            throw new Error(`R2 upload failed: ${putRes.status}`);
          }

          // 3. Create media item with the R2 object key
          const created = await fetch("/api/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: mediaType,
              rawObjectKey: objectKey,
              fileName: file.name,
              width: dims.width,
              height: dims.height,
              altText: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
            }),
          });

          if (!created.ok) {
            const result = await created.json();
            throw new Error(result.error || "Unable to add this image to the library.");
          }

          setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        } catch (err) {
          setErrors(previous => [...previous, `${file.name}: ${err instanceof Error ? err.message : "Upload failed. Please try again."}`]);
        }
      }

      setUploading(false);
      busy.current = false;
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
      onUploadComplete();
    },
    [onUploadComplete, mediaType, onBusyChange]
  );

  return (
    <>
    <div
      role="button"
      tabIndex={uploading ? -1 : 0}
      aria-label={mediaType === "graphic" ? "Upload graphics" : "Upload photographs"}
      aria-disabled={uploading}
      className={`border-2 border-dashed rounded-lg p-8 mb-8 text-center transition-colors cursor-pointer ${
        dragging
          ? "border-brand bg-brand/5"
          : "border-black/10 hover:border-brand/50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        upload(e.dataTransfer.files);
      }}
      onClick={(event) => { if (event.target !== inputRef.current && !busy.current) inputRef.current?.click(); }}
      onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !busy.current) { event.preventDefault(); inputRef.current?.click(); } }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={mediaType === "graphic" ? "image/png,image/jpeg,image/webp,image/avif" : "image/jpeg,image/png,image/webp,image/gif,image/avif"}
        disabled={uploading}
        className="hidden"
        onChange={(e) => e.target.files && upload(e.target.files)}
      />
      {uploading ? (
        <div>
          <div className="text-sm font-semibold text-[#666] mb-2">
            Uploading {progress.done}/{progress.total}
          </div>
          <div className="w-48 mx-auto h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all"
              style={{
                width: `${(progress.done / progress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="text-[11px] font-bold uppercase tracking-[.15em] text-[#666] mb-1">
            {mediaType === "graphic" ? "Drop graphics here" : "Drop photos here"}
          </div>
          <div className="text-xs text-[#666]">
            {mediaType === "graphic" ? "PNG, JPEG, WebP or AVIF · original export preserved · click to browse" : "or click to browse"}
          </div>
        </>
      )}
    </div>
    {errors.length > 0 && <div role="alert" className="mb-6 text-sm text-brand"><p>Some files could not be uploaded:</p><ul className="list-disc pl-5">{errors.map((error, index) => <li key={index}>{error}</li>)}</ul></div>}
    </>
  );
}

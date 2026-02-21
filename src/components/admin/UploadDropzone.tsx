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
}: {
  onUploadComplete: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (fileArr.length === 0) return;

      setUploading(true);
      setProgress({ done: 0, total: fileArr.length });

      for (const file of fileArr) {
        try {
          const dims = await getImageDimensions(file);

          const formData = new FormData();
          formData.append("file", file);
          const uploadRes = await fetch("/api/media/upload", {
            method: "POST",
            body: formData,
          });
          const { url } = await uploadRes.json();

          await fetch("/api/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "photo",
              blobUrl: url,
              fileName: file.name,
              width: dims.width,
              height: dims.height,
              altText: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
            }),
          });

          setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        } catch (err) {
          console.error("Upload failed:", err);
        }
      }

      setUploading(false);
      onUploadComplete();
    },
    [onUploadComplete]
  );

  return (
    <div
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
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
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
          <div className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999] mb-1">
            Drop photos here
          </div>
          <div className="text-[10px] text-[#ccc]">
            or click to browse
          </div>
        </>
      )}
    </div>
  );
}

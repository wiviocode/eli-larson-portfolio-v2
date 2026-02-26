"use client";

import { useState, useEffect, useCallback } from "react";
import type { MediaItem } from "@/db/schema";
import UploadDropzone from "@/components/admin/UploadDropzone";
import AdminMediaGrid from "@/components/admin/AdminMediaGrid";
import AddVideoModal from "@/components/admin/AddVideoModal";
import GenerateCaptionModal from "@/components/admin/GenerateCaptionModal";
import CropModal from "@/components/admin/CropModal";

export default function AdminDashboard() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [captionItemId, setCaptionItemId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [cropItemId, setCropItemId] = useState<number | null>(null);


  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }

  async function handleLogout() {
    document.cookie = "auth-token=; path=/; max-age=0";
    window.location.href = "/admin/login";
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    const count = selected.size;
    if (!confirm(`Delete ${count} item${count > 1 ? "s" : ""}? This cannot be undone.`)) return;

    setDeleting(true);
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => fetch(`/api/media/${id}`, { method: "DELETE" })));
    setItems((prev) => prev.filter((i) => !selected.has(i.id)));
    setSelected(new Set());
    setDeleting(false);
  }

  async function handleToggleFeatured(id: number, current: boolean) {
    const res = await fetch(`/api/media/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !current }),
    });
    if (res.ok) {
      fetchItems();
    }
  }

  async function handleUpdateAltText(id: number, altText: string) {
    const res = await fetch(`/api/media/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ altText }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, altText } : i))
      );
    }
  }

  async function handleSaveCaption(id: number, caption: string) {
    const res = await fetch(`/api/media/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, caption } : i))
      );
    }
  }

  async function handleSendToTop(id: number) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx <= 0) return;
    const reordered = [...items];
    const [moved] = reordered.splice(idx, 1);
    reordered.unshift(moved);
    setItems(reordered);
    await persistOrder(reordered);
  }

  async function handleSendToBottom(id: number) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1 || idx === items.length - 1) return;
    const reordered = [...items];
    const [moved] = reordered.splice(idx, 1);
    reordered.push(moved);
    setItems(reordered);
    await persistOrder(reordered);
  }

  async function persistOrder(reordered: MediaItem[]) {
    const updates = reordered.map((item, idx) => ({
      id: item.id,
      sortOrder: idx,
    }));
    await fetch("/api/media/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  const allSelected = items.length > 0 && selected.size === items.length;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-black/[.08] px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Admin Panel<span className="text-brand">.</span>
        </h1>
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="text-[10px] font-bold uppercase tracking-[.15em] text-[#666] hover:text-brand transition-colors"
          >
            View Site
          </a>
          <button
            onClick={handleLogout}
            className="text-[10px] font-bold uppercase tracking-[.15em] text-[#666] hover:text-brand transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Stats + Actions */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999]">
            Media Library — {items.length} items
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVideoModal(true)}
              className="text-[10px] font-bold uppercase tracking-[.15em] bg-[#111] text-white px-4 py-2 rounded hover:bg-brand transition-colors cursor-pointer"
            >
              + Add Video
            </button>
          </div>
        </div>

        {/* Upload */}
        <UploadDropzone onUploadComplete={fetchItems} />

        {/* Selection toolbar */}
        {items.length > 0 && (
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <button
              onClick={selectAll}
              className={`text-[10px] font-bold uppercase tracking-[.15em] px-3 py-1.5 rounded border transition-colors cursor-pointer ${
                allSelected
                  ? "bg-[#111] text-white border-[#111]"
                  : "bg-white text-[#666] border-black/10 hover:border-[#111]"
              }`}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>

            {selected.size > 0 && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999]">
                  {selected.size} selected
                </span>
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="text-[10px] font-bold uppercase tracking-[.15em] px-3 py-1.5 rounded bg-brand text-white hover:bg-brand/80 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete Selected"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-[#999] text-sm">
            Loading...
          </div>
        ) : (
          <AdminMediaGrid
            items={items}
            setItems={setItems}
            selected={selected}
            onToggleSelect={toggleSelect}
            onDelete={handleDelete}
            onToggleFeatured={handleToggleFeatured}
            onSendToTop={handleSendToTop}
            onSendToBottom={handleSendToBottom}
            onUpdateAltText={handleUpdateAltText}
            onGenerateCaption={(id) => setCaptionItemId(id)}
            onCrop={(id) => setCropItemId(id)}
          />
        )}
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <AddVideoModal
          onClose={() => setShowVideoModal(false)}
          onAdded={fetchItems}
        />
      )}

      {/* Caption Modal */}
      {captionItemId !== null && (() => {
        const captionItem = items.find((i) => i.id === captionItemId);
        return captionItem ? (
          <GenerateCaptionModal
            item={captionItem}
            onClose={() => setCaptionItemId(null)}
            onSave={handleSaveCaption}
          />
        ) : null;
      })()}

      {/* Crop Modal */}
      {cropItemId !== null && (() => {
        const cropItem = items.find((i) => i.id === cropItemId);
        return cropItem ? (
          <CropModal
            item={cropItem}
            onClose={() => setCropItemId(null)}
            onCropped={(updated) => {
              setItems((prev) =>
                prev.map((i) => (i.id === updated.id ? updated : i))
              );
            }}
          />
        ) : null;
      })()}
    </div>
  );
}

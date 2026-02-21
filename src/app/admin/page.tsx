"use client";

import { useState, useEffect, useCallback } from "react";
import type { MediaItem } from "@/db/schema";
import UploadDropzone from "@/components/admin/UploadDropzone";
import AdminMediaGrid from "@/components/admin/AdminMediaGrid";
import AddVideoModal from "@/components/admin/AddVideoModal";

export default function AdminDashboard() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [loading, setLoading] = useState(true);

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

  async function handleLogout() {
    document.cookie = "auth-token=; path=/; max-age=0";
    window.location.href = "/admin/login";
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
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

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-black/[.08] px-6 py-4 flex items-center justify-between">
        <h1 className="font-display text-xl">
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
        <div className="flex items-center justify-between mb-6">
          <div className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999]">
            Media Library — {items.length} items
          </div>
          <button
            onClick={() => setShowVideoModal(true)}
            className="text-[10px] font-bold uppercase tracking-[.15em] bg-[#111] text-white px-4 py-2 rounded hover:bg-brand transition-colors cursor-pointer"
          >
            + Add Video
          </button>
        </div>

        {/* Upload */}
        <UploadDropzone onUploadComplete={fetchItems} />

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-[#999] text-sm">
            Loading...
          </div>
        ) : (
          <AdminMediaGrid
            items={items}
            setItems={setItems}
            onDelete={handleDelete}
            onToggleFeatured={handleToggleFeatured}
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
    </div>
  );
}

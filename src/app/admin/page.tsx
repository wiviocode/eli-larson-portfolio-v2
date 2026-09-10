"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MediaItem } from "@/db/schema";
import UploadDropzone from "@/components/admin/UploadDropzone";
import AdminMediaGrid from "@/components/admin/AdminMediaGrid";
import AddVideoModal from "@/components/admin/AddVideoModal";
import GenerateCaptionModal from "@/components/admin/GenerateCaptionModal";
import CropModal from "@/components/admin/CropModal";
import { filterMedia, mergeMediaOrder, type LibraryFilter } from "@/lib/media-library";

export default function AdminDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [captionItemId, setCaptionItemId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [cropItemId, setCropItemId] = useState<number | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("photo");
  const [uploadType, setUploadType] = useState<"photo" | "graphic">("photo");
  const [uploading, setUploading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [ordering, setOrdering] = useState(false);
  const orderBusy = useRef(false);
  const visibleItems = filterMedia(items, libraryFilter);


  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/media");
      if (!res.ok) throw new Error("Unable to load the media library. Please reload and try again.");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      setLibraryError((error as Error).message);
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
    if (selected.size === visibleItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleItems.map((i) => i.id)));
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth", { method: "DELETE" });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/admin/login");
      router.refresh();
    } catch {
      alert("Unable to log out. Please try again.");
    }
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
    if (!res.ok) throw new Error("Unable to save. Your text is still here; please try again.");
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, caption } : i))
      );
    }
  }

  async function handleExportCsv() {
    const link = document.createElement("a");
    link.href = "/api/media/csv";
    link.download = "captions.csv";
    link.click();
  }

  async function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media/csv", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (!res.ok) {
        alert(`Import failed: ${result.error}`);
      } else {
        const msg = `Updated ${result.updated} item(s).`;
        if (result.errors?.length > 0) {
          alert(`${msg}\n\nWarnings:\n${result.errors.join("\n")}`);
        } else {
          alert(msg);
        }
        fetchItems();
      }
    } catch {
      alert("Import failed. Please check the file format.");
    } finally {
      setCsvImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  }

  async function handleSendToTop(id: number) {
    const idx = visibleItems.findIndex((i) => i.id === id);
    if (idx <= 0) return;
    const reordered = [...visibleItems];
    const [moved] = reordered.splice(idx, 1);
    reordered.unshift(moved);
    await handleReorder(reordered);
  }

  async function handleSendToBottom(id: number) {
    const idx = visibleItems.findIndex((i) => i.id === id);
    if (idx === -1 || idx === visibleItems.length - 1) return;
    const reordered = [...visibleItems];
    const [moved] = reordered.splice(idx, 1);
    reordered.push(moved);
    await handleReorder(reordered);
  }

  async function handleReorder(visibleOrder: MediaItem[]) {
    if (orderBusy.current) return;
    orderBusy.current = true;
    setOrdering(true);
    setLibraryError("");
    const previous = items;
    try {
      const reordered = mergeMediaOrder(items, visibleOrder);
      setItems(reordered);
      const response = await fetch("/api/media/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reordered.map((item, sortOrder) => ({ id: item.id, sortOrder }))),
      });
      if (!response.ok) throw new Error("Unable to save the order. Please try again.");
    } catch (error) {
      setItems(previous);
      setLibraryError((error as Error).message);
    } finally {
      orderBusy.current = false;
      setOrdering(false);
    }
  }

  async function handleChangeType(id: number, type: "photo" | "graphic") {
    setLibraryError("");
    try {
      const response = await fetch(`/api/media/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to move this item.");
      setItems(previous => previous.map(item => item.id === id ? result : item));
      setSelected(previous => new Set([...previous].filter(value => value !== id)));
    } catch (error) { setLibraryError((error as Error).message); }
  }

  const allSelected = visibleItems.length > 0 && selected.size === visibleItems.length;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-black/[.08] px-6 py-4 flex flex-wrap gap-3 items-center justify-between">
        <h1 className="font-serif-display text-xl">
          Admin Panel<span className="text-brand">.</span>
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/presentation" className="text-[10px] font-bold uppercase tracking-[.15em] text-[#666] hover:text-brand">Presentation</Link>
          <Link
            href="/"
            className="text-[10px] font-bold uppercase tracking-[.15em] text-[#666] hover:text-brand transition-colors"
          >
            View Site
          </Link>
          <button
            onClick={handleLogout}
            className="text-[10px] font-bold uppercase tracking-[.15em] text-[#666] hover:text-brand transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="admin-library-nav" role="group" aria-label="Media library view">
          {([{ value: "photo", label: "Photos" }, { value: "video", label: "Videos" }, { value: "graphic", label: "Graphics" }, { value: "all", label: "All media" }] as const).map(filter => <button key={filter.value} type="button" aria-pressed={libraryFilter === filter.value} disabled={uploading || ordering} onClick={() => { setLibraryFilter(filter.value); setSelected(new Set()); }}>
            {filter.label} <span>{filterMedia(items, filter.value).length}</span>
          </button>)}
        </div>
        <p className="admin-library-help">{libraryFilter === "graphic" ? "Upload design exports, edit titles and descriptions, and arrange your Graphics page." : libraryFilter === "video" ? "Add films and arrange the Videos page." : "Manage the full photo library here. The homepage opens on Editor’s Selection."} <Link href="/admin/presentation">Edit Editor’s Selection, stories & photo information →</Link></p>
        {libraryError && <p role="alert" className="text-sm text-brand mb-5">{libraryError}</p>}
        {/* Stats + Actions */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999]">
            Media Library — {items.length} items
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleExportCsv}
              className="text-[10px] font-bold uppercase tracking-[.15em] bg-white text-[#666] px-4 py-2 rounded border border-black/10 hover:border-[#111] transition-colors cursor-pointer"
            >
              Export CSV
            </button>
            <button
              onClick={() => csvInputRef.current?.click()}
              disabled={csvImporting}
              className="text-[10px] font-bold uppercase tracking-[.15em] bg-white text-[#666] px-4 py-2 rounded border border-black/10 hover:border-[#111] transition-colors cursor-pointer disabled:opacity-50"
            >
              {csvImporting ? "Importing..." : "Import CSV"}
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCsv}
              className="hidden"
            />
            <button
              onClick={() => setShowVideoModal(true)}
              className="text-[10px] font-bold uppercase tracking-[.15em] bg-[#111] text-white px-4 py-2 rounded hover:bg-brand transition-colors cursor-pointer"
            >
              + Add Video
            </button>
          </div>
        </div>

        {/* Upload */}
        {libraryFilter === "all" && <label className="admin-upload-target">Upload images as
          <select value={uploadType} disabled={uploading} onChange={event => setUploadType(event.target.value as "photo" | "graphic")}><option value="photo">Photos</option><option value="graphic">Graphics</option></select>
        </label>}
        {libraryFilter !== "video" && <UploadDropzone mediaType={libraryFilter === "graphic" ? "graphic" : libraryFilter === "all" ? uploadType : "photo"} onUploadComplete={fetchItems} onBusyChange={setUploading} />}

        {/* Selection toolbar */}
        {visibleItems.length > 0 && (
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
          <fieldset disabled={ordering || uploading}>
          <AdminMediaGrid
            items={visibleItems}
            onReorder={handleReorder}
            selected={selected}
            onToggleSelect={toggleSelect}
            onDelete={handleDelete}
            onToggleFeatured={handleToggleFeatured}
            onSendToTop={handleSendToTop}
            onSendToBottom={handleSendToBottom}
            onUpdateAltText={handleUpdateAltText}
            onGenerateCaption={(id) => setCaptionItemId(id)}
            onCrop={(id) => setCropItemId(id)}
            onChangeType={handleChangeType}
          />
          </fieldset>
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

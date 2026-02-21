"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import type { MediaItem } from "@/db/schema";
import SortableMediaCard from "./SortableMediaCard";

export default function AdminMediaGrid({
  items,
  setItems,
  onDelete,
  onToggleFeatured,
}: {
  items: MediaItem[];
  setItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  onDelete: (id: number) => void;
  onToggleFeatured: (id: number, current: boolean) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setItems(reordered);

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

  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-[#999] text-sm">
        No media items yet. Upload some photos or add a video.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={rectSortingStrategy}
      >
        {/* Matches public gallery: 3 cols desktop, 2 tablet, 1 mobile */}
        <div className="gallery-label max-w-[1300px] mx-auto pb-6 text-[10px] font-extrabold uppercase tracking-[.25em] text-brand">
          Gallery Preview
        </div>
        <div className="masonry" style={{ padding: 0 }}>
          {items.map((item) => (
            <SortableMediaCard
              key={item.id}
              item={item}
              onDelete={onDelete}
              onToggleFeatured={onToggleFeatured}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

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
  selected,
  onToggleSelect,
  onDelete,
  onToggleFeatured,
  onSendToTop,
  onSendToBottom,
  onUpdateAltText,
}: {
  items: MediaItem[];
  setItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  selected: Set<number>;
  onToggleSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleFeatured: (id: number, current: boolean) => void;
  onSendToTop: (id: number) => void;
  onSendToBottom: (id: number) => void;
  onUpdateAltText: (id: number, altText: string) => void;
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
        <div className="masonry" style={{ padding: 0 }}>
          {items.map((item, index) => (
            <SortableMediaCard
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              isSelected={selected.has(item.id)}
              onToggleSelect={onToggleSelect}
              onDelete={onDelete}
              onToggleFeatured={onToggleFeatured}
              onSendToTop={onSendToTop}
              onSendToBottom={onSendToBottom}
              onUpdateAltText={onUpdateAltText}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

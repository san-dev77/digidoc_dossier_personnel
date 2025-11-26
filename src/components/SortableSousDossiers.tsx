"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { SousDossier } from "@/services/sous-dossiers";

interface SortableSousDossiersProps {
  sousDossiers: SousDossier[];
  onReorder: (newOrder: SousDossier[]) => void;
  children: (sousDossier: SousDossier, index: number) => React.ReactNode;
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 cursor-grab active:cursor-grabbing z-10 p-2 hover:bg-gray-100 rounded transition-colors"
      >
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>
      {children}
    </div>
  );
}

export default function SortableSousDossiers({
  sousDossiers,
  onReorder,
  children,
}: SortableSousDossiersProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sousDossiers.findIndex(
        (sd) => sd.id === active.id.toString()
      );
      const newIndex = sousDossiers.findIndex(
        (sd) => sd.id === over.id.toString()
      );

      const newOrder = arrayMove(sousDossiers, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sousDossiers.map((sd) => sd.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-6">
          {sousDossiers.map((sousDossier, index) => (
            <SortableItem key={sousDossier.id} id={sousDossier.id}>
              {children(sousDossier, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}


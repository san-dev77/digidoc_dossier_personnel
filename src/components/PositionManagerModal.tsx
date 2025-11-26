"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  X,
  FolderTree,
  FileText,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { positionsService } from "@/services/positions";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";
import type { SousDossier } from "@/services/sous-dossiers";
import type { Piece } from "@/types";

interface PositionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rubriqueId: string;
  sousDossiers: SousDossier[];
  onUpdate: () => void;
}

interface SousDossierWithPieces extends SousDossier {
  pieces: Piece[];
}

// Composant pour un sous-dossier draggable
function SortableSousDossier({
  sousDossier,
  index,
  totalItems,
  isExpanded,
  onToggleExpand,
  onMoveSousDossier,
  onMovePiece,
}: {
  sousDossier: SousDossierWithPieces;
  index: number;
  totalItems: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMoveSousDossier: (index: number, direction: "up" | "down") => void;
  onMovePiece: (
    sdIndex: number,
    pieceIndex: number,
    direction: "up" | "down"
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `sous-dossier-${sousDossier.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-2 rounded-xl overflow-hidden transition-all duration-200 ${
        isDragging
          ? "border-indigo-500 shadow-2xl scale-105 bg-indigo-50 z-50"
          : "border-gray-200 hover:border-indigo-300 hover:shadow-lg"
      }`}
    >
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 flex items-center gap-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-white/50 rounded-lg transition-colors"
        >
          <GripVertical className="w-6 h-6 text-indigo-600" />
        </div>
        <button
          onClick={onToggleExpand}
          className="p-1 hover:bg-white/50 rounded-lg transition-colors"
          title={isExpanded ? "Réduire" : "Développer"}
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-indigo-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-indigo-600" />
          )}
        </button>
        <FolderTree className="w-6 h-6 text-indigo-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg">
            {sousDossier.titre}
          </h3>
          {sousDossier.description && (
            <p className="text-sm text-gray-600 mt-1 truncate">
              {sousDossier.description}
            </p>
          )}
        </div>
        <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
          {sousDossier.pieces.length} pièce
          {sousDossier.pieces.length > 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveSousDossier(index, "up");
            }}
            disabled={index === 0}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
            title="Déplacer vers le haut"
          >
            <ChevronUp className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveSousDossier(index, "down");
            }}
            disabled={index === totalItems - 1}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
            title="Déplacer vers le bas"
          >
            <ChevronDown className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {sousDossier.pieces.length > 0 && (
        <div
          className={`bg-gray-50 overflow-hidden transition-all duration-300 ${
            isExpanded
              ? "max-h-[2000px] opacity-100 p-4 space-y-2"
              : "max-h-0 opacity-0 p-0"
          }`}
        >
          <SortableContext
            items={sousDossier.pieces.map((p) => `piece-${p.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {sousDossier.pieces.map((piece, pieceIndex) => (
              <SortablePiece
                key={piece.id}
                piece={piece}
                sousDossierIndex={index}
                pieceIndex={pieceIndex}
                totalPieces={sousDossier.pieces.length}
                onMove={onMovePiece}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// Composant pour une pièce draggable
function SortablePiece({
  piece,
  sousDossierIndex,
  pieceIndex,
  totalPieces,
  onMove,
}: {
  piece: Piece;
  sousDossierIndex: number;
  pieceIndex: number;
  totalPieces: number;
  onMove: (
    sdIndex: number,
    pieceIndex: number,
    direction: "up" | "down"
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `piece-${piece.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 rounded-lg p-3 flex items-center gap-3 transition-all duration-200 ${
        isDragging
          ? "border-purple-500 shadow-xl scale-105 bg-purple-50 z-50"
          : "border-gray-200 hover:border-purple-300 hover:shadow-md"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
      >
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>
      <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{piece.nom}</p>
        {piece.description && (
          <p className="text-sm text-gray-600 truncate">{piece.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMove(sousDossierIndex, pieceIndex, "up");
          }}
          disabled={pieceIndex === 0}
          className="p-1.5 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          title="Déplacer vers le haut"
        >
          <ChevronUp className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMove(sousDossierIndex, pieceIndex, "down");
          }}
          disabled={pieceIndex === totalPieces - 1}
          className="p-1.5 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          title="Déplacer vers le bas"
        >
          <ChevronDown className="w-4 h-4 text-gray-700" />
        </button>
      </div>
    </div>
  );
}

export default function PositionManagerModal({
  isOpen,
  onClose,
  rubriqueId,
  sousDossiers,
  onUpdate,
}: PositionManagerModalProps) {
  const [items, setItems] = useState<SousDossierWithPieces[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{
    type: "sous-dossier" | "piece";
    data: SousDossierWithPieces | Piece;
  } | null>(null);
  const [expandedSousDossiers, setExpandedSousDossiers] = useState<Set<string>>(
    new Set()
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const positions = await positionsService.getSousDossierPositions(
        rubriqueId
      );

      const itemsWithPieces: SousDossierWithPieces[] = await Promise.all(
        sousDossiers.map(async (sd) => {
          try {
            const response = await fetchWithAuth(
              `/api/pieces?sousDossierId=${sd.id}`
            );
            const pieces = response.ok ? await response.json() : [];

            const piecePositions = await positionsService.getPiecePositions(
              sd.id
            );

            const sortedPieces = pieces.sort((a: Piece, b: Piece) => {
              const posA =
                piecePositions.find((p) => p.piece_id === parseInt(a.id))
                  ?.position ?? 999;
              const posB =
                piecePositions.find((p) => p.piece_id === parseInt(b.id))
                  ?.position ?? 999;
              return posA - posB;
            });

            return {
              ...sd,
              pieces: sortedPieces,
            };
          } catch (error) {
            console.error(
              `Erreur lors du chargement des pièces pour ${sd.id}:`,
              error
            );
            return { ...sd, pieces: [] };
          }
        })
      );

      const sortedItems = itemsWithPieces.sort((a, b) => {
        const posA =
          positions.find((p) => p.sous_dossier_id === parseInt(a.id))
            ?.position ?? 999;
        const posB =
          positions.find((p) => p.sous_dossier_id === parseInt(b.id))
            ?.position ?? 999;
        return posA - posB;
      });

      setItems(sortedItems);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  }, [rubriqueId, sousDossiers]);

  useEffect(() => {
    if (isOpen && rubriqueId) {
      loadData();
    }
  }, [isOpen, rubriqueId, loadData]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const id = event.active.id as string;

    if (id.startsWith("sous-dossier-")) {
      const sdId = id.replace("sous-dossier-", "");
      const item = items.find((sd) => sd.id === sdId);
      if (item) {
        setDraggedItem({ type: "sous-dossier", data: item });
      }
    } else if (id.startsWith("piece-")) {
      const pieceId = id.replace("piece-", "");
      for (const sd of items) {
        const piece = sd.pieces.find((p) => p.id === pieceId);
        if (piece) {
          setDraggedItem({ type: "piece", data: piece });
          break;
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Gestion du déplacement des sous-dossiers
    if (
      activeId.startsWith("sous-dossier-") &&
      overId.startsWith("sous-dossier-")
    ) {
      const oldIndex = items.findIndex(
        (sd) => `sous-dossier-${sd.id}` === activeId
      );
      const newIndex = items.findIndex(
        (sd) => `sous-dossier-${sd.id}` === overId
      );

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setItems((prevItems) => {
          const newItems = arrayMove(prevItems, oldIndex, newIndex);
          return newItems;
        });
      }
    }

    // Gestion du déplacement des pièces
    if (activeId.startsWith("piece-") && overId.startsWith("piece-")) {
      const activePieceId = activeId.replace("piece-", "");
      const overPieceId = overId.replace("piece-", "");

      // Trouver les sous-dossiers et indices des pièces
      let activeSdIndex = -1;
      let activePieceIndex = -1;
      let overSdIndex = -1;
      let overPieceIndex = -1;

      for (let i = 0; i < items.length; i++) {
        const activeIdx = items[i].pieces.findIndex(
          (p) => p.id === activePieceId
        );
        if (activeIdx !== -1) {
          activeSdIndex = i;
          activePieceIndex = activeIdx;
        }

        const overIdx = items[i].pieces.findIndex((p) => p.id === overPieceId);
        if (overIdx !== -1) {
          overSdIndex = i;
          overPieceIndex = overIdx;
        }
      }

      // Seulement si dans le même sous-dossier
      if (
        activeSdIndex !== -1 &&
        overSdIndex !== -1 &&
        activeSdIndex === overSdIndex
      ) {
        setItems((prevItems) => {
          const newItems = [...prevItems];
          newItems[activeSdIndex].pieces = arrayMove(
            newItems[activeSdIndex].pieces,
            activePieceIndex,
            overPieceIndex
          );
          return newItems;
        });
      }
    }

    setActiveId(null);
    setDraggedItem(null);
  };

  const moveSousDossier = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === items.length - 1)
    ) {
      return;
    }

    const newItems = [...items];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const temp = newItems[index];
    newItems[index] = newItems[newIndex];
    newItems[newIndex] = temp;
    setItems(newItems);
  };

  const toggleSousDossier = (sousDossierId: string) => {
    setExpandedSousDossiers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sousDossierId)) {
        newSet.delete(sousDossierId);
      } else {
        newSet.add(sousDossierId);
      }
      return newSet;
    });
  };

  const movePiece = (
    sousDossierIndex: number,
    pieceIndex: number,
    direction: "up" | "down"
  ) => {
    const newItems = [...items];
    const pieces = [...newItems[sousDossierIndex].pieces];

    if (
      (direction === "up" && pieceIndex === 0) ||
      (direction === "down" && pieceIndex === pieces.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? pieceIndex - 1 : pieceIndex + 1;
    const temp = pieces[pieceIndex];
    pieces[pieceIndex] = pieces[newIndex];
    pieces[newIndex] = temp;
    newItems[sousDossierIndex].pieces = pieces;
    setItems(newItems);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sousDossierPositions = items.map((item, index) => ({
        sousDossierId: parseInt(item.id),
        position: index,
      }));

      await positionsService.updateSousDossierPositions(
        rubriqueId,
        sousDossierPositions
      );

      for (const item of items) {
        const piecePositions = item.pieces.map((piece, index) => ({
          pieceId: parseInt(piece.id),
          position: index,
        }));

        if (piecePositions.length > 0) {
          await positionsService.updatePiecePositions(item.id, piecePositions);
        }
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde des positions");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header amélioré */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Gérer l&apos;ordre des éléments
              </h2>
              <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                <GripVertical className="w-4 h-4" />
                Glissez-déposez les éléments pour les réorganiser
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/80 rounded-xl transition-all hover:scale-110"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content avec DnD */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                <div className="absolute inset-0 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin animate-reverse"></div>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((sd) => `sous-dossier-${sd.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {items.map((sousDossier, index) => (
                    <SortableSousDossier
                      key={sousDossier.id}
                      sousDossier={sousDossier}
                      index={index}
                      totalItems={items.length}
                      isExpanded={expandedSousDossiers.has(sousDossier.id)}
                      onToggleExpand={() => toggleSousDossier(sousDossier.id)}
                      onMoveSousDossier={moveSousDossier}
                      onMovePiece={movePiece}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {draggedItem && (
                  <div className="bg-white border-2 border-indigo-500 rounded-xl shadow-2xl p-4 transform rotate-2">
                    {draggedItem.type === "sous-dossier" ? (
                      <div className="flex items-center gap-3">
                        <FolderTree className="w-6 h-6 text-indigo-600" />
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {(draggedItem.data as SousDossierWithPieces).titre}
                          </h3>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <p className="font-semibold text-gray-900">
                          {(draggedItem.data as Piece).nom}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-20">
              <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                Aucun sous-dossier à afficher
              </p>
            </div>
          )}
        </div>

        {/* Footer amélioré */}
        <div className="px-8 py-5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {items.length} sous-dossier{items.length > 1 ? "s" : ""} •{" "}
            {items.reduce((acc, sd) => acc + sd.pieces.length, 0)} pièce
            {items.reduce((acc, sd) => acc + sd.pieces.length, 0) > 1
              ? "s"
              : ""}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-all font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sauvegarde...
                </span>
              ) : (
                "Enregistrer l'ordre"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

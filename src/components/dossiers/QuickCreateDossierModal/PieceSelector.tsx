"use client";

import { Search, Loader2, Database } from "lucide-react";
import type { Piece } from "@/types";
import PieceFileUpload from "./PieceFileUpload";

interface MetadataModel {
  id: string;
  piece_id: string;
  libelle: string;
  type: string;
  obligatoire: boolean;
  description?: string;
  created_at: string;
}

interface PieceSelectorProps {
  pieces: Piece[];
  selectedPieces: Set<string>;
  piecesWithFiles: Map<string, File[]>;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onToggleSelection: (pieceId: string) => void;
  onFileChange: (pieceId: string, files: FileList | null) => void;
  onDrop: (pieceId: string, e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onRemoveFile: (pieceId: string, fileIndex: number) => void;
  onPreviewFile: (file: File, pieceId: string) => void;
  formatFileSize: (bytes: number) => string;
  piecesMetadataModels: Map<string, MetadataModel[]>;
  metadataValues: Record<string, string>;
  onMetadataChange: (pieceId: string, modelId: string, value: string) => void;
}

export default function PieceSelector({
  pieces,
  selectedPieces,
  piecesWithFiles,
  loading,
  searchTerm,
  onSearchChange,
  onToggleSelection,
  onFileChange,
  onDrop,
  onDragOver,
  onRemoveFile,
  onPreviewFile,
  formatFileSize,
  piecesMetadataModels,
  metadataValues,
  onMetadataChange,
}: PieceSelectorProps) {
  const filteredPieces = pieces.filter((p) =>
    searchTerm ? p.nom.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  return (
    <div>
      <h3 className="text-xl font-bold text-primary-900 mb-4">
        Sélectionnez les pièces et ajoutez les fichiers
      </h3>
      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-600" />
          <input
            type="text"
            placeholder="Rechercher une pièce..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-primary-900 bg-white"
          />
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : filteredPieces.length > 0 ? (
        <div className="space-y-4">
          {filteredPieces.map((piece) => {
            const isSelected = selectedPieces.has(piece.id);
            const files = piecesWithFiles.get(piece.id) || [];
            const metadataModels = piecesMetadataModels.get(piece.id) || [];

            return (
              <div
                key={piece.id}
                onClick={() => onToggleSelection(piece.id)}
                className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary-600 bg-primary-100 shadow-lg"
                    : "border-primary-300 hover:border-primary-500 hover:bg-primary-50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelection(piece.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-6 h-6 text-primary-600 rounded border-2 border-primary-400 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="font-bold text-primary-900 text-lg">
                      {piece.nom}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                    {/* Métadonnées */}
                    {metadataModels.length > 0 && (
                      <div className="p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                        <h4 className="text-sm font-bold text-primary-900 mb-3 border-b-2 border-primary-300 pb-2 flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          Métadonnées ({metadataModels.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {metadataModels.map((model) => (
                            <div
                              key={model.id}
                              className="space-y-2 bg-white p-3 rounded-lg border-2 border-primary-200"
                            >
                              <label className="text-sm font-bold text-primary-900">
                                {model.libelle}
                                {model.obligatoire && (
                                  <span className="text-red-600 ml-1 font-bold">*</span>
                                )}
                              </label>
                              {model.type === "text" && (
                                <input
                                  type="text"
                                  value={metadataValues[`${piece.id}_${model.id}`] || ""}
                                  onChange={(e) =>
                                    onMetadataChange(piece.id, model.id, e.target.value)
                                  }
                                  placeholder={`Saisir ${model.libelle.toLowerCase()}`}
                                  className="w-full px-3 py-2 border-2 border-primary-400 bg-white rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-primary-900 font-medium shadow-sm"
                                />
                              )}
                              {model.type === "number" && (
                                <input
                                  type="number"
                                  value={metadataValues[`${piece.id}_${model.id}`] || ""}
                                  onChange={(e) =>
                                    onMetadataChange(piece.id, model.id, e.target.value)
                                  }
                                  placeholder={`Saisir ${model.libelle.toLowerCase()}`}
                                  className="w-full px-3 py-2 border-2 border-primary-400 bg-white rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-primary-900 font-medium shadow-sm"
                                />
                              )}
                              {model.type === "date" && (
                                <input
                                  type="date"
                                  value={metadataValues[`${piece.id}_${model.id}`] || ""}
                                  onChange={(e) =>
                                    onMetadataChange(piece.id, model.id, e.target.value)
                                  }
                                  className="w-full px-3 py-2 border-2 border-primary-400 bg-white text-primary-900 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 font-medium shadow-sm"
                                />
                              )}
                              {model.type === "boolean" && (
                                <select
                                  value={metadataValues[`${piece.id}_${model.id}`] || ""}
                                  onChange={(e) =>
                                    onMetadataChange(piece.id, model.id, e.target.value)
                                  }
                                  className="w-full px-3 py-2 border-2 border-primary-400 bg-white rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-primary-900 font-medium shadow-sm"
                                >
                                  <option value="">Sélectionner...</option>
                                  <option value="true">Oui</option>
                                  <option value="false">Non</option>
                                </select>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload de fichiers */}
                    <PieceFileUpload
                      pieceId={piece.id}
                      files={files}
                      onFileChange={onFileChange}
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onRemoveFile={onRemoveFile}
                      onPreviewFile={onPreviewFile}
                      formatFileSize={formatFileSize}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-12 text-primary-700 font-medium">
          {searchTerm
            ? "Aucune pièce trouvée"
            : "Aucune pièce disponible pour ce sous-dossier"}
        </div>
      )}
    </div>
  );
}


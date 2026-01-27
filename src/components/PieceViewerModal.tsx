"use client";

import { useEffect, useState, useRef } from "react";
import {
  X,
  Database,
  FileText,
  Eye,
  Calendar,
  DatabaseZap,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { PieceContext, PieceData } from "@/services/agent-data";
import FileViewerModal from "./PieceViewerModal/FileViewerModal";
import FilePreview from "./PieceViewerModal/FilePreview";

// Type pour les fichiers avec mime_type (peut être différent de FileData)
type FileWithMimeType = {
  id: string;
  filePath: string;
  file_path?: string; // Backward compatibility
  mimeType?: string;
  mime_type?: string; // Backward compatibility
  createdAt?: string;
  created_at?: string; // Backward compatibility
};

interface PieceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pieceData: PieceData | null;
  pieceContext?: PieceContext | null;
  onFilesChanged?: (params: {
    files: PieceData["files"];
    context?: PieceContext | null;
  }) => void;
}

export default function PieceViewerModal({
  isOpen,
  onClose,
  pieceData,
  pieceContext,
  onFilesChanged,
}: PieceViewerModalProps) {
  const [files, setFiles] = useState<PieceData["files"]>([]);
  const [activeTab, setActiveTab] = useState<"metadata" | "files">("metadata");
  const [selectedFile, setSelectedFile] = useState<FileWithMimeType | null>(
    null
  );
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const previousFilesRef = useRef<PieceData["files"]>([]);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    if (pieceData) {
      setFiles(pieceData.files);
      setSelectedFile(null);
      previousFilesRef.current = pieceData.files;
      isInitialMountRef.current = true;
    } else {
      setFiles([]);
      previousFilesRef.current = [];
      isInitialMountRef.current = true;
    }
  }, [pieceData]);

  useEffect(() => {
    if (selectedFile && !files.some((file) => file.id === selectedFile.id)) {
      setSelectedFile(null);
    }
  }, [files, selectedFile]);

  // Notifier le parent des changements de fichiers (seulement après une suppression)
  useEffect(() => {
    // Ignorer le premier rendu (initialisation)
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Vérifier si les fichiers ont vraiment changé (par exemple, après une suppression)
    const filesChanged =
      files.length !== previousFilesRef.current.length ||
      files.some(
        (file, index) => file.id !== previousFilesRef.current[index]?.id
      );

    if (filesChanged && pieceContext && onFilesChanged) {
      // Utiliser setTimeout pour s'assurer que c'est après le rendu
      const timeoutId = setTimeout(() => {
        onFilesChanged({ files, context: pieceContext });
        previousFilesRef.current = files;
      }, 0);
      return () => clearTimeout(timeoutId);
    } else {
      previousFilesRef.current = files;
    }
  }, [files, pieceContext, onFilesChanged]);

  if (!isOpen || !pieceData) return null;

  const handleViewFile = (file: FileWithMimeType) => {
    setSelectedFile(file);
  };

  const closeFileViewer = () => {
    setSelectedFile(null);
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    const fileName = (filePath || "").split("/").pop() || "ce fichier";
    const confirmDelete = window.confirm(
      `Supprimer définitivement ${fileName} ?`
    );
    if (!confirmDelete) return;

    setDeletingFileId(fileId);
    setDeleteError(null);

    try {
      const headers: HeadersInit = {};
      if (typeof window !== "undefined") {
        const token = sessionStorage.getItem("auth-token");
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "Impossible de supprimer ce fichier"
        );
      }

      setFiles((prev) => prev.filter((file) => file.id !== fileId));
    } catch (error) {
      console.error("Erreur suppression fichier:", error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression du fichier"
      );
    } finally {
      setDeletingFileId(null);
    }
  };

  const hasFiles = files.length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 transition-all duration-300 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500/5 to-blue-500/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {pieceData.piece.nom}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {pieceData.piece.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Créé le{" "}
                    {new Date(pieceData.piece.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {hasFiles && (
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>{files.length} fichier(s)</span>
                  </div>
                )}
                {pieceData.metadata.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Database className="w-4 h-4" />
                    <span>{pieceData.metadata.length} métadonnée(s)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("metadata")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "metadata"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Métadonnées ({pieceData.metadata.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "files"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Fichiers ({files.length})
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "metadata" && (
            <div className="space-y-4">
              {pieceData.metadata.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-medium mb-2">
                    Aucune métadonnée
                  </p>
                  <p className="text-sm text-gray-500">
                    Cette pièce ne contient pas de métadonnées
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-100 to-slate-200 border-b-2 border-slate-300">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 bg-white/50">
                            #
                          </th>
                          {(() => {
                            // Grouper les métadonnées par libelle pour les en-têtes
                            const groupedMetadata = pieceData.metadata.reduce(
                              (acc, meta) => {
                                const libelle =
                                  meta.metadataModel?.libelle || "Métadonnée";
                                if (!acc[libelle]) {
                                  acc[libelle] = {
                                    libelle,
                                    obligatoire:
                                      meta.metadataModel?.obligatoire || false,
                                  };
                                }
                                return acc;
                              },
                              {} as Record<
                                string,
                                { libelle: string; obligatoire: boolean }
                              >
                            );

                            return Object.values(groupedMetadata).map(
                              (group) => (
                                <th
                                  key={group.libelle}
                                  className="px-4 py-3 text-left text-sm font-bold text-slate-800 bg-white/50"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{group.libelle}</span>
                                    {group.obligatoire && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-500 text-white shadow-sm">
                                        *
                                      </span>
                                    )}
                                  </div>
                                </th>
                              )
                            );
                          })()}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {(() => {
                          // Grouper les métadonnées par libelle
                          const groupedMetadata = pieceData.metadata.reduce(
                            (acc, meta) => {
                              const libelle =
                                meta.metadataModel?.libelle || "Métadonnée";
                              if (!acc[libelle]) {
                                acc[libelle] = {
                                  libelle,
                                  obligatoire:
                                    meta.metadataModel?.obligatoire || false,
                                  values: [],
                                };
                              }
                              acc[libelle].values.push(meta);
                              return acc;
                            },
                            {} as Record<
                              string,
                              {
                                libelle: string;
                                obligatoire: boolean;
                                values: object[];
                              }
                            >
                          );

                          const groups = Object.values(groupedMetadata);
                          const maxRows = Math.max(
                            ...groups.map((group) => group.values.length)
                          );

                          // Créer les lignes du tableau
                          return Array.from(
                            { length: maxRows },
                            (_, rowIndex) => (
                              <tr
                                key={rowIndex}
                                className="hover:bg-slate-500 bg-gray-100 transition-colors"
                              >
                                <td className="px-4 py-3 text-sm font-medium text-slate-600 border-r border-slate-200">
                                  <DatabaseZap className="w-4 h-4" />
                                </td>
                                {groups.map((group) => {
                                  const value = group.values[rowIndex] as {
                                    valeur: string;
                                  };
                                  return (
                                    <td
                                      key={group.libelle}
                                      className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200"
                                    >
                                      {value ? (
                                        <span className="bg-slate-50 rounded-lg px-3 py-2 inline-block">
                                          {value.valeur || (
                                            <span className="text-slate-400 italic">
                                              Aucune valeur
                                            </span>
                                          )}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300 italic">
                                          -
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            )
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "files" && (
            <div className="space-y-4">
              {deleteError && (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-error-200 bg-error-50 text-error-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{deleteError}</p>
                </div>
              )}
              {files.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-medium mb-2">
                    Aucun fichier
                  </p>
                  <p className="text-sm text-gray-500">
                    Cette pièce ne contient pas de fichiers
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-100 to-slate-200 border-b-2 border-slate-300">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 bg-white/50">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 bg-white/50">
                            Aperçu
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 bg-white/50">
                            Nom du fichier
                          </th>

                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 bg-white/50">
                            Date de création
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 bg-white/50">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {files.map((file) => (
                          <tr
                            key={file.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-slate-600 border-r border-slate-200">
                              <FileText className="w-4 h-4" />
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">
                              <FilePreview
                                file={file as FileWithMimeType}
                                fileName={((file as any).filePath || (file as any).file_path || "").split("/").pop() || "fichier"}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">
                              <span
                                className="bg-slate-50 rounded-lg px-3 py-2 font-medium max-w-xs truncate block"
                                title={((file as any).filePath || (file as any).file_path || "").split("/").pop()}
                              >
                                {(() => {
                                  const fileName =
                                    ((file as any).filePath || (file as any).file_path || "").split("/").pop() || "fichier";
                                  return fileName.length > 25
                                    ? fileName.substring(0, 22) + "..."
                                    : fileName;
                                })()}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">
                              <span className="bg-slate-50 rounded-lg px-3 py-2 inline-block">
                                {new Date((file as any).createdAt || (file as any).created_at || new Date()).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-800">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleViewFile(file as FileWithMimeType)
                                  }
                                  className="flex items-center justify-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs font-semibold"
                                >
                                  <Eye className="w-3 h-3" />
                                  Voir
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteFile(file.id, (file as any).filePath || (file as any).file_path || "")
                                  }
                                  disabled={deletingFileId === file.id}
                                  className="flex items-center justify-center gap-1 px-3 py-1 bg-error-600 text-white rounded-md hover:bg-error-700 transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deletingFileId === file.id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Suppression...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="w-3 h-3" />
                                      Supprimer
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modale pour afficher le fichier */}
      <FileViewerModal file={selectedFile} onClose={closeFileViewer} />
    </div>
  );
}

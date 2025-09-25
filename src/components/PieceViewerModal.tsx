"use client";

import { useState } from "react";
import { X, Database, FileText, Download, Eye, Calendar } from "lucide-react";
import type { PieceData } from "@/services/agent-data";

interface PieceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pieceData: PieceData | null;
}

export default function PieceViewerModal({
  isOpen,
  onClose,
  pieceData,
}: PieceViewerModalProps) {
  const [activeTab, setActiveTab] = useState<"metadata" | "files">("metadata");

  if (!isOpen || !pieceData) return null;

  const handleDownload = (file: { id: string; file_path: string }) => {
    // TODO: Implémenter le téléchargement
    console.log("Télécharger:", file);
  };

  const handleViewFile = (file: { id: string; file_path: string }) => {
    // TODO: Implémenter la visualisation
    console.log("Voir:", file);
  };

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
                {pieceData.hasFiles && (
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>{pieceData.files.length} fichier(s)</span>
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
              Fichiers ({pieceData.files.length})
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
                      <thead className="bg-slate-100 border-b-2 border-slate-300">
                        <tr>
                          {pieceData.metadata.map((meta) => (
                            <th
                              key={meta.id}
                              className="px-6 py-4 text-left text-sm font-semibold text-slate-800 min-w-[150px]"
                            >
                              <div className="flex items-center gap-2">
                                <span>
                                  {meta.metadataModel?.libelle || "Métadonnée"}
                                </span>
                                {meta.metadataModel?.obligatoire && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-500 text-white shadow-sm">
                                    *
                                  </span>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y-2 divide-slate-200">
                        <tr>
                          {pieceData.metadata.map((meta) => (
                            <td key={meta.id} className="px-6 py-4">
                              <div className="bg-slate-50 rounded-lg p-4 min-h-[70px] flex items-center">
                                <span className="text-sm font-medium text-slate-800 break-words">
                                  {meta.valeur || (
                                    <span className="text-slate-500 italic font-normal">
                                      Aucune valeur
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "files" && (
            <div className="space-y-4">
              {pieceData.files.length === 0 ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pieceData.files.map((file) => (
                    <div key={file.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {file.file_path.split("/").pop()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewFile(file)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Voir
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

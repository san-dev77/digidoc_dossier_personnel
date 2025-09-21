"use client";

import {
  X,
  FileText,
  Calendar,
  Hash,
  ToggleLeft,
  List,
  Sparkles,
} from "lucide-react";
import type { PieceWithMetadata, MetadataModel } from "@/types";
import { formatDate } from "@/utils/date";

interface MetadataViewerProps {
  isOpen: boolean;
  onClose: () => void;
  piece: PieceWithMetadata | null;
}

export default function MetadataViewer({
  isOpen,
  onClose,
  piece,
}: MetadataViewerProps) {
  if (!isOpen || !piece) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <FileText className="w-4 h-4" />;
      case "number":
        return <Hash className="w-4 h-4" />;
      case "date":
        return <Calendar className="w-4 h-4" />;
      case "boolean":
        return <ToggleLeft className="w-4 h-4" />;
      case "select":
        return <List className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "text":
        return "bg-blue-100 text-blue-700";
      case "number":
        return "bg-green-100 text-green-700";
      case "date":
        return "bg-purple-100 text-purple-700";
      case "boolean":
        return "bg-orange-100 text-orange-700";
      case "select":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "text":
        return "Texte";
      case "number":
        return "Nombre";
      case "date":
        return "Date";
      case "boolean":
        return "Oui/Non";
      case "select":
        return "Liste déroulante";
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-100/20 to-accent-green-light/20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              {piece.aMetadonnees && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-accent-green to-green-600 rounded-full flex items-center justify-center shadow-md">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{piece.nom}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Détails de la pièce et métadonnées
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-8">
            {/* Informations générales */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Informations générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nom de la pièce
                  </label>
                  <p className="text-gray-900 font-medium">{piece.nom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Date de création
                  </label>
                  <p className="text-gray-900 font-medium">
                    {formatDate(piece.createdAt)}
                  </p>
                </div>
                {piece.description && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Description
                    </label>
                    <p className="text-gray-900 leading-relaxed">
                      {piece.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Métadonnées */}
            {piece.aMetadonnees &&
            piece.metadonnees &&
            piece.metadonnees.length > 0 ? (
              <div className="bg-gradient-to-r from-accent-green-light/20 to-blue-50/30 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-accent-green rounded-full animate-pulse"></div>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent-green" />
                    Champs personnalisés
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-accent-green/30 to-transparent"></div>
                  <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
                    {piece.metadonnees.length} champ
                    {piece.metadonnees.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid gap-4">
                  {piece.metadonnees.map((meta, index) => (
                    <div
                      key={meta.id}
                      className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div
                            className={`w-10 h-10 ${getTypeColor(
                              meta.type
                            )} rounded-lg flex items-center justify-center shadow-sm`}
                          >
                            {getTypeIcon(meta.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {meta.nom}
                              </h4>
                              <span
                                className={`text-xs px-3 py-1 rounded-full font-medium ${getTypeColor(
                                  meta.type
                                )}`}
                              >
                                {getTypeLabel(meta.type)}
                              </span>
                              {meta.obligatoire && (
                                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">
                                  Obligatoire
                                </span>
                              )}
                            </div>
                            {meta.description && (
                              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                {meta.description}
                              </p>
                            )}
                            {meta.type === "select" &&
                              meta.options &&
                              meta.options.length > 0 && (
                                <div className="mt-3">
                                  <label className="block text-xs font-medium text-gray-500 mb-2">
                                    Options disponibles :
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {meta.options.map((option, optionIndex) => (
                                      <span
                                        key={optionIndex}
                                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md border"
                                      >
                                        {option}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Aucune métadonnée
                </h3>
                <p className="text-sm text-gray-500">
                  Cette pièce n&apos;a pas de champs personnalisés définis.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

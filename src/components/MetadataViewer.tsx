"use client";

import {
  X,
  FileText,
  Calendar,
  Hash,
  ToggleLeft,
  List,
  Sparkles,
  Edit,
  Trash2,
} from "lucide-react";
import type { PieceWithMetadata, MetadataModel } from "@/types";
import { formatDate } from "@/utils/date";

interface MetadataViewerProps {
  isOpen: boolean;
  onClose: () => void;
  piece: PieceWithMetadata | null;
  onEditMetadata?: (metadata: MetadataModel) => void;
  onDeleteMetadata?: (metadata: MetadataModel) => void;
}

export default function MetadataViewer({
  isOpen,
  onClose,
  piece,
  onEditMetadata,
  onDeleteMetadata,
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
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-primary-100/20 to-accent-green-light/20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6 text-primary-200" />
              </div>
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
            piece.metadataModels &&
            piece.metadataModels.length > 0 ? (
              <div className="bg-gradient-to-r from-accent-green-light/20 to-blue-50/30 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-accent-green rounded-full animate-pulse"></div>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent-green" />
                    Champs personnalisés
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-accent-green/30 to-transparent"></div>
                  <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
                    {piece.metadataModels.length} champ
                    {piece.metadataModels.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Tableau des métadonnées */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Nom du champ
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Statut
                        </th>
                        {(onEditMetadata || onDeleteMetadata) && (
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {piece.metadataModels.map((meta, index) => (
                        <tr
                          key={meta.id}
                          className="hover:bg-blue-50 transition-colors duration-150"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-md">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              <div
                                className={`w-8 h-8 ${getTypeColor(
                                  meta.type
                                )} rounded-lg flex items-center justify-center shadow-sm`}
                              >
                                {getTypeIcon(meta.type)}
                              </div>
                              <span>{meta.nom}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(
                                meta.type
                              )}`}
                            >
                              {getTypeLabel(meta.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-700 text-sm max-w-xs truncate">
                              {meta.description || (
                                <span className="text-gray-400 italic">
                                  Aucune description
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {meta.obligatoire ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                                Obligatoire
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">
                                Optionnel
                              </span>
                            )}
                          </td>
                          {(onEditMetadata || onDeleteMetadata) && (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex gap-2 justify-center">
                                {onEditMetadata && (
                                  <button
                                    onClick={() => onEditMetadata(meta)}
                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors shadow-sm hover:shadow-md"
                                    title="Modifier"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                {onDeleteMetadata && (
                                  <button
                                    onClick={() => onDeleteMetadata(meta)}
                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors shadow-sm hover:shadow-md"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

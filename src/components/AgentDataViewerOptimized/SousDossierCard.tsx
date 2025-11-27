"use client";

import {
  Eye,
  CreditCard,
  FileText,
  Trash2,
  Upload,
  Database,
  Calendar,
  Loader2,
} from "lucide-react";
import type {
  AgentWithDossiers,
  PieceWithMetadata,
  SousDossierWithStats,
} from "@/store/dossiersStore";

interface SousDossierCardProps {
  sousDossier: AgentWithDossiers["dossiers"][0]["sousDossiers"][0];
  isCredit: boolean;
  rubriqueId: string;
  agentId: string;
  agentName: string;
  rubriqueName: string;
  onCreditDossierClick?: (sousDossierId: number, rubriqueId: number) => void;
  onPieceClick?: (piece: unknown) => void;
  onDeleteDossier?: (agentDossierId: number, sousDossierTitre: string) => void;
  refreshingPieces: Set<string>;
  onUploadClick: (data: {
    piece: PieceWithMetadata;
    sousDossier: SousDossierWithStats;
    rubriqueId: string;
  }) => void;
  getStatusColor: (statut?: string) => string;
}

export default function SousDossierCard({
  sousDossier,
  isCredit,
  rubriqueId,
  agentId,
  agentName,
  rubriqueName,
  onCreditDossierClick,
  onPieceClick,
  onDeleteDossier,
  refreshingPieces,
  onUploadClick,
  getStatusColor,
}: SousDossierCardProps) {
  return (
    <div
      className={`group relative bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden transition-all duration-300 ${
        isCredit
          ? "cursor-pointer hover:border-success-300 hover:shadow-md hover:scale-[1.01]"
          : "hover:border-primary-300 hover:shadow-md"
      }`}
      onClick={() => {
        if (isCredit) {
          onCreditDossierClick?.(
            parseInt(sousDossier.id),
            parseInt(rubriqueId)
          );
        }
      }}
    >
      {/* Accent Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isCredit
            ? "bg-gradient-to-r from-success-400 to-success-500"
            : "bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-primary-500)]"
        }`}
      ></div>

      <div className="p-5">
        {/* Header Sous-dossier */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                  isCredit
                    ? "bg-gradient-to-br from-success-500 to-success-600"
                    : "bg-gradient-to-br from-[var(--color-accent-blue)] to-[var(--color-primary-600)]"
                }`}
              >
                {isCredit ? (
                  <CreditCard className="w-6 h-6 text-white" />
                ) : (
                  <FileText className="w-6 h-6 text-white" />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h5 className="text-lg font-bold text-primary-900 mb-1">
                {sousDossier.titre}
              </h5>
              {sousDossier.description && (
                <p className="text-sm text-primary-800 font-semibold leading-relaxed">
                  {sousDossier.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {sousDossier.statut && (
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${getStatusColor(
                  sousDossier.statut
                )}`}
              >
                {sousDossier.statut.toUpperCase()}
              </span>
            )}
            {isCredit ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreditDossierClick?.(
                    parseInt(sousDossier.id),
                    parseInt(rubriqueId)
                  );
                }}
                className="flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-bold border-2 border-success-700"
              >
                <Eye className="w-4 h-4" />
                Consulter
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPieceClick?.({
                    piece: {
                      id: sousDossier.id,
                      nom: sousDossier.titre,
                      description: sousDossier.description,
                      has_meta: sousDossier.piecesWithMetadataCount > 0,
                      createdAt: sousDossier.createdAt,
                      updatedAt: sousDossier.updatedAt,
                    },
                    metadata: [],
                    files: [],
                    hasFiles: sousDossier.pieces.some(
                      (p) => p.files && p.files.length > 0
                    ),
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-bold border-2 border-primary-700"
              >
                <Eye className="w-4 h-4" />
                Voir contenu
              </button>
            )}
            {sousDossier.agentDossierId && onDeleteDossier && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDossier(
                    sousDossier.agentDossierId!,
                    sousDossier.titre
                  );
                }}
                className="flex items-center gap-2 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-bold border-2 border-error-700"
                title="Supprimer ce dossier"
              >
                <Trash2 className="w-4 h-4 text-primary-100" />
              </button>
            )}
          </div>
        </div>

        {/* Pièces du sous-dossier - Tableau */}
        {!isCredit && sousDossier.pieces.length > 0 && (
          <div className="mt-4 pt-4 border-t border-primary-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-100 border-b-2 border-primary-300">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-primary-900 uppercase">
                      Nom
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-primary-900 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-primary-900 uppercase">
                      Fichiers
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-primary-900 uppercase">
                      Métadonnées
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-primary-900 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-primary-900 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-primary-100">
                  {sousDossier.pieces.map((piece) => {
                    const hasFiles = piece.files && piece.files.length > 0;
                    const hasMetadata =
                      piece.metadata && piece.metadata.length > 0;
                    const isRefreshing = refreshingPieces.has(piece.id);

                    return (
                      <tr
                        key={piece.id}
                        className={`transition-colors ${
                          isRefreshing
                            ? "bg-primary-100"
                            : hasFiles
                            ? "bg-emerald-100 border-l-8 border-emerald-500 hover:bg-emerald-100"
                            : "hover:bg-primary-50"
                        }`}
                      >
                        <td className="px-4 py-3 max-w-xs">
                          <div className="flex items-center gap-2">
                            {isRefreshing && (
                              <Loader2 className="w-4 h-4 text-primary-600 animate-spin flex-shrink-0" />
                            )}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {hasFiles ? (
                                <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-primary-400 flex-shrink-0" />
                              )}
                              <span
                                className="font-semibold text-primary-900 text-sm truncate"
                                title={piece.nom}
                              >
                                {piece.nom}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span
                            className="text-sm text-primary-700 truncate block"
                            title={piece.description || undefined}
                          >
                            {piece.description || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasFiles ? (
                            <div className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-emerald-100 rounded-lg mx-auto w-fit">
                              <Upload className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-xs font-bold text-emerald-700">
                                {piece.files!.length}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-primary-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasMetadata ? (
                            <div className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-[var(--color-accent-blue-light)] rounded-lg mx-auto w-fit">
                              <Database className="w-3.5 h-3.5 text-[var(--color-accent-blue)]" />
                              <span className="text-xs font-bold text-[var(--color-primary-700)]">
                                {piece.metadata!.length}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-primary-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-primary-200 rounded-lg border border-primary-400 mx-auto w-fit">
                            <Calendar className="w-3.5 h-3.5 text-primary-800" />
                            <span className="text-xs font-semibold text-primary-900">
                              {new Date(piece.createdAt).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                }
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUploadClick({
                                  piece: piece,
                                  sousDossier: sousDossier,
                                  rubriqueId: rubriqueId,
                                });
                              }}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg text-xs font-bold border-2 border-primary-700"
                              title="Charger un fichier"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Charger
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPieceClick?.({
                                  piece: {
                                    id: piece.id,
                                    nom: piece.nom,
                                    description: piece.description,
                                    has_meta: piece.aMetadonnees,
                                    createdAt: piece.createdAt,
                                    updatedAt: piece.updatedAt,
                                  },
                                  metadata: (piece.metadata || []).map(
                                    (meta) => ({
                                      id: meta.id,
                                      meta_model_id: meta.meta_model_id,
                                      valeur: meta.valeur,
                                      metadataModel: meta.metadataModel || null,
                                      created_at: meta.created_at,
                                    })
                                  ),
                                  files: (piece.files || []).map((file) => ({
                                    id: file.id,
                                    id_piece: file.piece_id,
                                    file_path: file.file_path,
                                    created_at: file.created_at,
                                  })),
                                  hasFiles: hasFiles,
                                  context: {
                                    agentId,
                                    agentName,
                                    rubriqueId,
                                    rubriqueName,
                                    sousDossierId: sousDossier.id,
                                    sousDossierName: sousDossier.titre,
                                    agentDossierId: sousDossier.agentDossierId,
                                  },
                                });
                              }}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 text-xs font-bold border-2 border-primary-700 shadow-md hover:shadow-lg"
                              title="Voir les détails"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Voir
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Message pour dossiers de crédit */}
        {isCredit && (
          <div className="mt-4 p-4 bg-gradient-to-r from-success-50 to-success-100/50 rounded-xl border border-success-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-500 rounded-lg flex items-center justify-center shadow-md">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm text-success-800 font-semibold">
                Dossier de crédit - Cliquez sur &quot;Consulter&quot; pour voir
                les métadonnées détaillées
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

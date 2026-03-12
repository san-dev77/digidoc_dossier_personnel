"use client";

import { useState, useCallback } from "react";
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
  PieceWithMetadata,
  MetadataModel,
  AgentWithDossiers,
  SousDossierWithStats,
} from "@/types";
import type { Piece } from "@/types";
import HighlightText from "@/components/ui/HighlightText";
import { DossiersOptimizedService } from "@/services/dossiers-optimized";

interface SousDossierCardProps {
  sousDossier: AgentWithDossiers["dossiers"][0]["sousDossiers"][0];
  isCredit: boolean;
  rubriqueId: string;
  agentId: string;
  agentName: string;
  rubriqueName: string;
  searchTerm?: string;
  onCreditDossierClick?: (sousDossierId: number, rubriqueId: number, agentDossierId: number) => void;
  onPieceClick?: (piece: any) => void;
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
  searchTerm = "",
  onCreditDossierClick,
  onPieceClick,
  onDeleteDossier,
  refreshingPieces,
  onUploadClick,
  getStatusColor,
}: SousDossierCardProps) {
  // État local pour le chargement lazy des pièces
  const [loadingPieces, setLoadingPieces] = useState(false);
  const [piecesError, setPiecesError] = useState<string | null>(null);

  /**
   * Charge les pièces à la demande quand l'utilisateur clique sur "Voir contenu"
   * ou interagit avec un sous-dossier non-crédit.
   */
  const ensurePiecesLoaded = useCallback(async (): Promise<PieceWithMetadata[]> => {
    // Si pièces déjà chargées, les retourner directement
    if (sousDossier.piecesLoaded && sousDossier.pieces) {
      return sousDossier.pieces;
    }

    setLoadingPieces(true);
    setPiecesError(null);

    try {
      const pieces = await DossiersOptimizedService.loadPiecesForSousDossier(
        sousDossier.id,
        sousDossier.agentDossierId
      );
      return pieces;
    } catch (err) {
      console.error("Erreur chargement pièces:", err);
      setPiecesError("Impossible de charger les pièces");
      return [];
    } finally {
      setLoadingPieces(false);
    }
  }, [sousDossier.id, sousDossier.agentDossierId, sousDossier.piecesLoaded, sousDossier.pieces]);

  /**
   * Gère le clic sur "Voir contenu" — charge les pièces inline dans la carte.
   * Le tableau s'affiche automatiquement dès que piecesLoaded passe à true.
   */
  const handleViewContent = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await ensurePiecesLoaded();
  }, [ensurePiecesLoaded]);

  // Détermine si les pièces sont disponibles pour l'affichage
  const piecesAvailable = sousDossier.piecesLoaded && sousDossier.pieces;
  const pieces = piecesAvailable ? sousDossier.pieces! : [];

  return (
    <div
      className={`group relative bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${
        isCredit
          ? "border-emerald-200 cursor-pointer hover:border-emerald-400 hover:shadow-md hover:scale-[1.01]"
          : "border-indigo-200 hover:border-indigo-400 hover:shadow-md"
      }`}
      onClick={() => {
        if (isCredit) {
          onCreditDossierClick?.(
            parseInt(sousDossier.id),
            parseInt(rubriqueId),
            sousDossier.agentDossierId ? Number(sousDossier.agentDossierId) : 0
          );
        }
      }}
    >
      {/* Accent Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isCredit
            ? "bg-gradient-to-r from-emerald-400 to-teal-500"
            : "bg-gradient-to-r from-indigo-400 to-indigo-600"
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
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                    : "bg-gradient-to-br from-indigo-500 to-indigo-700"
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
                <HighlightText text={sousDossier.titre} searchTerm={searchTerm} />
              </h5>
              {sousDossier.description && (
                <p className="text-sm text-primary-800 font-semibold leading-relaxed">
                  {sousDossier.description}
                </p>
              )}
              {/* Compteurs inline (toujours affichés, même sans pièces chargées) */}
              {!isCredit && sousDossier.piecesCount > 0 && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                    {sousDossier.piecesCount} pièce{sousDossier.piecesCount > 1 ? "s" : ""}
                  </span>
                  {(sousDossier.filesCount || 0) > 0 && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {sousDossier.filesCount} fichier{(sousDossier.filesCount || 0) > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
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
                    parseInt(rubriqueId),
                    sousDossier.agentDossierId ? Number(sousDossier.agentDossierId) : 0
                  );
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-bold border-2 border-emerald-700"
              >
                <Eye className="w-4 h-4" />
                Consulter
              </button>
            ) : (
              <button
                onClick={handleViewContent}
                disabled={loadingPieces}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-bold border-2 border-indigo-700 disabled:opacity-50"
              >
                {loadingPieces ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {loadingPieces ? "Chargement..." : "Voir contenu"}
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

        {/* Spinner pendant le chargement des pièces */}
        {loadingPieces && (
          <div className="mt-4 flex items-center justify-center gap-2 py-6 text-primary-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">Chargement des pièces...</span>
          </div>
        )}

        {/* Message d'erreur */}
        {piecesError && (
          <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg text-sm text-error-700 font-medium">
            {piecesError}
          </div>
        )}

        {/* Pièces du sous-dossier — Tableau (seulement si chargées via lazy loading) */}
        {!isCredit && piecesAvailable && pieces.length > 0 && (
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
                  {pieces.map((piece: PieceWithMetadata) => {
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
                            <div className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-primary-100 rounded-lg mx-auto w-fit">
                              <Upload className="w-3.5 h-3.5 text-primary-600" />
                              <span className="text-xs font-bold text-primary-700">
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
                                    (meta: any) => ({
                                      id: meta.id,
                                      meta_model_id: meta.meta_model_id,
                                      valeur: meta.valeur,
                                      metadataModel: meta.metadataModel || null,
                                      created_at: meta.created_at,
                                    })
                                  ),
                                  metadataModels: (piece.metadataModels || []).map(
                                    (model: MetadataModel) => ({
                                      id: model.id,
                                      piece_id: model.piece_id,
                                      libelle: model.libelle,
                                      nom: model.nom,
                                      type: model.type,
                                      obligatoire: model.obligatoire,
                                      description: model.description,
                                      created_at: model.created_at,
                                    })
                                  ),
                                  files: (piece.files || []).map((file: any) => {
                                    return {
                                      id: file.id,
                                      id_piece: file.piece_id || file.id_piece || file.pieceId,
                                      file_path: file.file_path || file.filePath || "",
                                      filePath: file.filePath || file.file_path || "",
                                      created_at: file.created_at || file.createdAt,
                                      createdAt: file.createdAt || file.created_at,
                                      mimeType: file.mimeType || file.mime_type,
                                      mime_type: file.mime_type || file.mimeType,
                                    };
                                  }),
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

        {/* Indicateur pour sous-dossiers non-crédit sans pièces chargées (mais avec des données) */}
        {!isCredit && !piecesAvailable && !loadingPieces && sousDossier.piecesCount > 0 && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-sm text-primary-600 font-medium text-center">
              {sousDossier.piecesCount} pièce{sousDossier.piecesCount > 1 ? "s" : ""} disponible{sousDossier.piecesCount > 1 ? "s" : ""} — Cliquez sur &quot;Voir contenu&quot; pour charger
            </p>
          </div>
        )}

        {/* Message pour dossiers de crédit */}
        {isCredit && (
          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm text-emerald-800 font-semibold">
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

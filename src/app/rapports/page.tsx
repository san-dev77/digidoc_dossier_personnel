"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Search,
  Download,
  BarChart3,
  Calendar,
  Building2,
  User,
  ChevronDown,
  ChevronRight,
  Folder,
  BadgeCheck,
  AlertCircle,
  X,
  Info,
  Printer,
  Eye,
} from "lucide-react";
import {
  agentRubriqueService,
  AgentWithRubrique,
} from "@/services/agent-rubrique";
import {
  sousDossiersService,
  type SousDossier,
} from "@/services/sous-dossiers";
import { piecesService } from "@/services/pieces";
import type { PieceWithCheck } from "@/types";
import { piecesCheckService } from "@/services/pieces-check";
import "@/styles/print.css";

// Types pour les rapports
interface ConformityReport {
  agent: AgentWithRubrique;
  rubriques: RubriqueConformity[];
  globalConformity: number;
}

interface RubriqueConformity {
  rubrique: {
    id: string;
    nom: string;
    description: string;
  };
  sousDossiers: SousDossierConformity[];
  conformityPercentage: number;
  totalPieces: number;
  checkedPieces: number;
}

interface SousDossierConformity extends SousDossier {
  pieces: PieceWithCheck[];
  conformityPercentage: number;
  checkedCount: number;
  totalPieces: number;
  status: "all_checked" | "partial_checked" | "none_checked" | "no_pieces";
}

// Fonction pour calculer le statut d'un sous-dossier
function calculateSousDossierStatus(pieces: PieceWithCheck[]): {
  status: "all_checked" | "partial_checked" | "none_checked" | "no_pieces";
  checkedCount: number;
  totalPieces: number;
} {
  if (pieces.length === 0) {
    return { status: "no_pieces", checkedCount: 0, totalPieces: 0 };
  }

  const checkedCount = pieces.filter((piece) => {
    return piece.isDisponible === true;
  }).length;

  const verifiedCount = pieces.filter((piece) => {
    return piece.isDisponible !== null;
  }).length;

  const totalPieces = pieces.length;

  if (verifiedCount === 0) {
    return { status: "none_checked", checkedCount: 0, totalPieces };
  } else if (checkedCount === totalPieces && verifiedCount === totalPieces) {
    return { status: "all_checked", checkedCount, totalPieces };
  } else if (checkedCount > 0 && checkedCount < totalPieces) {
    return { status: "partial_checked", checkedCount, totalPieces };
  } else if (verifiedCount === totalPieces && checkedCount === 0) {
    return { status: "none_checked", checkedCount: 0, totalPieces };
  } else {
    return { status: "partial_checked", checkedCount, totalPieces };
  }
}

// Composant pour une pièce avec checkbox
function PieceCard({
  piece,
  agentId,
  onAvailabilityChange,
}: {
  piece: PieceWithCheck;
  agentId: string;
  onAvailabilityChange?: (pieceId: string, disponible: boolean) => void;
}) {
  const [isDisponible, setIsDisponible] = useState<boolean | null>(
    piece.isDisponible ?? null
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAvailabilityChange = async (disponible: boolean) => {
    setIsUpdating(true);
    try {
      await piecesCheckService.updatePieceAvailability({
        piece_id: piece.id,
        disponible,
        agent_id: agentId,
      });

      setIsDisponible(disponible);
      onAvailabilityChange?.(piece.id, disponible);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de la disponibilité:",
        error
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h6 className="font-semibold text-slate-800 mb-1">{piece.nom}</h6>
          {piece.description && (
            <p className="text-sm text-slate-600 mb-2">{piece.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                Ajouté le {new Date(piece.createdAt).toLocaleDateString()}
              </span>
            </div>
            {piece.aMetadonnees && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Avec métadonnées</span>
              </div>
            )}
          </div>
        </div>

        {/* Checkbox de disponibilité */}
        <div className="flex flex-col items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDisponible === true}
              onChange={(e) => handleAvailabilityChange(e.target.checked)}
              disabled={isUpdating}
              className="w-5 h-5 text-primary-600 bg-white border-2 border-slate-300 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
            />
            <span className="text-sm font-medium text-slate-700">
              {isDisponible === null
                ? "Non disponible"
                : isDisponible
                ? "Disponible"
                : "Non disponible"}
            </span>
          </label>

          {isUpdating && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              <span>Mise à jour...</span>
            </div>
          )}

          {piece.lastCheckDate && (
            <div className="text-xs text-slate-400">
              Vérifié le{" "}
              {new Date(piece.lastCheckDate).toLocaleDateString("fr-FR")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant pour un sous-dossier
function SousDossierAccordion({
  sousDossier,
  agentId,
  onAvailabilityChange,
}: {
  sousDossier: SousDossierConformity;
  agentId: string;
  onAvailabilityChange?: (pieceId: string, disponible: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pieces, setPieces] = useState<PieceWithCheck[]>(
    sousDossier.pieces || []
  );

  const statusData = calculateSousDossierStatus(pieces);

  // Fonctions pour obtenir les styles selon le statut
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "all_checked":
        return {
          cardClass:
            "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200",
          headerClass: "bg-gradient-to-r from-green-100 to-emerald-100",
          iconClass: "text-green-600 bg-green-100",
          badgeClass: "bg-green-500 text-white",
          borderClass: "border-green-300",
        };
      case "partial_checked":
        return {
          cardClass:
            "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200",
          headerClass: "bg-gradient-to-r from-yellow-100 to-amber-100",
          iconClass: "text-yellow-600 bg-yellow-100",
          badgeClass: "bg-yellow-500 text-white",
          borderClass: "border-yellow-300",
        };
      case "none_checked":
        return {
          cardClass: "bg-gradient-to-r from-red-50 to-rose-50 border-red-200",
          headerClass: "bg-gradient-to-r from-red-100 to-rose-100",
          iconClass: "text-red-600 bg-red-100",
          badgeClass: "bg-red-500 text-white",
          borderClass: "border-red-300",
        };
      case "no_pieces":
        return {
          cardClass:
            "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200",
          headerClass: "bg-gradient-to-r from-gray-100 to-slate-100",
          iconClass: "text-gray-600 bg-gray-100",
          badgeClass: "bg-gray-500 text-white",
          borderClass: "border-gray-300",
        };
      default:
        return {
          cardClass: "bg-white border-gray-200",
          headerClass: "bg-gray-50",
          iconClass: "text-gray-600 bg-gray-100",
          badgeClass: "bg-gray-500 text-white",
          borderClass: "border-gray-300",
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "all_checked":
        return <BadgeCheck className="w-5 h-5" />;
      case "partial_checked":
        return <AlertCircle className="w-5 h-5" />;
      case "none_checked":
        return <X className="w-5 h-5" />;
      case "no_pieces":
        return <Info className="w-5 h-5" />;
      default:
        return <Folder className="w-5 h-5" />;
    }
  };

  const getStatusText = (
    status: string,
    checkedCount: number,
    totalPieces: number
  ) => {
    const verifiedCount = pieces.filter((p) => p.isDisponible !== null).length;

    switch (status) {
      case "all_checked":
        return `${checkedCount}/${totalPieces} disponibles`;
      case "partial_checked":
        if (verifiedCount === totalPieces && checkedCount === 0) {
          return `${totalPieces} pièces vérifiées (aucune disponible)`;
        } else {
          return `${checkedCount}/${totalPieces} disponibles`;
        }
      case "none_checked":
        return `${totalPieces} pièces non vérifiées`;
      case "no_pieces":
        return "Aucune pièce";
      default:
        return "";
    }
  };

  const styles = getStatusStyles(statusData.status);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Fonction pour mettre à jour une pièce quand son statut change
  const handlePieceAvailabilityChange = (
    pieceId: string,
    disponible: boolean
  ) => {
    setPieces((prevPieces) =>
      prevPieces.map((piece) =>
        piece.id === pieceId
          ? {
              ...piece,
              isDisponible: disponible,
              lastCheckDate: new Date().toISOString(),
            }
          : piece
      )
    );
    onAvailabilityChange?.(pieceId, disponible);
  };

  return (
    <div
      className={`${styles.cardClass} border-2 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 ${styles.borderClass}`}
    >
      {/* Header du sous-dossier */}
      <div
        className={`p-6 cursor-pointer hover:opacity-90 transition-all duration-200 ${styles.headerClass}`}
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${styles.iconClass}`}
            >
              {getStatusIcon(statusData.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-xl font-bold text-slate-800">
                  {sousDossier.titre}
                </h4>
                {/* Badge de statut */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${styles.badgeClass}`}
                >
                  {getStatusText(
                    statusData.status,
                    statusData.checkedCount,
                    statusData.totalPieces
                  )}
                </span>
              </div>
              {sousDossier.description && (
                <p className="text-slate-600 mb-3 leading-relaxed">
                  {sousDossier.description}
                </p>
              )}
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Créé le{" "}
                    {new Date(sousDossier.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>
                    {pieces.length} pièce{pieces.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* <div className="text-right">
              <div className="text-sm text-slate-500 mb-1">Conformité</div>
              <div className="text-lg font-bold text-slate-800">
                {Math.round(sousDossier.conformityPercentage)}%
              </div>
              {pieces.length > 0 && (
                <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      statusData.status === "all_checked"
                        ? "bg-green-500"
                        : statusData.status === "partial_checked"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${sousDossier.conformityPercentage}%` }}
                  />
                </div>
              )}
            </div> */}
            <div className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu des pièces */}
      {isExpanded && (
        <div className="border-t border-slate-200">
          {pieces.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">
                Aucun document
              </h4>
              <p className="text-slate-600">
                Ce sous-dossier ne contient pas encore de pièces.
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`w-2 h-6 rounded-full ${
                    statusData.status === "all_checked"
                      ? "bg-green-500"
                      : statusData.status === "partial_checked"
                      ? "bg-yellow-500"
                      : statusData.status === "none_checked"
                      ? "bg-red-500"
                      : "bg-gray-500"
                  }`}
                ></div>
                <h5 className="text-lg font-semibold text-slate-800">
                  Documents dans ce sous-dossier
                </h5>
              </div>
              <div className="grid gap-3">
                {pieces.map((piece) => (
                  <PieceCard
                    key={piece.id}
                    piece={piece}
                    agentId={agentId}
                    onAvailabilityChange={handlePieceAvailabilityChange}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Composant principal pour les rapports
export default function RapportsPage() {
  const [reports, setReports] = useState<ConformityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRubriques, setExpandedRubriques] = useState<Set<string>>(
    new Set()
  );
  const [showFicheModal, setShowFicheModal] = useState(false);
  const [selectedAgentForFiche, setSelectedAgentForFiche] =
    useState<ConformityReport | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);

      // Charger tous les agents avec leurs rubriques
      const agents = await agentRubriqueService.getAgentsWithRubriques();

      // Pour chaque agent, calculer sa conformité
      const reportsData: ConformityReport[] = await Promise.all(
        agents.map(async (agent) => {
          if (!agent.rubrique_id) {
            return {
              agent,
              rubriques: [],
              globalConformity: 0,
            };
          }

          try {
            // Charger les sous-dossiers de la rubrique
            const sousDossiers =
              await sousDossiersService.getAllSousDossiersByRubrique(
                agent.rubrique_id
              );

            // Charger les statuts de vérification pour cet agent
            const checksData = await piecesCheckService.getPieceChecks(
              agent.id
            );

            // Pour chaque sous-dossier, charger les pièces et calculer la conformité
            const sousDossiersWithConformity: SousDossierConformity[] =
              await Promise.all(
                sousDossiers.map(async (sousDossier) => {
                  try {
                    const piecesData =
                      await piecesService.getAllPiecesBySousDossier(
                        sousDossier.id
                      );

                    const piecesWithStatus: PieceWithCheck[] = piecesData.map(
                      (piece) => {
                        const check = checksData.find(
                          (c) => c.piece_id === piece.id
                        );
                        return {
                          ...piece,
                          isDisponible: check ? check.disponible : null,
                          lastCheckDate: check?.date_check,
                          pieces_check: checksData.filter(
                            (c) => c.piece_id === piece.id
                          ),
                        };
                      }
                    );

                    const statusData =
                      calculateSousDossierStatus(piecesWithStatus);
                    const conformityPercentage =
                      piecesWithStatus.length > 0
                        ? (statusData.checkedCount / piecesWithStatus.length) *
                          100
                        : 0;

                    return {
                      ...sousDossier,
                      pieces: piecesWithStatus,
                      conformityPercentage,
                      checkedCount: statusData.checkedCount,
                      totalPieces: statusData.totalPieces,
                      status: statusData.status,
                    };
                  } catch (error) {
                    console.error(
                      `Erreur lors du chargement des pièces pour ${sousDossier.titre}:`,
                      error
                    );
                    return {
                      ...sousDossier,
                      pieces: [],
                      conformityPercentage: 0,
                      checkedCount: 0,
                      totalPieces: 0,
                      status: "no_pieces" as const,
                    };
                  }
                })
              );

            // Calculer la conformité globale de la rubrique
            const totalPieces = sousDossiersWithConformity.reduce(
              (sum, sd) => sum + sd.totalPieces,
              0
            );
            const checkedPieces = sousDossiersWithConformity.reduce(
              (sum, sd) => sum + sd.checkedCount,
              0
            );
            const rubriqueConformityPercentage =
              totalPieces > 0 ? (checkedPieces / totalPieces) * 100 : 0;

            return {
              agent,
              rubriques: [
                {
                  rubrique: {
                    id: agent.rubrique_id,
                    nom: agent.rubrique_nom || "Rubrique inconnue",
                    description: "",
                  },
                  sousDossiers: sousDossiersWithConformity,
                  conformityPercentage: rubriqueConformityPercentage,
                  totalPieces,
                  checkedPieces,
                },
              ],
              globalConformity: rubriqueConformityPercentage,
            };
          } catch (error) {
            console.error(
              `Erreur lors du chargement de la conformité pour l'agent ${agent.nom}:`,
              error
            );
            return {
              agent,
              rubriques: [],
              globalConformity: 0,
            };
          }
        })
      );

      setReports(reportsData);
    } catch (error) {
      console.error("Erreur lors du chargement des rapports:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.agent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.agent.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.agent.fonction.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRubrique = (agentId: string, rubriqueId: string) => {
    const key = `${agentId}-${rubriqueId}`;
    const newExpanded = new Set(expandedRubriques);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRubriques(newExpanded);
  };

  const handleGenerateFiche = (report: ConformityReport) => {
    setSelectedAgentForFiche(report);
    setShowFicheModal(true);
  };

  const handleCloseFicheModal = () => {
    setShowFicheModal(false);
    setSelectedAgentForFiche(null);
  };

  const handlePrintFiche = () => {
    window.print();
  };

  const handleAvailabilityChange = (
    agentId: string,
    pieceId: string,
    disponible: boolean
  ) => {
    // Mettre à jour le rapport localement
    setReports((prevReports) =>
      prevReports.map((report) => {
        if (report.agent.id === agentId) {
          const updatedRubriques = report.rubriques.map((rubrique) => ({
            ...rubrique,
            sousDossiers: rubrique.sousDossiers.map((sousDossier) => ({
              ...sousDossier,
              pieces: sousDossier.pieces.map((piece) =>
                piece.id === pieceId
                  ? {
                      ...piece,
                      isDisponible: disponible,
                      lastCheckDate: new Date().toISOString(),
                    }
                  : piece
              ),
            })),
          }));

          // Recalculer les conformités
          const recalculatedRubriques = updatedRubriques.map((rubrique) => {
            const totalPieces = rubrique.sousDossiers.reduce(
              (sum, sd) => sum + sd.totalPieces,
              0
            );
            const checkedPieces = rubrique.sousDossiers.reduce((sum, sd) => {
              const checkedCount = sd.pieces.filter(
                (p) => p.isDisponible === true
              ).length;
              return sum + checkedCount;
            }, 0);
            const conformityPercentage =
              totalPieces > 0 ? (checkedPieces / totalPieces) * 100 : 0;

            return {
              ...rubrique,
              conformityPercentage,
              totalPieces,
              checkedPieces,
            };
          });

          const globalConformity =
            recalculatedRubriques.reduce(
              (sum, r) => sum + r.conformityPercentage,
              0
            ) / recalculatedRubriques.length;

          return {
            ...report,
            rubriques: recalculatedRubriques,
            globalConformity,
          };
        }
        return report;
      })
    );
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">
                Chargement des rapports...
              </p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header Card */}
        <div className="mb-8">
          <div className="bg-primary-700 mb-5 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <BarChart3 className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                      Rapports de Conformité
                    </h1>
                    <p className="text-primary-100 text-lg">
                      Suivi de la conformité des agents par rubrique et
                      sous-dossier
                    </p>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="w-2 h-2 bg-accent-green rounded-full"></div>
                        <span className="text-white text-sm font-medium">
                          {
                            reports.filter((r) => r.globalConformity >= 80)
                              .length
                          }{" "}
                          agents conformes (≥80%)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                        <span className="text-white text-sm font-medium">
                          {
                            reports.filter(
                              (r) =>
                                r.globalConformity >= 50 &&
                                r.globalConformity < 80
                            ).length
                          }{" "}
                          agents partiellement conformes
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="w-2 h-2 bg-error-500 rounded-full"></div>
                        <span className="text-white text-sm font-medium">
                          {
                            reports.filter((r) => r.globalConformity < 50)
                              .length
                          }{" "}
                          agents non conformes (&lt;50%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 w-1/2">
              <div className="relative w-full">
                <div className="absolute w-full inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3.5 border border-gray-500 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Liste des rapports */}
        <div className="space-y-6">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Aucun rapport trouvé
              </h3>
              <p className="text-slate-600">
                {searchTerm
                  ? "Aucun agent ne correspond à votre recherche."
                  : "Aucun agent n'a encore de données de conformité."}
              </p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.agent.id}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
              >
                {/* Header de l'agent */}
                <div className="p-6 border-b border-slate-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">
                          {report.agent.nom}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Matricule: {report.agent.matricule}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{report.agent.fonction}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {/* <div className="text-right">
                        <div className="text-sm text-slate-500 mb-1">
                          Conformité Globale
                        </div>
                        <div
                          className={`text-3xl font-bold ${
                            report.globalConformity >= 80
                              ? "text-green-600"
                              : report.globalConformity >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {Math.round(report.globalConformity)}%
                        </div>
                        <div className="w-32 h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              report.globalConformity >= 80
                                ? "bg-green-500"
                                : report.globalConformity >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${report.globalConformity}%` }}
                          />
                        </div>
                      </div> */}
                      <button
                        onClick={() => handleGenerateFiche(report)}
                        className="flex cursor-pointer items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
                      >
                        <Eye className="w-4 h-4" />
                        Générer la fiche d&apos;état
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rubriques */}
                <div className="p-6">
                  {report.rubriques.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Folder className="w-8 h-8 text-slate-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-2">
                        Aucune rubrique assignée
                      </h4>
                      <p className="text-slate-600">
                        Cet agent n&apos;est pas encore assigné à une rubrique.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {report.rubriques.map((rubrique) => (
                        <div
                          key={rubrique.rubrique.id}
                          className="border border-slate-500 rounded-xl overflow-hidden"
                        >
                          {/* Header de la rubrique */}
                          <div
                            className="p-4 bg-slate-50 cursor-pointer hover:bg-slate-300 transition-colors"
                            onClick={() =>
                              toggleRubrique(
                                report.agent.id,
                                rubrique.rubrique.id
                              )
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                  <Folder className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-slate-800">
                                    {rubrique.rubrique.nom}
                                  </h4>
                                  <p className="text-sm text-slate-600">
                                    {rubrique.sousDossiers.length} sous-dossier
                                    {rubrique.sousDossiers.length > 1
                                      ? "s"
                                      : ""}{" "}
                                    • {rubrique.totalPieces} pièce
                                    {rubrique.totalPieces > 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {/* <div className="text-right">
                                  <div className="text-sm text-slate-500">
                                    Conformité
                                  </div>
                                  <div
                                    className={`text-xl font-bold ${
                                      rubrique.conformityPercentage >= 80
                                        ? "text-green-600"
                                        : rubrique.conformityPercentage >= 50
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {Math.round(rubrique.conformityPercentage)}%
                                  </div>
                                </div> */}
                                {expandedRubriques.has(
                                  `${report.agent.id}-${rubrique.rubrique.id}`
                                ) ? (
                                  <ChevronDown className="w-5 h-5 text-slate-600" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-slate-600" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Sous-dossiers */}
                          {expandedRubriques.has(
                            `${report.agent.id}-${rubrique.rubrique.id}`
                          ) && (
                            <div className="p-4 space-y-4">
                              {rubrique.sousDossiers.map((sousDossier) => (
                                <SousDossierAccordion
                                  key={sousDossier.id}
                                  sousDossier={sousDossier}
                                  agentId={report.agent.id}
                                  onAvailabilityChange={(pieceId, disponible) =>
                                    handleAvailabilityChange(
                                      report.agent.id,
                                      pieceId,
                                      disponible
                                    )
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modale de la fiche d'état */}
        {showFicheModal && selectedAgentForFiche && (
          <div className="fixed inset-0 bg-black/70 transition-all duration-300 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header de la modale */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Fiche d&apos;État de Conformité
                    </h2>
                    <p className="text-sm text-slate-600">
                      {selectedAgentForFiche.agent.nom} -{" "}
                      {selectedAgentForFiche.agent.matricule}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintFiche}
                    className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </button>
                  <button
                    onClick={handleCloseFicheModal}
                    className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Contenu de la fiche */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="print-content bg-white">
                  {/* En-tête de la fiche */}
                  <div className="text-center mb-8 border-b-2 border-primary-200 pb-6">
                    <h1 className="text-3xl font-bold text-primary-800 mb-2">
                      FICHE D&apos;ÉTAT DE CONFORMITÉ
                    </h1>
                    <p className="text-lg text-slate-600">
                      Système de Gestion Documentaire
                    </p>
                    <p className="text-sm text-slate-500">
                      Générée le {new Date().toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  {/* Informations de l'agent */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <User className="w-6 h-6" />
                      Informations de l&apos;Agent
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">
                            Nom complet :
                          </span>
                          <span className="text-slate-600">
                            {selectedAgentForFiche.agent.nom}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">
                            Matricule :
                          </span>
                          <span className="text-slate-600">
                            {selectedAgentForFiche.agent.matricule}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">
                            Fonction :
                          </span>
                          <span className="text-slate-600">
                            {selectedAgentForFiche.agent.fonction}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">
                            Email :
                          </span>
                          <span className="text-slate-600">
                            {selectedAgentForFiche.agent.email ||
                              "Non renseigné"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">
                            Téléphone :
                          </span>
                          <span className="text-slate-600">
                            {selectedAgentForFiche.agent.telephone ||
                              "Non renseigné"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">
                            Date d&apos;inscription :
                          </span>
                          <span className="text-slate-600">
                            {new Date(
                              selectedAgentForFiche.agent.createdAt
                            ).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Résumé de conformité */}
                  {/* <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-6 h-6" />
                      Résumé de Conformité
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {Math.round(selectedAgentForFiche.globalConformity)}%
                        </div>
                        <div className="text-sm text-green-700 font-medium">
                          Conformité Globale
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {selectedAgentForFiche.rubriques.reduce(
                            (sum, r) => sum + r.totalPieces,
                            0
                          )}
                        </div>
                        <div className="text-sm text-blue-700 font-medium">
                          Total des Pièces
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">
                          {selectedAgentForFiche.rubriques.reduce(
                            (sum, r) => sum + r.checkedPieces,
                            0
                          )}
                        </div>
                        <div className="text-sm text-purple-700 font-medium">
                          Pièces Vérifiées
                        </div>
                      </div>
                    </div>
                  </div> */}

                  {/* Détail par rubrique */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Folder className="w-6 h-6" />
                      Détail par Rubrique
                    </h2>
                    {selectedAgentForFiche.rubriques.map((rubrique) => (
                      <div
                        key={rubrique.rubrique.id}
                        className="mb-6 border border-slate-200 rounded-xl overflow-hidden"
                      >
                        <div className="bg-slate-50 p-4 border-b border-slate-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-slate-800">
                                {rubrique.rubrique.nom}
                              </h3>
                              <p className="text-sm text-slate-600">
                                {rubrique.sousDossiers.length} sous-dossier
                                {rubrique.sousDossiers.length > 1
                                  ? "s"
                                  : ""} • {rubrique.totalPieces} pièce
                                {rubrique.totalPieces > 1 ? "s" : ""}
                              </p>
                            </div>
                            {/* <div className="text-right">
                              <div className="text-2xl font-bold text-slate-800">
                                {Math.round(rubrique.conformityPercentage)}%
                              </div>
                              <div className="text-sm text-slate-600">
                                Conformité
                              </div>
                            </div> */}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="space-y-4">
                            {rubrique.sousDossiers.map((sousDossier) => {
                              const statusData = calculateSousDossierStatus(
                                sousDossier.pieces
                              );
                              const getStatusColor = (status: string) => {
                                switch (status) {
                                  case "all_checked":
                                    return "text-green-600 bg-green-50 border-green-200";
                                  case "partial_checked":
                                    return "text-yellow-600 bg-yellow-50 border-yellow-200";
                                  case "none_checked":
                                    return "text-red-600 bg-red-50 border-red-200";
                                  case "no_pieces":
                                    return "text-gray-600 bg-gray-50 border-gray-200";
                                  default:
                                    return "text-gray-600 bg-gray-50 border-gray-200";
                                }
                              };
                              const getStatusIcon = (status: string) => {
                                switch (status) {
                                  case "all_checked":
                                    return <CheckCircle className="w-5 h-5" />;
                                  case "partial_checked":
                                    return (
                                      <AlertTriangle className="w-5 h-5" />
                                    );
                                  case "none_checked":
                                    return <XCircle className="w-5 h-5" />;
                                  case "no_pieces":
                                    return <Info className="w-5 h-5" />;
                                  default:
                                    return <Info className="w-5 h-5" />;
                                }
                              };

                              return (
                                <div
                                  key={sousDossier.id}
                                  className={`border rounded-lg p-4 ${getStatusColor(
                                    statusData.status
                                  )}`}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      {getStatusIcon(statusData.status)}
                                      <div>
                                        <h4 className="font-bold text-slate-800">
                                          {sousDossier.titre}
                                        </h4>
                                        {sousDossier.description && (
                                          <p className="text-sm text-slate-600">
                                            {sousDossier.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {/* <div className="text-lg font-bold text-slate-800">
                                        {Math.round(
                                          sousDossier.conformityPercentage
                                        )}
                                        %
                                      </div> */}
                                      <div className="text-sm text-slate-600">
                                        {statusData.checkedCount}/
                                        {statusData.totalPieces} pièces
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    {sousDossier.pieces.map((piece) => (
                                      <div
                                        key={piece.id}
                                        className="flex items-center justify-between bg-white/50 rounded-lg p-2"
                                      >
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-slate-500" />
                                          <span className="text-sm font-medium text-slate-700">
                                            {piece.nom}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {piece.isDisponible === null ? (
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                              Non disponible
                                            </span>
                                          ) : piece.isDisponible ? (
                                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                              Disponible
                                            </span>
                                          ) : (
                                            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                              Non disponible
                                            </span>
                                          )}
                                          {piece.lastCheckDate && (
                                            <span className="text-xs text-slate-400">
                                              {new Date(
                                                piece.lastCheckDate
                                              ).toLocaleDateString("fr-FR")}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pied de page */}
                  <div className="mt-8 pt-6 border-t-2 border-primary-200 text-center">
                    <p className="text-sm text-slate-500">
                      Ce document a été généré automatiquement le{" "}
                      {new Date().toLocaleString("fr-FR")} par le système de
                      gestion documentaire.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Pour toute question concernant cette fiche, veuillez
                      contacter l'administrateur système.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}

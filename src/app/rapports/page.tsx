"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, FileText, AlertCircle } from "lucide-react";
import { agentRubriqueService } from "@/services/agent-rubrique";
import { sousDossiersService } from "@/services/sous-dossiers";
import { piecesService } from "@/services/pieces";
import { piecesCheckService } from "@/services/pieces-check";
import type { PieceWithCheck } from "@/types";
import type {
  ConformityReport,
  SousDossierConformity,
} from "@/components/rapports/types";
import AgentReportCard from "@/components/rapports/AgentReportCard";
import AgentReportCardCompact from "@/components/rapports/AgentReportCardCompact";
import FicheModal from "@/components/rapports/FicheModal";
import RapportsHeader from "@/components/rapports/RapportsHeader";
import "@/styles/print.css";

export default function RapportsPage() {
  const [reports, setReports] = useState<ConformityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRubriques, setLoadingRubriques] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "with-rubriques" | "without-rubriques"
  >("all");
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
      const agents = await agentRubriqueService.getAgentsWithRubriques();

      const reportsData: ConformityReport[] = agents.map((agent) => ({
        agent,
        rubriques: agent.rubrique_id
          ? [
              {
                rubrique: {
                  id: agent.rubrique_id,
                  nom: agent.rubrique_nom || "Rubrique inconnue",
                  description: "",
                },
                sousDossiers: [],
                conformityPercentage: 0,
                totalPieces: 0,
                checkedPieces: 0,
              },
            ]
          : [],
        globalConformity: 0,
      }));

      setReports(reportsData);
    } catch (error) {
      console.error("Erreur lors du chargement des rapports:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRubriqueData = async (agentId: string, rubriqueId: string) => {
    const key = `${agentId}-${rubriqueId}`;
    const report = reports.find((r) => r.agent.id === agentId);
    if (!report) return;

    const rubrique = report.rubriques.find((r) => r.rubrique.id === rubriqueId);
    if (!rubrique || rubrique.sousDossiers.length > 0) return;

    setLoadingRubriques((prev) => new Set(prev).add(key));

    try {
      const sousDossiers =
        await sousDossiersService.getAllSousDossiersByRubrique(rubriqueId);
      const checksData = await piecesCheckService.getPieceChecks(agentId);
      const { processInBatches } = await import("@/lib/utils/batchRequests");

      const sousDossiersWithConformity: SousDossierConformity[] =
        await processInBatches(
          sousDossiers,
          async (sousDossier) => {
            try {
              const piecesData = await piecesService.getAllPiecesBySousDossier(
                sousDossier.id
              );

              const piecesWithStatus: PieceWithCheck[] = piecesData.map(
                (piece) => {
                  const check = checksData.find((c) => c.piece_id === piece.id);
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

              const checkedCount = piecesWithStatus.filter(
                (p) => p.isDisponible === true
              ).length;
              const totalPieces = piecesWithStatus.length;
              const conformityPercentage =
                totalPieces > 0 ? (checkedCount / totalPieces) * 100 : 0;

              let status:
                | "all_checked"
                | "partial_checked"
                | "none_checked"
                | "no_pieces";
              if (totalPieces === 0) {
                status = "no_pieces";
              } else if (checkedCount === totalPieces) {
                status = "all_checked";
              } else if (checkedCount === 0) {
                status = "none_checked";
              } else {
                status = "partial_checked";
              }

              return {
                ...sousDossier,
                pieces: piecesWithStatus,
                conformityPercentage,
                checkedCount,
                totalPieces,
                status,
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
          },
          5
        );

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

      setReports((prevReports) =>
        prevReports.map((r) => {
          if (r.agent.id === agentId) {
            const updatedRubriques = r.rubriques.map((rub) => {
              if (rub.rubrique.id === rubriqueId) {
                return {
                  ...rub,
                  sousDossiers: sousDossiersWithConformity,
                  conformityPercentage: rubriqueConformityPercentage,
                  totalPieces,
                  checkedPieces,
                };
              }
              return rub;
            });

            const globalConformity =
              updatedRubriques.reduce(
                (sum, r) => sum + r.conformityPercentage,
                0
              ) / updatedRubriques.length;

            return {
              ...r,
              rubriques: updatedRubriques,
              globalConformity,
            };
          }
          return r;
        })
      );
    } catch (error) {
      console.error(
        `Erreur lors du chargement de la rubrique ${rubriqueId}:`,
        error
      );
    } finally {
      setLoadingRubriques((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const toggleRubrique = async (agentId: string, rubriqueId: string) => {
    const key = `${agentId}-${rubriqueId}`;
    const newExpanded = new Set(expandedRubriques);

    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
      await loadRubriqueData(agentId, rubriqueId);
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

          const recalculatedRubriques = updatedRubriques.map((rubrique) => {
            const totalPieces = rubrique.sousDossiers.reduce(
              (sum, sd) => sum + sd.totalPieces,
              0
            );
            const checkedPieces = rubrique.sousDossiers.reduce((sum, sd) => {
              const checkedCount = sd.pieces.filter(
                (p: PieceWithCheck) => p.isDisponible === true
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

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.agent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.agent.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.agent.fonction.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filtrer selon l'onglet actif
    if (activeTab === "with-rubriques") {
      return report.rubriques.length > 0;
    } else if (activeTab === "without-rubriques") {
      return report.rubriques.length === 0;
    }
    return true; // "all"
  });

  const reportsWithRubriques = filteredReports.filter(
    (r) => r.rubriques.length > 0
  );
  const reportsWithoutRubriques = filteredReports.filter(
    (r) => r.rubriques.length === 0
  );

  const conformesCount = reports.filter((r) => r.globalConformity >= 80).length;
  const partielsCount = reports.filter(
    (r) => r.globalConformity >= 50 && r.globalConformity < 80
  ).length;
  const nonConformesCount = reports.filter(
    (r) => r.globalConformity < 50
  ).length;

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
        <RapportsHeader
          totalReports={reports.length}
          conformesCount={conformesCount}
          partielsCount={partielsCount}
          nonConformesCount={nonConformesCount}
        />

        {/* Onglets et recherche */}
        <div className="mb-6 space-y-4">
          {/* Onglets */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                activeTab === "all"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Tous les agents
              <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                {reports.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("with-rubriques")}
              className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                activeTab === "with-rubriques"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Avec rubriques
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                {reportsWithRubriques.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("without-rubriques")}
              className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                activeTab === "without-rubriques"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Sans rubriques
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                {reportsWithoutRubriques.length}
              </span>
            </button>
          </div>

          {/* Recherche */}
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
                  : activeTab === "with-rubriques"
                  ? "Aucun agent avec rubrique assignée."
                  : activeTab === "without-rubriques"
                  ? "Tous les agents ont une rubrique assignée."
                  : "Aucun agent n'a encore de données de conformité."}
              </p>
            </div>
          ) : activeTab === "without-rubriques" ? (
            // Vue compacte pour agents sans rubriques
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Agents sans rubrique assignée
                </h3>
                <span className="text-sm text-slate-500">
                  ({reportsWithoutRubriques.length} agent
                  {reportsWithoutRubriques.length > 1 ? "s" : ""})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportsWithoutRubriques.map((report) => (
                  <AgentReportCardCompact
                    key={report.agent.id}
                    agent={report.agent}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Vue normale pour agents avec rubriques ou tous
            <>
              {reportsWithRubriques.map((report) => (
                <AgentReportCard
                  key={report.agent.id}
                  report={report}
                  expandedRubriques={expandedRubriques}
                  loadingRubriques={loadingRubriques}
                  onToggleRubrique={toggleRubrique}
                  onGenerateFiche={handleGenerateFiche}
                  onAvailabilityChange={handleAvailabilityChange}
                />
              ))}

              {/* Afficher les agents sans rubriques seulement si onglet "all" */}
              {activeTab === "all" && reportsWithoutRubriques.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-semibold text-slate-800">
                      Agents sans rubrique assignée
                    </h3>
                    <span className="text-sm text-slate-500">
                      ({reportsWithoutRubriques.length} agent
                      {reportsWithoutRubriques.length > 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportsWithoutRubriques.map((report) => (
                      <AgentReportCardCompact
                        key={report.agent.id}
                        agent={report.agent}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <FicheModal
          isOpen={showFicheModal}
          report={selectedAgentForFiche}
          onClose={handleCloseFicheModal}
          onPrint={handlePrintFiche}
        />
      </DashboardLayout>
    </AuthGuard>
  );
}

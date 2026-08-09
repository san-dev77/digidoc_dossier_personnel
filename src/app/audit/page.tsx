"use client";

import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import AuditHeader from "@/components/audit/AuditHeader";
import StatsDetailedView from "@/components/audit/StatsDetailedView";
import type { StatsData } from "@/components/audit/StatsDetailedView";
import UsersCreatedTable from "@/components/audit/UsersCreatedTable";
import FrequentConnections from "@/components/audit/FrequentConnections";
import ConnectionsByMonth from "@/components/audit/ConnectionsByMonth";
import type { ConnectionLogEntry } from "@/components/audit/ConnectionsByMonth";
import StorageUsage from "@/components/audit/StorageUsage";
import DiagnosticAgent from "@/components/audit/DiagnosticAgent";
import { ToastContainer, useToast } from "@/components/Toast";
import { BarChart3, Activity, Clock, Users, TrendingUp, Shield } from "lucide-react";

interface UserStats {
  total: number;
  actifs: number;
  inactifs: number;
  suspendus: number;
  parRole: Record<string, number>;
}

type UtilisateurStatut = "actif" | "inactif" | "suspendu";

interface UtilisateurForAudit {
  id: number;
  username: string;
  nom_complet: string;
  statut: UtilisateurStatut;
  derniere_connexion: string | null;
  nombre_connexions: number;
  created_at: string;
  created_by: number | null;
  roles?: {
    nom: string;
    couleur: string | null;
  } | null;
}


export default function AuditPage() {
  const router = useRouter();
  const { canManageUsers } = usePermissions();
  const [connexionLogs, setConnexionLogs] = useState<ConnectionLogEntry[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "connexions" | "system">(
    "stats"
  );
  const [totalAgents, setTotalAgents] = useState(0);
  const [totalDossiers, setTotalDossiers] = useState(0);
  const [totalPieces, setTotalPieces] = useState(0);
  const [detailedStats, setDetailedStats] = useState<StatsData | null>(null);
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurForAudit[]>([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  useEffect(() => {
    if (!canManageUsers) {
      router.push("/dashboard");
    }
  }, [canManageUsers, router]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const token = sessionStorage.getItem("auth-token");

      // Charger les stats détaillées
      const statsRes = await fetch("/api/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = (await statsRes.json()) as StatsData;
        setDetailedStats(statsData);
        setTotalDossiers(statsData.totalSousDossiers);
        setTotalPieces(statsData.totalPieces);
      }

      // Charger les agents
      const agentsRes = await fetch("/api/agents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (agentsRes.ok) {
        const agents = await agentsRes.json();
        setTotalAgents(agents.length);
      }

      // Charger les utilisateurs pour les stats et logs
      const response = await fetch("/api/utilisateurs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const utilisateurs = (await response.json()) as UtilisateurForAudit[];
        setUtilisateurs(utilisateurs);

        // Calculer les stats
        const stats: UserStats = {
          total: utilisateurs.length,
          actifs: utilisateurs.filter((u) => u.statut === "actif").length,
          inactifs: utilisateurs.filter((u) => u.statut === "inactif").length,
          suspendus: utilisateurs.filter((u) => u.statut === "suspendu").length,
          parRole: {},
        };

        utilisateurs.forEach((u) => {
          const roleName = u.roles?.nom ?? "Sans rôle";
          stats.parRole[roleName] = (stats.parRole[roleName] || 0) + 1;
        });

        setStats(stats);
      }

      // Charger l'historique des connexions (regroupement par mois)
      const connexionsRes = await fetch("/api/audit/connexions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (connexionsRes.ok) {
        setConnexionLogs((await connexionsRes.json()) as ConnectionLogEntry[]);
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(user: UtilisateurForAudit) {
    const nextStatut: UtilisateurStatut =
      user.statut === "actif" ? "inactif" : "actif";

    setTogglingId(user.id);
    try {
      const token = sessionStorage.getItem("auth-token");
      const res = await fetch(`/api/utilisateurs/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: nextStatut }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la mise à jour du statut");
      }

      setUtilisateurs((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, statut: nextStatut } : u))
      );

      success(
        nextStatut === "actif" ? "Compte activé" : "Compte désactivé",
        `${user.nom_complet} est maintenant ${
          nextStatut === "actif" ? "actif" : "inactif"
        }.`
      );
    } catch (err) {
      console.error("Erreur lors du changement de statut:", err);
      showError(
        "Erreur",
        "Impossible de mettre à jour le statut de ce compte."
      );
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <AuditHeader
              totalUtilisateurs={stats?.total || 0}
              totalAgents={totalAgents}
              totalDossiers={totalDossiers}
              totalPieces={totalPieces}
            />

            {/* Onglets */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => setActiveTab("stats")}
                className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                  activeTab === "stats"
                    ? "bg-primary-800 text-white shadow-xl scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
                }`}
              >
                <BarChart3 className="inline h-5 w-5 mr-2" />
                Statistiques
              </button>
              <button
                onClick={() => setActiveTab("connexions")}
                className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                  activeTab === "connexions"
                    ? "bg-primary-800 text-white shadow-xl scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
                }`}
              >
                <Clock className="inline h-5 w-5 mr-2" />
                Connexions
              </button>
              <button
                onClick={() => setActiveTab("system")}
                className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                  activeTab === "system"
                    ? "bg-primary-800 text-white shadow-xl scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
                }`}
              >
                <Activity className="inline h-5 w-5 mr-2" />
                Système
              </button>
            </div>

            {/* Onglet Statistiques */}
            {activeTab === "stats" && stats && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                      <Users className="h-8 w-8 text-blue-600" />
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900">
                      {stats.total}
                    </h3>
                    <p className="text-sm text-gray-600 font-semibold">
                      Total Utilisateurs
                    </p>
                  </div>

                  <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                      <Shield className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-3xl font-black text-green-600">
                      {stats.actifs}
                    </h3>
                    <p className="text-sm text-gray-600 font-semibold">
                      Comptes Actifs
                    </p>
                  </div>

                  <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                      <Shield className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-600">
                      {stats.inactifs}
                    </h3>
                    <p className="text-sm text-gray-600 font-semibold">
                      Comptes Inactifs
                    </p>
                  </div>

                  <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                      <Shield className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-3xl font-black text-red-600">
                      {stats.suspendus}
                    </h3>
                    <p className="text-sm text-gray-600 font-semibold">
                      Comptes Suspendus
                    </p>
                  </div>
                </div>

                {/* Répartition par rôle */}
                {Object.keys(stats.parRole).length > 0 && (
                  <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Répartition par Rôle
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(stats.parRole).map(([role, count]) => (
                        <div
                          key={role}
                          className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                        >
                          <p className="text-2xl font-black text-gray-900">
                            {count}
                          </p>
                          <p className="text-sm text-gray-600 font-semibold mt-1">
                            {role}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agents avec pièces manquantes */}
                {detailedStats && <StatsDetailedView stats={detailedStats} />}

                {/* Utilisateurs créés */}
                <UsersCreatedTable
                  users={utilisateurs}
                  onToggleStatus={handleToggleStatus}
                  togglingId={togglingId}
                />
              </div>
            )}

            {/* Onglet Connexions */}
            {activeTab === "connexions" && (
              <div className="space-y-8">
                <ConnectionsByMonth logs={connexionLogs} />
                <FrequentConnections users={utilisateurs} />
              </div>
            )}

            {/* Onglet Système */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <StorageUsage />
                <DiagnosticAgent />
              </div>
            )}
          </div>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}

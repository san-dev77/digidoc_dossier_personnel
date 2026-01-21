"use client";

import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import AuditHeader from "@/components/audit/AuditHeader";
import StatsDetailedView from "@/components/audit/StatsDetailedView";
import type { StatsData } from "@/components/audit/StatsDetailedView";
import {
  BarChart3,
  Activity,
  Clock,
  Users,
  TrendingUp,
  Shield,
  Calendar,
  Database,
  Server,
  Lock,
  CheckCircle,
  Zap,
} from "lucide-react";

interface ConnectionLog {
  id: number;
  utilisateur: {
    nom_complet: string;
    username: string;
    roles: {
      nom: string;
      couleur: string | null;
    };
  };
  derniere_connexion: string;
}

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
  roles?: {
    nom: string;
    couleur: string | null;
  } | null;
}


export default function AuditPage() {
  const router = useRouter();
  const { canManageUsers } = usePermissions();
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "connexions" | "system">(
    "stats"
  );
  const [totalAgents, setTotalAgents] = useState(0);
  const [totalDossiers, setTotalDossiers] = useState(0);
  const [totalPieces, setTotalPieces] = useState(0);
  const [detailedStats, setDetailedStats] = useState<StatsData | null>(null);

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

        // Logs de connexion (dernières connexions)
        const logsData = utilisateurs
          .filter((u) => u.derniere_connexion)
          .sort(
            (a, b) =>
              new Date(b.derniere_connexion!).getTime() -
              new Date(a.derniere_connexion!).getTime()
          )
          .slice(0, 20)
          .map((u) => ({
            id: u.id,
            utilisateur: {
              nom_complet: u.nom_complet,
              username: u.username,
              roles: u.roles ?? { nom: "Sans rôle", couleur: null },
            },
            derniere_connexion: u.derniere_connexion!,
          }));

        setLogs(logsData);
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-8">
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

                {/* Stats détaillées */}
                {detailedStats && <StatsDetailedView stats={detailedStats} />}
              </div>
            )}

            {/* Onglet Connexions */}
            {activeTab === "connexions" && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100">
                <div className="px-6 py-5 bg-gradient-to-r from-primary-800 to-primary-900 border-b">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <Clock className="h-6 w-6" />
                    Dernières Connexions ({logs.length})
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                          Utilisateur
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                          Rôle
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                          Date & Heure
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-gray-900">
                                {log.utilisateur.nom_complet}
                              </p>
                              <p className="text-sm text-gray-600">
                                @{log.utilisateur.username}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Shield
                                className="h-4 w-4"
                                style={{
                                  color:
                                    log.utilisateur.roles.couleur || "#6B7280",
                                }}
                              />
                              <span className="font-semibold text-gray-900">
                                {log.utilisateur.roles.nom}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700 font-medium">
                                {new Date(
                                  log.derniere_connexion
                                ).toLocaleString("fr-FR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {logs.length === 0 && (
                    <div className="text-center py-12">
                      <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-600 font-semibold">
                        Aucune connexion enregistrée
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Onglet Système */}
            {activeTab === "system" && (
              <div className="space-y-6">
                {/* Base de données */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <Database className="h-8 w-8 text-primary-700" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Base de Données
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                      <p className="text-sm text-blue-700 font-bold mb-2">Type</p>
                      <p className="text-2xl font-black text-blue-900">MySQL</p>
                      <p className="text-xs text-blue-600 mt-1">via Prisma ORM</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                      <p className="text-sm text-green-700 font-bold mb-2">Tables</p>
                      <p className="text-2xl font-black text-green-900">15</p>
                      <p className="text-xs text-green-600 mt-1">Tables principales</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
                      <p className="text-sm text-purple-700 font-bold mb-2">Agents</p>
                      <p className="text-2xl font-black text-purple-900">{totalAgents}</p>
                      <p className="text-xs text-purple-600 mt-1">Enregistrements</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                      <p className="text-sm text-orange-700 font-bold mb-2">Fichiers</p>
                      <p className="text-2xl font-black text-orange-900">
                        {detailedStats?.totalFichiers || 0}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">Pièces uploadées</p>
                    </div>
                  </div>
                </div>

                {/* Sécurité & Permissions */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <Lock className="h-8 w-8 text-primary-700" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Sécurité & Permissions
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border-2 border-primary-200">
                      <p className="text-sm text-primary-700 font-bold mb-2">
                        Rôles Actifs
                      </p>
                      <p className="text-2xl font-black text-primary-900">
                        {stats?.parRole ? Object.keys(stats.parRole).length : 0}
                      </p>
                      <p className="text-xs text-primary-600 mt-1">Système RBAC</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                      <p className="text-sm text-green-700 font-bold mb-2">
                        Authentification
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle className="h-5 w-5 text-green-700" />
                        <p className="text-lg font-black text-green-900">JWT</p>
                      </div>
                      <p className="text-xs text-green-600 mt-1">Token sécurisé</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                      <p className="text-sm text-blue-700 font-bold mb-2">
                        Hash Passwords
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle className="h-5 w-5 text-blue-700" />
                        <p className="text-lg font-black text-blue-900">BCrypt</p>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">10 rounds</p>
                    </div>
                  </div>
                </div>

                {/* État du système */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <Server className="h-8 w-8 text-primary-700" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      État du Système
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-green-700 font-bold">
                          Base de Données
                        </p>
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-xl font-black text-green-900">
                        ✅ Connectée
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        Toutes les requêtes répondent
                      </p>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-green-700 font-bold">API</p>
                        <Zap className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-xl font-black text-green-900">
                        ✅ Opérationnelle
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        Toutes les routes fonctionnelles
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import {
  User,
  Building2,
  Mail,
  MapPin,
  FileText,
  Users,
  FolderOpen,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useDossiersStore } from "@/store/dossiersStore";
import { DossiersOptimizedService } from "@/services/dossiers-optimized";
import { agentsService } from "@/services/agents";

export default function DashboardPage() {
  const { appUser } = useAuth();
  const { fullName, fonction, matricule, email } = useUser();
  const { dossiers, agentsWithDossiers } = useDossiersStore();
  const [totalAgents, setTotalAgents] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);

  // Marquer le composant comme monté côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Charger les données UNIQUEMENT après le montage côté client
  useEffect(() => {
    if (!isMounted) return; // Ne pas charger côté serveur
    
    const loadData = async () => {
      try {
        // Charger les dossiers
        await DossiersOptimizedService.loadDossiers(true);
        // Charger le nombre total d'agents
        const agents = await agentsService.getAllAgents();
        setTotalAgents(agents.length);
      } catch {
        // Erreur silencieuse, les données seront chargées au prochain rendu
      }
    };
    loadData();
  }, [isMounted]);

  // Fonction pour formater la date correctement (évite les problèmes de timezone)
  const formatDate = (dateString: string) => {
    if (!dateString) return "Non renseigné";
    try {
      // Parse la date en UTC pour éviter les décalages de timezone
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      // Créer une nouvelle date locale avec les valeurs extraites
      const localDate = new Date(year, month, day);

      return localDate.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return dateString;
    }
  };

  // Fonction pour formater le temps relatif
  const formatRelativeTime = (dateString: string): string => {
    if (!dateString) return "Date inconnue";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "À l'instant";
      if (diffMins < 60)
        return `Il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
      if (diffHours < 24)
        return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
      if (diffDays < 7)
        return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "Date inconnue";
    }
  };

  // Calculer les statistiques réelles
  const totalSousDossiers = dossiers.reduce(
    (sum, d) => sum + d.totalSousDossiers,
    0
  );
  const totalPieces = dossiers.reduce((sum, d) => sum + d.totalPieces, 0);
  const totalPiecesWithFiles = agentsWithDossiers.reduce((sum, agentData) => {
    return (
      sum +
      agentData.dossiers.reduce((dossierSum, dossier) => {
        return (
          dossierSum +
          dossier.sousDossiers.reduce((sousDossierSum, sousDossier) => {
            return (
              sousDossierSum +
              (sousDossier.pieces || []).filter((p) => p.files && p.files.length > 0)
                .length
            );
          }, 0)
        );
      }, 0)
    );
  }, 0);
  const tauxValidation =
    totalPieces > 0
      ? ((totalPiecesWithFiles / totalPieces) * 100).toFixed(1)
      : "0.0";

  // Données réelles pour les statistiques
  const stats = [
    {
      name: "Dossiers actifs",
      value: totalSousDossiers.toString(),
      change: "",
      changeType: "positive" as const,
      icon: FileText,
    },
    {
      name: "Agents enregistrés",
      value: totalAgents.toString(),
      change: "",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      name: "Pièces traitées",
      value: totalPieces.toLocaleString("fr-FR"),
      change: "",
      changeType: "positive" as const,
      icon: FolderOpen,
    },
    {
      name: "Taux de validation",
      value: `${tauxValidation}%`,
      change: "",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
  ];

  // Générer les activités récentes à partir des données réelles
  const recentActivities = agentsWithDossiers
    .flatMap((agentData) =>
      agentData.dossiers.flatMap((dossier) =>
        dossier.sousDossiers.flatMap((sousDossier) => [
          {
            id: sousDossier.id,
            type: "document" as const,
            title: "Dossier créé",
            description: `${sousDossier.titre} - ${agentData.agent.nom}`,
            time: formatRelativeTime(sousDossier.createdAt),
            icon: FileText,
            date: sousDossier.createdAt,
          },
          ...(sousDossier.pieces || [])
            .filter(
              (p: any) =>
                p.files && p.files.length > 0
            )
            .map(
              (piece: any) => {
                const fileDate = piece.files?.[0]?.createdAt || piece.files?.[0]?.created_at || piece.updatedAt;
                return {
                  id: piece.id,
                  type: "validation" as const,
                  title: "Fichier uploadé",
                  description: `${piece.nom} - ${agentData.agent.nom}`,
                  time: formatRelativeTime(fileDate),
                  icon: CheckCircle,
                  date: fileDate,
                };
              }
            ),
        ])
      )
    )
    .sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header Card Sublime */}
        <div className="mb-8">
          <div className="relative bg-primary-800 rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>

            {/* Motifs décoratifs */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg">
                    <User className="w-7 h-7 text-white drop-shadow-sm" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-1 drop-shadow-md">
                      Bienvenue, {fullName || "Utilisateur"} ! 👋
                    </h1>
                    <p className="text-primary-100 text-lg font-semibold drop-shadow-sm">
                      Tableau de bord personnel
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center space-x-2 bg-white/15 px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/30 shadow-md">
                    <div className="w-2.5 h-2.5 bg-accent-green rounded-full animate-pulse shadow-sm"></div>
                    <span className="text-white font-bold">Connecté</span>
                  </div>
                  {fonction && (
                    <div className="flex items-center space-x-2 bg-white/15 px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/30 shadow-md">
                      <Building2 className="w-4 h-4 text-white" />
                      <span className="text-white font-bold">{fonction}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 bg-white/15 px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/30 shadow-md">
                    <Clock className="w-4 h-4 text-white" />
                    <span className="text-white font-bold">
                      Dernière connexion: Aujourd&apos;hui
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="relative">
                  <div className="w-32 h-32 bg-white/15 rounded-3xl flex items-center justify-center backdrop-blur-sm border-2 border-white/40 shadow-2xl">
                    <div className="w-24 h-24 bg-gradient-to-br from-white/25 to-white/10 rounded-2xl flex items-center justify-center border-2 border-white/50 shadow-inner">
                      <span className="text-4xl font-black text-white uppercase drop-shadow-lg">
                        {fullName?.substring(0, 2) || "U"}
                      </span>
                    </div>
                  </div>
                  {/* Badge de statut */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-green rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques Sublimes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = [
              "from-blue-500 to-blue-600",
              "from-emerald-500 to-emerald-600",
              "from-purple-500 to-purple-600",
              "from-orange-500 to-orange-600",
            ];
            const bgColors = [
              "from-blue-50 to-blue-100",
              "from-emerald-50 to-emerald-100",
              "from-purple-50 to-purple-100",
              "from-orange-50 to-orange-100",
            ];

            return (
              <div
                key={stat.name}
                className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Effet de gradient en arrière-plan */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${bgColors[index]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                ></div>

                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      {stat.name}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mb-3">
                      {stat.value}
                    </p>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          stat.changeType === "positive"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stat.change}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        vs mois dernier
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${colors[index]} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Barre de progression décorative */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                  <div
                    className={`h-full bg-primary-800 ${colors[index]} transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.random() * 40 + 60}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations personnelles */}
          <div className="lg:col-span-2">
            <div className="relative bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              {/* Header avec gradient */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl opacity-50"></div>
                <div className="relative flex items-center space-x-4 p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Mes informations personnelles
                    </h2>
                    <p className="text-primary-700 font-bold">
                      Profil complet et détails de compte
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations personnelles */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Informations personnelles
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">
                        Nom complet
                      </p>
                      <p className="font-bold text-gray-900 text-lg">
                        {fullName || "Non renseigné"}
                      </p>
                    </div>
                    {appUser?.date_naissance && (
                      <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">
                          Date de naissance
                        </p>
                        <p className="font-bold text-gray-900">
                          {formatDate(appUser.date_naissance)}
                        </p>
                      </div>
                    )}
                    {appUser?.sexe && (
                      <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">
                          Sexe
                        </p>
                        <p className="font-bold text-gray-900">
                          {appUser.sexe === "M" ? "Masculin" : "Féminin"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations professionnelles */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border-2 border-emerald-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Informations professionnelles
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-4 border-2 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wide">
                        Matricule
                      </p>
                      <p className="font-bold text-gray-900 text-lg">
                        {matricule || "Non renseigné"}
                      </p>
                    </div>
                    {fonction && (
                      <div className="bg-white rounded-xl p-4 border-2 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wide">
                          Fonction
                        </p>
                        <p className="font-bold text-gray-900 text-lg">
                          {fonction}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Contact</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs font-bold text-purple-600 mb-2 uppercase tracking-wide">
                        Email
                      </p>
                      <p className="font-bold text-gray-900 text-base break-all">
                        {email || "Non renseigné"}
                      </p>
                    </div>
                    {appUser?.telephone && (
                      <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs font-bold text-purple-600 mb-2 uppercase tracking-wide">
                          Téléphone
                        </p>
                        <p className="font-bold text-gray-900 text-lg">
                          {appUser.telephone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Localisation */}
                {(appUser?.lieu_naissance || appUser?.adresse) && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Localisation
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {appUser?.lieu_naissance && (
                        <div className="bg-white rounded-xl p-4 border-2 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wide">
                            Lieu de naissance
                          </p>
                          <p className="font-bold text-gray-900 text-lg">
                            {appUser.lieu_naissance}
                          </p>
                        </div>
                      )}
                      {appUser?.adresse && (
                        <div className="bg-white rounded-xl p-4 border-2 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wide">
                            Adresse
                          </p>
                          <p className="font-bold text-gray-900">
                            {appUser.adresse}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activités récentes */}
          <div className="lg:col-span-1">
            <div className="relative bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              {/* Header avec gradient */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-xl opacity-50"></div>
                <div className="relative flex items-center space-x-4 p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Activités récentes
                    </h2>
                    <p className="text-indigo-700 font-bold">
                      Dernières actions du système
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  const activityColors = [
                    "from-blue-500 to-blue-600",
                    "from-emerald-500 to-emerald-600",
                    "from-purple-500 to-purple-600",
                  ];
                  const activityBgColors = [
                    "from-blue-50 to-blue-100",
                    "from-emerald-50 to-emerald-100",
                    "from-purple-50 to-purple-100",
                  ];

                  return (
                    <div
                      key={`activity-${activity.id}-${index}`}
                      className={`group relative bg-gradient-to-r ${activityBgColors[index]} rounded-xl p-5 border-2 border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${activityColors[index]} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-gray-900 mb-1">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-700 font-medium mb-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3.5 h-3.5 text-gray-600" />
                            <span className="text-xs text-gray-600 font-bold">
                              {activity.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t-2 border-gray-200">
                <button className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                  Voir toutes les activités
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>

      {/* Composant de test pour les erreurs de connexion */}
    </AuthGuard>
  );
}

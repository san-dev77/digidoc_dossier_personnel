"use client";

import { useAuth } from "@/hooks/useAuth";
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

export default function DashboardPage() {
  const { appUser } = useAuth();

  // Données de démonstration pour les statistiques
  const stats = [
    {
      name: "Dossiers actifs",
      value: "24",
      change: "+12%",
      changeType: "positive",
      icon: FileText,
    },
    {
      name: "Agents enregistrés",
      value: "156",
      change: "+8%",
      changeType: "positive",
      icon: Users,
    },
    {
      name: "Pièces traitées",
      value: "1,234",
      change: "+23%",
      changeType: "positive",
      icon: FolderOpen,
    },
    {
      name: "Taux de validation",
      value: "94.2%",
      change: "+2.1%",
      changeType: "positive",
      icon: TrendingUp,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "document",
      title: "Nouveau dossier créé",
      description: "Dossier de Marie Dubois créé avec succès",
      time: "Il y a 5 minutes",
      icon: FileText,
    },
    {
      id: 2,
      type: "validation",
      title: "Document validé",
      description: "CNI-001 validé par l'agent responsable",
      time: "Il y a 1 heure",
      icon: CheckCircle,
    },
    {
      id: 3,
      type: "agent",
      title: "Nouvel agent ajouté",
      description: "Jean Martin ajouté au système",
      time: "Il y a 2 heures",
      icon: Users,
    },
  ];

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
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-1">
                      Bienvenue, {appUser?.nom} ! 👋
                    </h1>
                    <p className="text-primary-100 text-lg font-medium">
                      Tableau de bord personnel
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                    <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
                    <span className="text-white font-medium">Connecté</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                    <Clock className="w-4 h-4 text-white" />
                    <span className="text-white font-medium">
                      Dernière connexion: Aujourd&apos;hui
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="relative">
                  <div className="w-28 h-28 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-xl">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
                      <span className="text-3xl font-bold text-white">
                        {appUser?.nom?.[0]}
                        {appUser?.nom?.[1]}
                      </span>
                    </div>
                  </div>
                  {/* Badge de statut */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent-green rounded-full flex items-center justify-center border-2 border-white">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
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
            <div className="relative bg-white rounded-2xl p-8 border border-gray-200 shadow-xl overflow-hidden">
              {/* Header avec gradient */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl"></div>
                <div className="relative flex items-center space-x-4 p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Mes informations personnelles
                    </h2>
                    <p className="text-primary-600 font-medium">
                      Profil complet et détails de compte
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Informations personnelles */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Informations personnelles
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/70 rounded-xl p-4 border border-blue-200/50">
                      <p className="text-sm font-semibold text-blue-600 mb-1">
                        Nom complet
                      </p>
                      <p className="font-bold text-gray-900 text-lg">
                        {appUser?.nom}
                      </p>
                    </div>
                    {appUser?.date_naissance && (
                      <div className="bg-white/70 rounded-xl p-4 border border-blue-200/50">
                        <p className="text-sm font-semibold text-blue-600 mb-1">
                          Date de naissance
                        </p>
                        <p className="font-bold text-gray-900">
                          {appUser.date_naissance}
                        </p>
                      </div>
                    )}
                    {appUser?.sexe && (
                      <div className="bg-white/70 rounded-xl p-4 border border-blue-200/50">
                        <p className="text-sm font-semibold text-blue-600 mb-1">
                          Sexe
                        </p>
                        <p className="font-bold text-gray-900">
                          {appUser.sexe}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations professionnelles */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Informations professionnelles
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/70 rounded-xl p-4 border border-emerald-200/50">
                      <p className="text-sm font-semibold text-emerald-600 mb-1">
                        Matricule
                      </p>
                      <p className="font-bold text-gray-900 text-lg">
                        {appUser?.matricule}
                      </p>
                    </div>
                    {appUser?.fonction && (
                      <div className="bg-white/70 rounded-xl p-4 border border-emerald-200/50">
                        <p className="text-sm font-semibold text-emerald-600 mb-1">
                          Fonction
                        </p>
                        <p className="font-bold text-gray-900">
                          {appUser.fonction}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Contact</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/70 rounded-xl p-4 border border-purple-200/50">
                      <p className="text-sm font-semibold text-purple-600 mb-1">
                        Email
                      </p>
                      <p className="font-bold text-gray-900 text-lg">
                        {appUser?.email}
                      </p>
                    </div>
                    {appUser?.telephone && (
                      <div className="bg-white/70 rounded-xl p-4 border border-purple-200/50">
                        <p className="text-sm font-semibold text-purple-600 mb-1">
                          Téléphone
                        </p>
                        <p className="font-bold text-gray-900">
                          {appUser.telephone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Localisation */}
                {appUser?.lieu_naissance && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Localisation
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white/70 rounded-xl p-4 border border-orange-200/50">
                        <p className="text-sm font-semibold text-orange-600 mb-1">
                          Lieu de naissance
                        </p>
                        <p className="font-bold text-gray-900">
                          {appUser.lieu_naissance}
                        </p>
                      </div>
                      {appUser?.adresse && (
                        <div className="bg-white/70 rounded-xl p-4 border border-orange-200/50">
                          <p className="text-sm font-semibold text-orange-600 mb-1">
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
            <div className="relative bg-white rounded-2xl p-8 border border-gray-200 shadow-xl overflow-hidden">
              {/* Header avec gradient */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl"></div>
                <div className="relative flex items-center space-x-4 p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Activités récentes
                    </h2>
                    <p className="text-indigo-600 font-medium">
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
                      key={activity.id}
                      className={`group relative bg-gradient-to-r ${activityBgColors[index]} rounded-2xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${activityColors[index]} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 mb-1">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500 font-medium">
                              {activity.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl">
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

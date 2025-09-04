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
        {/* Carte de bienvenue */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  Bienvenue, {appUser?.prenom} ! 👋
                </h1>
                <p className="text-slate-200 text-lg mb-4">
                  Voici un aperçu de votre tableau de bord personnel
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-slate-200">Connecté</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-slate-200">
                      Dernière connexion: Aujourd&apos;hui
                    </span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {appUser?.prenom?.[0]}
                      {appUser?.nom?.[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className="bg-white rounded-xl p-6 border border-slate-300 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shadow-sm">
                    <Icon className="w-6 h-6 text-slate-700" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-slate-500 ml-2">
                    vs mois dernier
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations personnelles */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 border border-slate-300 shadow-md">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Mes informations personnelles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                      <User className="w-5 h-5 text-slate-700" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Informations personnelles
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600">Nom complet</p>
                      <p className="font-medium text-slate-900">
                        {appUser?.prenom} {appUser?.nom}
                      </p>
                    </div>
                    {appUser?.date_naissance && (
                      <div>
                        <p className="text-sm text-slate-600">
                          Date de naissance
                        </p>
                        <p className="font-medium text-slate-900">
                          {appUser.date_naissance}
                        </p>
                      </div>
                    )}
                    {appUser?.sexe && (
                      <div>
                        <p className="text-sm text-slate-600">Sexe</p>
                        <p className="font-medium text-slate-900">
                          {appUser.sexe}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations professionnelles */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                      <Building2 className="w-5 h-5 text-slate-700" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Informations professionnelles
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600">Matricule</p>
                      <p className="font-medium text-slate-900">
                        {appUser?.matricule}
                      </p>
                    </div>
                    {appUser?.fonction && (
                      <div>
                        <p className="text-sm text-slate-600">Fonction</p>
                        <p className="font-medium text-slate-900">
                          {appUser.fonction}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                      <Mail className="w-5 h-5 text-slate-700" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Contact
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-medium text-slate-900">
                        {appUser?.email}
                      </p>
                    </div>
                    {appUser?.telephone && (
                      <div>
                        <p className="text-sm text-slate-600">Téléphone</p>
                        <p className="font-medium text-slate-900">
                          {appUser.telephone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Localisation */}
                {appUser?.lieu_naissance && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                        <MapPin className="w-5 h-5 text-slate-700" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Localisation
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-600">
                          Lieu de naissance
                        </p>
                        <p className="font-medium text-slate-900">
                          {appUser.lieu_naissance}
                        </p>
                      </div>
                      {appUser?.adresse && (
                        <div>
                          <p className="text-sm text-slate-600">Adresse</p>
                          <p className="font-medium text-slate-900">
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
            <div className="bg-white rounded-xl p-6 border border-slate-300 shadow-md">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Activités récentes
              </h2>
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Icon className="w-4 h-4 text-slate-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Voir toutes les activités
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

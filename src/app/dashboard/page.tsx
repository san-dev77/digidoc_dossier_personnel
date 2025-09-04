"use client";

import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import {
  LogOut,
  User,
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function DashboardPage() {
  const { appUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">DigiDoc</h1>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {appUser?.prenom} {appUser?.nom}
                  </p>
                  <p className="text-xs text-slate-600">
                    {appUser?.fonction || "Utilisateur"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Bienvenue, {appUser?.prenom} !
            </h2>
            <p className="text-slate-600">
              Voici un aperçu de vos informations personnelles
            </p>
          </div>

          {/* User Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Informations personnelles */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
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
                    <p className="text-sm text-slate-600">Date de naissance</p>
                    <p className="font-medium text-slate-900">
                      {appUser.date_naissance}
                    </p>
                  </div>
                )}
                {appUser?.sexe && (
                  <div>
                    <p className="text-sm text-slate-600">Sexe</p>
                    <p className="font-medium text-slate-900">{appUser.sexe}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Informations professionnelles */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Contact
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="font-medium text-slate-900">{appUser?.email}</p>
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
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Localisation
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">Lieu de naissance</p>
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

            {/* Situation personnelle */}
            {appUser?.situation_matrimoniale && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-pink-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Situation personnelle
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">
                      Situation matrimoniale
                    </p>
                    <p className="font-medium text-slate-900">
                      {appUser.situation_matrimoniale}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

"use client";

import {
  X,
  Shield,
  Mail,
  Phone,
  Building2,
  Calendar,
  User,
  Clock,
} from "lucide-react";

interface RoleData {
  nom: string;
  code: string;
  couleur: string | null;
  description: string | null;
}

interface UtilisateurDetails {
  id: number;
  username: string;
  email: string;
  nom_complet: string;
  roles: RoleData;
  statut: string;
  telephone: string | null;
  departement: string | null;
  derniere_connexion: string | null;
  created_at: string;
}

interface UtilisateurDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  utilisateur: UtilisateurDetails | null;
}

export default function UtilisateurDetailsModal({
  isOpen,
  onClose,
  utilisateur,
}: UtilisateurDetailsModalProps) {
  if (!isOpen || !utilisateur) return null;

  const getStatutBadge = (statut: string) => {
    const styles = {
      actif: "bg-success-100 text-success-800 border-success-200",
      inactif: "bg-gray-100 text-gray-800 border-gray-200",
      suspendu: "bg-error-100 text-error-800 border-error-200",
    };
    return styles[statut as keyof typeof styles] || styles.inactif;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto border-2 border-gray-100">
        {/* Header */}
        <div
          className="sticky top-0 px-5 py-4 flex items-center justify-between border-b border-gray-200 z-10"
          style={{
            background: `linear-gradient(135deg, ${
              utilisateur.roles.couleur || "#6B7280"
            } 0%, ${utilisateur.roles.couleur || "#6B7280"}dd 100%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {utilisateur.nom_complet}
              </h2>
              <p className="text-white/80 text-xs">@{utilisateur.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Rôle */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <Shield
              className="h-8 w-8"
              style={{ color: utilisateur.roles.couleur || "#6B7280" }}
            />
            <div>
              <p className="text-sm font-bold text-gray-900">
                {utilisateur.roles.nom}
              </p>
              {utilisateur.roles.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {utilisateur.roles.description}
                </p>
              )}
            </div>
          </div>

          {/* Informations */}
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-600 font-bold">Email</p>
              </div>
              <p className="text-base font-medium text-gray-900">
                {utilisateur.email}
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-purple-600" />
                <p className="text-sm text-purple-600 font-bold">
                  Nom d&apos;utilisateur
                </p>
              </div>
              <p className="text-base font-medium text-gray-900">
                @{utilisateur.username}
              </p>
            </div>

            {utilisateur.telephone && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-600 font-bold">Téléphone</p>
                </div>
                <p className="text-base font-medium text-gray-900">
                  {utilisateur.telephone}
                </p>
              </div>
            )}

            {utilisateur.departement && (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-orange-600" />
                  <p className="text-sm text-orange-600 font-bold">
                    Département
                  </p>
                </div>
                <p className="text-base font-medium text-gray-900">
                  {utilisateur.departement}
                </p>
              </div>
            )}
          </div>

          {/* Dates & Statut */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500 font-semibold">Créé le</p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(utilisateur.created_at).toLocaleDateString(
                    "fr-FR",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500 font-semibold">
                  Dernière connexion
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {utilisateur.derniere_connexion
                    ? new Date(
                        utilisateur.derniere_connexion
                      ).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Jamais connecté"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-semibold">Statut:</p>
              <span
                className={`px-3 py-1.5 text-sm font-bold rounded-full ${getStatutBadge(
                  utilisateur.statut
                )}`}
              >
                {utilisateur.statut.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-900 transition-all font-semibold text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

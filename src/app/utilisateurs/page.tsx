"use client";

import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { Users as UsersIcon, Shield } from "lucide-react";
import UtilisateursHeader from "@/components/utilisateurs/UtilisateursHeader";
import UtilisateursSearchBar from "@/components/utilisateurs/UtilisateursSearchBar";
import UtilisateursTable from "@/components/utilisateurs/UtilisateursTable";
import UtilisateurForm from "@/components/UtilisateurForm";
import UtilisateurDetailsModal from "@/components/utilisateurs/UtilisateurDetailsModal";
import RolesPermissionsView from "@/components/utilisateurs/RolesPermissionsView";
import { ToastContainer, useToast } from "@/components/Toast";
import type { RoleData, Utilisateur } from "@/types/rbac";

export default function UtilisateursPage() {
  const router = useRouter();
  const { hasPermission, canManageUsers, isAdmin } = usePermissions();

  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  // Protection
  useEffect(() => {
    if (!canManageUsers) {
      router.push("/dashboard");
    }
  }, [canManageUsers, router]);

  // Chargement
  useEffect(() => {
    fetchUtilisateurs();
    fetchRoles();
  }, []);

  async function fetchUtilisateurs() {
    try {
      const token = sessionStorage.getItem("auth-token");
      const response = await fetch("/api/utilisateurs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setUtilisateurs(await response.json());
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoles() {
    try {
      const token = sessionStorage.getItem("auth-token");
      const response = await fetch("/api/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setRoles(await response.json());
      }
    } catch (error) {
      console.error("Erreur chargement rôles:", error);
    }
  }

  async function handleCreate(data: Record<string, unknown>) {
    try {
      const token = sessionStorage.getItem("auth-token");
      const response = await fetch("/api/utilisateurs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setShowCreateModal(false);
        fetchUtilisateurs();
      }
    } catch (error) {
      console.error("Erreur création:", error);
    }
  }

  async function handleEdit(data: Record<string, unknown>) {
    if (!selectedUser) return;
    try {
      const token = sessionStorage.getItem("auth-token");
      const response = await fetch(`/api/utilisateurs/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUtilisateurs();
      }
    } catch (error) {
      console.error("Erreur modification:", error);
    }
  }

  async function handleToggleActive(user: Utilisateur) {
    const nextStatut = user.statut === "actif" ? "inactif" : "actif";

    setTogglingId(user.id);
    try {
      const token = sessionStorage.getItem("auth-token");
      const response = await fetch(`/api/utilisateurs/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: nextStatut }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut");
      }

      setUtilisateurs((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, statut: nextStatut } : u))
      );

      success(
        nextStatut === "actif" ? "Compte activé" : "Compte désactivé",
        `${user.nom_complet} ${
          nextStatut === "actif" ? "peut de nouveau" : "ne peut plus"
        } se connecter.`
      );
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
      showError("Erreur", "Impossible de mettre à jour le statut de ce compte.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!selectedUser) return;
    try {
      const token = sessionStorage.getItem("auth-token");
      const response = await fetch(`/api/utilisateurs/${selectedUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUtilisateurs();
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  }

  const utilisateursFiltres = utilisateurs.filter(
    (u) =>
      u.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <UtilisateursHeader
              totalUtilisateurs={utilisateurs.length}
              onCreateClick={() => setShowCreateModal(true)}
              canCreate={hasPermission("utilisateurs", "create")}
            />

            {/* Onglets */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => setActiveTab("users")}
                className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                  activeTab === "users"
                    ? "bg-primary-800 text-white shadow-xl scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
                }`}
              >
                <UsersIcon className="inline h-5 w-5 mr-2" />
                Utilisateurs
              </button>
              <button
                onClick={() => setActiveTab("roles")}
                className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                  activeTab === "roles"
                    ? "bg-primary-800 text-white shadow-xl scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
                }`}
              >
                <Shield className="inline h-5 w-5 mr-2" />
                Rôles & Permissions
              </button>
            </div>

            {/* Vue Utilisateurs */}
            {activeTab === "users" && (
              <>
                <UtilisateursSearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />

                <UtilisateursTable
                  utilisateurs={utilisateursFiltres}
                  onUserClick={(user) => {
                    setSelectedUser(user);
                    setShowDetailsModal(true);
                  }}
                  onEdit={(user) => {
                    setSelectedUser(user);
                    setShowEditModal(true);
                  }}
                  onDelete={(user) => {
                    setSelectedUser(user);
                    setShowDeleteModal(true);
                  }}
                  onToggleActive={handleToggleActive}
                  togglingId={togglingId}
                  canUpdate={hasPermission("utilisateurs", "update")}
                  canDelete={hasPermission("utilisateurs", "delete")}
                />
              </>
            )}

            {/* Vue Rôles & Permissions */}
            {activeTab === "roles" && (
              <RolesPermissionsView roles={roles} onRolesChange={fetchRoles} />
            )}

            {/* Modals */}
            <UtilisateurForm
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreate}
              roles={roles}
              mode="create"
              canManageSecurity={isAdmin}
            />

            <UtilisateurForm
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}
              onSubmit={handleEdit}
              utilisateur={selectedUser}
              roles={roles}
              mode="edit"
              canManageSecurity={isAdmin}
            />

            <UtilisateurDetailsModal
              isOpen={showDetailsModal}
              onClose={() => {
                setShowDetailsModal(false);
                setSelectedUser(null);
              }}
              utilisateur={selectedUser}
            />

            {/* Modal Suppression */}
            {showDeleteModal && selectedUser && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-error-200">
                  <h3 className="text-xl font-bold mb-4 text-error-600">
                    Confirmer la Suppression
                  </h3>
                  <p className="text-gray-700 mb-6">
                    Êtes-vous sûr de vouloir supprimer{" "}
                    <strong>{selectedUser.nom_complet}</strong> ? Cette action
                    est irréversible.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setSelectedUser(null);
                      }}
                      className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 px-4 py-3 bg-error-600 hover:bg-error-700 text-white rounded-xl font-semibold transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}

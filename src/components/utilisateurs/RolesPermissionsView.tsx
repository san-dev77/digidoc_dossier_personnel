"use client";

import { useState, useEffect } from "react";
import { Shield, Check, X, Info, Users as UsersIcon, Settings, Edit } from "lucide-react";
import RolePermissionsEditor from "./RolePermissionsEditor";
import RoleEditModal from "./RoleEditModal";
import type { RoleData } from "@/types/rbac";

interface Permission {
  id: number;
  code: string;
  nom_affichage: string;
  categorie: string;
}

interface RolesPermissionsViewProps {
  roles: RoleData[];
  onRolesChange: () => void;
}

export default function RolesPermissionsView({ roles, onRolesChange }: RolesPermissionsViewProps) {
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(roles[0] || null);
  const [showPermissionsEditor, setShowPermissionsEditor] = useState(false);
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger toutes les permissions au montage
  useEffect(() => {
    fetchAllPermissions();
  }, []);

  // Charger les permissions du rôle sélectionné
  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole.id);
    }
  }, [selectedRole]);

  async function fetchAllPermissions() {
    try {
      const token = sessionStorage.getItem("auth-token");
      const response = await fetch("/api/permissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setAllPermissions(await response.json());
      }
    } catch (error) {
      console.error("Erreur chargement permissions:", error);
    }
  }

  async function fetchRolePermissions(roleId: number) {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("auth-token");
      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setRolePermissions(await response.json());
      }
    } catch (error) {
      console.error("Erreur chargement permissions rôle:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = () => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole.id);
    }
  };

  // Grouper les permissions par catégorie
  const getPermissionsByCategory = () => {
    const permsByCategory: Record<string, { granted: Permission[]; denied: Permission[] }> = {};
    
    allPermissions.forEach((perm) => {
      if (!permsByCategory[perm.categorie]) {
        permsByCategory[perm.categorie] = { granted: [], denied: [] };
      }
      
      const isGranted = rolePermissions.some((rp) => rp.id === perm.id);
      if (isGranted) {
        permsByCategory[perm.categorie].granted.push(perm);
      } else {
        permsByCategory[perm.categorie].denied.push(perm);
      }
    });
    
    return permsByCategory;
  };

  const getPermissionsByRoleOLD = (roleCode: string) => {
    const categories = [
      {
        name: "Agents",
        icon: "👥",
        permissions: [
          { code: "create", label: "Créer des agents" },
          { code: "read", label: "Consulter les agents" },
          { code: "update", label: "Modifier les agents" },
          { code: "delete", label: "Supprimer des agents" },
          { code: "export", label: "Exporter des agents" },
          { code: "import", label: "Importer des agents" },
        ],
      },
      {
        name: "Rubriques",
        icon: "📁",
        permissions: [
          { code: "create", label: "Créer des rubriques" },
          { code: "read", label: "Consulter les rubriques" },
          { code: "update", label: "Modifier les rubriques" },
          { code: "delete", label: "Supprimer des rubriques" },
        ],
      },
      {
        name: "Utilisateurs",
        icon: "🛡️",
        permissions: [
          { code: "create", label: "Créer des utilisateurs" },
          { code: "read", label: "Consulter les utilisateurs" },
          { code: "update", label: "Modifier les utilisateurs" },
          { code: "delete", label: "Supprimer des utilisateurs" },
        ],
      },
      {
        name: "Rôles",
        icon: "🔑",
        permissions: [
          { code: "create", label: "Créer des rôles" },
          { code: "read", label: "Consulter les rôles" },
          { code: "update", label: "Modifier les rôles" },
          { code: "delete", label: "Supprimer des rôles" },
        ],
      },
    ];

    return categories.map((cat) => ({
      ...cat,
      permissions: cat.permissions.map((perm) => ({
        ...perm,
        granted: hasPermission(roleCode, cat.name.toLowerCase(), perm.code),
      })),
    }));
  };

  const hasPermission = (roleCode: string, category: string, action: string): boolean => {
    if (roleCode === "super_admin") return true;
    
    if (roleCode === "admin_rh") {
      if (category === "agents" || category === "rubriques") return true;
      if (category === "utilisateurs" && action === "read") return true;
      return false;
    }
    
    if (roleCode === "gestionnaire") {
      if (category === "agents" && action !== "delete") return true;
      if (category === "rubriques" && action !== "delete") return true;
      return false;
    }
    
    if (roleCode === "consultant") {
      if (action === "read" || action === "export") return true;
      return false;
    }
    
    return false;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Cartes des rôles */}
      <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {roles.map((role) => (
          <div
            key={role.id}
            onClick={() => setSelectedRole(role)}
            className={`relative overflow-hidden rounded-xl p-6 cursor-pointer transition-all duration-300 ${
              selectedRole?.id === role.id
                ? "ring-4 ring-blue-400 shadow-2xl scale-105"
                : "shadow-lg hover:shadow-xl hover:scale-102"
            }`}
            style={{
              background: `linear-gradient(135deg, ${role.couleur || "#6B7280"} 0%, ${role.couleur || "#6B7280"}dd 100%)`,
            }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Shield className="h-8 w-8 text-white" />
                {role.is_system && (
                  <span className="px-2 py-1 bg-white/20 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                    Système
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{role.nom}</h3>
              <p className="text-white/80 text-sm mb-4 line-clamp-2">
                {role.description || "Pas de description"}
              </p>
              <div className="flex items-center gap-2 text-white/90">
                <UsersIcon className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {role._count?.utilisateurs || 0} utilisateur(s)
                </span>
              </div>
            </div>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        ))}
      </div>

      {/* Permissions détaillées */}
      {selectedRole && (
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-100">
          <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-100">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${selectedRole.couleur || "#6B7280"} 0%, ${selectedRole.couleur || "#6B7280"}dd 100%)`,
                }}
              >
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900">{selectedRole.nom}</h2>
                <p className="text-gray-600 mt-1">{selectedRole.description}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              {!selectedRole.is_system && (
                <button
                  onClick={() => setShowRoleEditor(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
                >
                  <Edit className="h-5 w-5" />
                  Modifier le Rôle
                </button>
              )}
              {!selectedRole.is_system && (
                <button
                  onClick={() => setShowPermissionsEditor(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
                >
                  <Settings className="h-5 w-5" />
                  Gérer les Permissions
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <Info className="h-6 w-6 text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">
              Voici tout ce que les utilisateurs avec le rôle "{selectedRole.nom}" peuvent faire :
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(getPermissionsByCategory()).map(([category, perms]) => (
                <div key={category} className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 capitalize text-lg">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {/* Permissions accordées */}
                    {perms.granted.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-900 border-2 border-green-200"
                      >
                        <Check className="h-5 w-5 text-green-600 font-bold" />
                        <span className="text-sm font-semibold">{perm.nom_affichage}</span>
                      </div>
                    ))}
                    {/* Permissions refusées */}
                    {perms.denied.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-red-50 text-red-900 border-2 border-red-200"
                      >
                        <X className="h-5 w-5 text-red-600 font-bold" />
                        <span className="text-sm font-semibold">{perm.nom_affichage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de gestion des permissions */}
      {/* Modal édition du rôle */}
      <RoleEditModal
        isOpen={showRoleEditor}
        onClose={() => setShowRoleEditor(false)}
        role={selectedRole}
        onSave={() => {
          setShowRoleEditor(false);
          handleRefresh();
          onRolesChange(); // Rafraîchir la liste des rôles
        }}
      />

      {/* Modal gestion des permissions */}
      <RolePermissionsEditor
        isOpen={showPermissionsEditor}
        onClose={() => setShowPermissionsEditor(false)}
        role={selectedRole}
        onSave={handleRefresh}
      />
    </div>
  );
}


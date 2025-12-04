"use client";

import { useState, useEffect } from "react";
import { X, Save, Shield, Check } from "lucide-react";

interface Permission {
  id: number;
  code: string;
  nom_affichage: string;
  categorie: string;
}

interface RoleData {
  id: number;
  code: string;
  nom: string;
  couleur: string | null;
  is_system: boolean;
}

interface RolePermissionsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleData | null;
  onSave: () => void;
}

export default function RolePermissionsEditor({
  isOpen,
  onClose,
  role,
  onSave,
}: RolePermissionsEditorProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && role) {
      fetchData();
    }
  }, [isOpen, role]);

  async function fetchData() {
    try {
      const token = sessionStorage.getItem("auth-token");
      
      // Charger toutes les permissions
      const permsRes = await fetch("/api/permissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const perms = await permsRes.json();
      setAllPermissions(perms);

      // Charger les permissions du rôle
      const rolePermsRes = await fetch(`/api/roles/${role!.id}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rolePerms = await rolePermsRes.json();
      
      // Vérifier que c'est un tableau
      if (Array.isArray(rolePerms)) {
        setRolePermissions(rolePerms.map((p: Permission) => p.id));
      } else {
        console.error("Format inattendu:", rolePerms);
        setRolePermissions([]);
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!role) return;
    
    try {
      const token = sessionStorage.getItem("auth-token");
      await fetch(`/api/roles/${role.id}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissionIds: rolePermissions }),
      });
      
      onSave();
      onClose();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    }
  }

  const togglePermission = (permId: number) => {
    setRolePermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    );
  };

  const permsByCategory = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.categorie]) acc[perm.categorie] = [];
    acc[perm.categorie].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border-2 border-gray-200">
        {/* Header */}
        <div
          className="sticky top-0 px-6 py-4 flex items-center justify-between border-b z-10"
          style={{
            background: `linear-gradient(135deg, ${role.couleur || "#6B7280"} 0%, ${role.couleur || "#6B7280"}dd 100%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">
                Gérer les Permissions
              </h2>
              <p className="text-white/80 text-sm">{role.nom}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(permsByCategory).map(([category, perms]) => (
                <div key={category} className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg capitalize">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          rolePermissions.includes(perm.id)
                            ? "bg-green-100 border-2 border-green-300"
                            : "bg-white border-2 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={rolePermissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {perm.nom_affichage}
                          </p>
                          <p className="text-xs text-gray-600">{perm.code}</p>
                        </div>
                        {rolePermissions.includes(perm.id) && (
                          <Check className="h-5 w-5 text-green-600" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {rolePermissions.length} permission(s) sélectionnée(s)
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="button-primary px-5 py-2.5 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


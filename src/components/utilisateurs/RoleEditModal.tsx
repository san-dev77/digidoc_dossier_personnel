"use client";

import { useState, useEffect } from "react";
import { X, Save, Shield } from "lucide-react";
import { Input } from "@/components/forms";

interface RoleData {
  id: number;
  code: string;
  nom: string;
  description: string | null;
  couleur: string | null;
  is_system: boolean;
}

interface RoleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleData | null;
  onSave: () => void;
}

export default function RoleEditModal({
  isOpen,
  onClose,
  role,
  onSave,
}: RoleEditModalProps) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [couleur, setCouleur] = useState("");

  useEffect(() => {
    if (role) {
      setNom(role.nom);
      setDescription(role.description || "");
      setCouleur(role.couleur || "#6B7280");
    }
  }, [role]);

  async function handleSave() {
    if (!role) return;

    try {
      const token = sessionStorage.getItem("auth-token");
      const response = await fetch(`/api/roles/${role.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nom, description, couleur }),
      });

      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    }
  }

  if (!isOpen || !role) return null;

  const couleurPresets = [
    "#EF4444", // Rouge
    "#F59E0B", // Orange
    "#10B981", // Vert
    "#3B82F6", // Bleu
    "#8B5CF6", // Violet
    "#EC4899", // Rose
    "#6B7280", // Gris
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border-2 border-gray-200">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{
            background: `linear-gradient(135deg, ${couleur} 0%, ${couleur}dd 100%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Modifier le Rôle</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nom du rôle
            </label>
            <Input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Chef de Service"
              fullWidth
              label=""
            />
            <p className="text-xs text-gray-500 mt-1">
              Le nom sera affiché partout dans l'application
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez les responsabilités de ce rôle..."
              rows={3}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Couleur du rôle
            </label>
            <div className="flex gap-3 flex-wrap">
              {couleurPresets.map((c) => (
                <button
                  key={c}
                  onClick={() => setCouleur(c)}
                  className={`w-12 h-12 rounded-lg transition-all ${
                    couleur === c
                      ? "ring-4 ring-blue-400 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Couleur affichée dans les badges et les interfaces
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
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
  );
}


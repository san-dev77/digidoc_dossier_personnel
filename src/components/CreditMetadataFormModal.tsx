"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Save, X, Database } from "lucide-react";
import { MetadataService } from "@/services/metadata";
import { CREDIT_METADATA_TYPES } from "@/utils/rubrique-utils";

interface CreditMetadataFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  sousDossierId: string;
  editData?: {
    id: number;
    nom_meta: string;
    type_meta: string;
    obligatoire?: boolean;
  } | null;
}

export default function CreditMetadataFormModal({
  isOpen,
  onClose,
  onSaved,
  sousDossierId,
  editData,
}: CreditMetadataFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom_meta: "",
    type_meta: "text",
    obligatoire: false,
  });

  // Reset form when editData or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nom_meta: editData?.nom_meta || "",
        type_meta: editData?.type_meta || "text",
        obligatoire: editData?.obligatoire || false,
      });
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editData?.id) {
        await MetadataService.updateMetadata(editData.id, formData);
      } else {
        const result = await MetadataService.createMetadata({
          sous_dossier_id: parseInt(sousDossierId),
          nom_meta: formData.nom_meta,
          type_meta: formData.type_meta,
          obligatoire: formData.obligatoire,
        });
        if (!result.success) {
          alert(`Erreur: ${result.message}`);
          return;
        }
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      {/* Modal content */}
      <div className="relative bg-white border border-primary-200 shadow-2xl rounded-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 rounded-xl">
              <Database className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-primary-800">
              {editData ? "Modifier la métadonnée" : "Nouvelle métadonnée"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost hover:bg-primary-100"
          >
            <X className="w-5 h-5 text-primary-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-primary-700">
                Nom de la métadonnée
              </span>
            </label>
            <input
              type="text"
              value={formData.nom_meta}
              onChange={(e) => setFormData({ ...formData, nom_meta: e.target.value })}
              className="input input-bordered border-primary-300 focus:border-primary-500 focus:ring-primary-500 w-full"
              placeholder="Ex: Montant du crédit"
              required
              autoFocus
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-primary-700">
                Type de données
              </span>
            </label>
            <select
              value={formData.type_meta}
              onChange={(e) => setFormData({ ...formData, type_meta: e.target.value })}
              className="select select-bordered border-primary-300 focus:border-primary-500 focus:ring-primary-500 w-full"
            >
              {CREDIT_METADATA_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Obligatoire */}
          <div className="p-4 bg-primary-50 border-2 border-primary-600 rounded-xl border border-primary-100">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-primary-800 block text-sm">
                  Champ obligatoire
                </span>
                <span className="text-xs text-primary-500">
                  {formData.obligatoire
                    ? "Ce champ sera requis lors de la saisie"
                    : "Ce champ sera optionnel lors de la saisie"}
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.obligatoire}
                onChange={(e) => setFormData({ ...formData, obligatoire: e.target.checked })}
                className="toggle bg-primary-600"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-primary-100">
            <button
              type="submit"
              className="button-primary gap-2 flex-1"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editData ? "Mettre à jour" : "Créer"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost gap-2 text-primary-600 hover:bg-primary-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}


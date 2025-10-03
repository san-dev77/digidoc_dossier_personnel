"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, Database } from "lucide-react";
import { MetadataService } from "@/services/metadata";
import {
  CREDIT_METADATA_TYPES,
  DEFAULT_CREDIT_METADATA,
} from "@/utils/rubrique-utils";

interface CreditMetadata {
  id?: number;
  nom_meta: string;
  type_meta: string;
  created_at?: string;
}

interface CreditMetadataManagerProps {
  sousDossierId: string;
  rubriqueId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditMetadataManager({
  sousDossierId,
  rubriqueId,
  isOpen,
  onClose,
}: CreditMetadataManagerProps) {
  const [metadata, setMetadata] = useState<CreditMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ nom_meta: "", type_meta: "text" });

  useEffect(() => {
    if (isOpen && sousDossierId) {
      loadMetadata();
    }
  }, [isOpen, sousDossierId]);

  const loadMetadata = async () => {
    setLoading(true);
    try {
      const response = await MetadataService.getMetadataBySousDossier(
        parseInt(sousDossierId)
      );
      if (response.success && response.data) {
        setMetadata(response.data as CreditMetadata[]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des métadonnées:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDefaultMetadata = async () => {
    setLoading(true);
    try {
      for (const meta of DEFAULT_CREDIT_METADATA) {
        await MetadataService.createMetadata({
          sous_dossier_id: parseInt(sousDossierId),
          nom_meta: meta.nom_meta,
          type_meta: meta.type_meta,
        });
      }
      await loadMetadata();
    } catch (error) {
      console.error(
        "Erreur lors de l'ajout des métadonnées par défaut:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        // Mise à jour
        await MetadataService.updateMetadata(editingId, formData);
      } else {
        // Création
        await MetadataService.createMetadata({
          sous_dossier_id: parseInt(sousDossierId),
          nom_meta: formData.nom_meta,
          type_meta: formData.type_meta,
        });
      }

      setFormData({ nom_meta: "", type_meta: "text" });
      setEditingId(null);
      setShowAddForm(false);
      await loadMetadata();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (meta: CreditMetadata) => {
    setFormData({ nom_meta: meta.nom_meta, type_meta: meta.type_meta });
    setEditingId(meta.id || null);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette métadonnée ?"))
      return;

    setLoading(true);
    try {
      await MetadataService.deleteMetadata(id);
      await loadMetadata();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeObj = CREDIT_METADATA_TYPES.find((t) => t.value === type);
    return typeObj?.label || type;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Métadonnées de Crédit</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              Ajouter une métadonnée
            </button>
            <button
              onClick={handleAddDefaultMetadata}
              className="btn btn-secondary btn-sm"
              disabled={loading}
            >
              <Database className="w-4 h-4" />
              Ajouter les métadonnées par défaut
            </button>
          </div>

          {/* Form */}
          {showAddForm && (
            <div className="card bg-gray-50 p-4 mb-6">
              <h3 className="font-semibold mb-4">
                {editingId ? "Modifier la métadonnée" : "Nouvelle métadonnée"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom de la métadonnée
                  </label>
                  <input
                    type="text"
                    value={formData.nom_meta}
                    onChange={(e) =>
                      setFormData({ ...formData, nom_meta: e.target.value })
                    }
                    className="input input-bordered w-full"
                    placeholder="Ex: Montant du crédit"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Type de métadonnée
                  </label>
                  <select
                    value={formData.type_meta}
                    onChange={(e) =>
                      setFormData({ ...formData, type_meta: e.target.value })
                    }
                    className="select select-bordered w-full"
                  >
                    {CREDIT_METADATA_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={loading}
                  >
                    <Save className="w-4 h-4" />
                    {editingId ? "Mettre à jour" : "Créer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingId(null);
                      setFormData({ nom_meta: "", type_meta: "text" });
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Metadata List */}
          {loading ? (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : metadata.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune métadonnée de crédit définie</p>
              <p className="text-sm">
                Ajoutez des métadonnées pour structurer les données de ce
                sous-dossier
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {metadata.map((meta) => (
                <div
                  key={meta.id}
                  className="card bg-white border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {meta.nom_meta}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-outline badge-sm">
                          {getTypeLabel(meta.type_meta)}
                        </span>
                        {meta.created_at && (
                          <span className="text-xs text-gray-500">
                            Créé le{" "}
                            {new Date(meta.created_at).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(meta)}
                        className="btn btn-ghost btn-sm"
                        disabled={loading}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => meta.id && handleDelete(meta.id)}
                        className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

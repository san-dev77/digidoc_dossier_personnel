"use client";

import { useState, useEffect, useCallback } from "react";
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
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditMetadataManager({
  sousDossierId,
  isOpen,
  onClose,
}: CreditMetadataManagerProps) {
  const [metadata, setMetadata] = useState<CreditMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ nom_meta: "", type_meta: "text" });

  const loadMetadata = useCallback(async () => {
    setLoading(true);
    try {
      const response = await MetadataService.getMetadataBySousDossier(
        parseInt(sousDossierId)
      );
      if (response.success && response.data) {
        setMetadata(response.data as unknown as CreditMetadata[]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des métadonnées:", error);
    } finally {
      setLoading(false);
    }
  }, [sousDossierId]);

  useEffect(() => {
    if (isOpen && sousDossierId) {
      loadMetadata();
    }
  }, [isOpen, sousDossierId, loadMetadata]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        // Mise à jour
        console.log("🔄 Mise à jour métadonnée:", editingId, formData);
        const result = await MetadataService.updateMetadata(
          editingId,
          formData
        );
        console.log("✅ Résultat mise à jour:", result);
      } else {
        // Création
        console.log(
          "🆕 Création métadonnée:",
          formData,
          "pour sous-dossier:",
          sousDossierId
        );
        const result = await MetadataService.createMetadata({
          sous_dossier_id: parseInt(sousDossierId),
          nom_meta: formData.nom_meta,
          type_meta: formData.type_meta,
        });
        console.log("✅ Résultat création:", result);

        if (!result.success) {
          console.error("❌ Erreur lors de la création:", result.message);
          alert(`Erreur: ${result.message}`);
          return;
        }
      }

      setFormData({ nom_meta: "", type_meta: "text" });
      setEditingId(null);
      setShowAddForm(false);
      await loadMetadata();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert(
        `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
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
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-6xl max-h-[95vh] overflow-hidden bg-neutral-50 border border-primary-200 hover-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Database className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary-800">
                Métadonnées de crédit
              </h3>
              <p className="text-primary-500 text-sm">
                Configurez les champs de données pour ce sous-dossier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost hover:bg-primary-100"
          >
            <X className="w-5 h-5 text-primary-600" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="button-primary btn-sm gap-2 text-primary-50"
            disabled={loading}
          >
            + Nouvelle métadonnée
          </button>
        </div>

        {/* Form */}
        {showAddForm && (
          <div className="card-elevated mb-6">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-200 rounded-lg">
                  <Save className="w-4 h-4 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary-800">
                  {editingId ? "Modifier la métadonnée" : "Nouvelle métadonnée"}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-primary-700">
                        Nom de la métadonnée
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.nom_meta}
                      onChange={(e) =>
                        setFormData({ ...formData, nom_meta: e.target.value })
                      }
                      className="input input-bordered border-primary-300 focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Ex: Montant du crédit"
                      required
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
                      onChange={(e) =>
                        setFormData({ ...formData, type_meta: e.target.value })
                      }
                      className="select select-bordered border-primary-300 focus:border-primary-500 focus:ring-primary-500"
                    >
                      {CREDIT_METADATA_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="submit"
                    className="button-primary btn-sm gap-2"
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
                    className="btn btn-ghost btn-sm gap-2 text-primary-600 hover:bg-primary-50"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Metadata List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <span className="loading loading-spinner loading-lg text-primary-600"></span>
              <p className="mt-4 text-primary-600 font-medium">
                Chargement des métadonnées...
              </p>
            </div>
          ) : metadata.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-primary-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Database className="w-8 h-8 text-primary-400" />
              </div>
              <h4 className="text-lg font-semibold text-primary-800 mb-2">
                Aucune métadonnée définie
              </h4>
              <p className="text-primary-500 mb-6">
                Commencez par ajouter des métadonnées pour structurer les
                données de ce sous-dossier
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="button-primary btn-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter une métadonnée
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-primary-800">
                  Métadonnées configurées ({metadata.length})
                </h4>
              </div>

              <div className="overflow-x-auto content-scrollbar">
                <table className="table table-zebra w-full">
                  <thead className="">
                    <tr className="bg-primary-50 border-b border-primary-600">
                      <th className="text-primary-700 font-semibold">#</th>
                      <th className="text-primary-700 font-semibold">
                        Nom de la métadonnée
                      </th>
                      <th className="text-primary-700 font-semibold">Type</th>
                      <th className="text-primary-700 font-semibold">
                        Date de création
                      </th>
                      <th className="text-primary-700 font-semibold text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {metadata.map((meta, index) => (
                      <tr
                        key={meta.id}
                        className="hover:bg-primary-25 border-b border-primary-600 bg-primary-100"
                      >
                        <td>
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-sm font-bold text-primary-600">
                            {index + 1}
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold text-primary-900">
                            {meta.nom_meta}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-outline bg-primary-50 text-primary-700 border-primary-300">
                            {getTypeLabel(meta.type_meta)}
                          </span>
                        </td>
                        <td>
                          {meta.created_at ? (
                            <span className="text-primary-600 text-sm">
                              {new Date(meta.created_at).toLocaleDateString(
                                "fr-FR"
                              )}
                            </span>
                          ) : (
                            <span className="text-primary-400 text-sm">-</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(meta)}
                              className="btn btn-ghost btn-sm hover:bg-primary-100"
                              disabled={loading}
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4 text-primary-600" />
                            </button>
                            <button
                              onClick={() => meta.id && handleDelete(meta.id)}
                              className="btn btn-ghost btn-sm hover:bg-accent-red-light"
                              disabled={loading}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4 text-accent-red" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, X, Database, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { MetadataService } from "@/services/metadata";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";
import { CREDIT_METADATA_TYPES } from "@/utils/rubrique-utils";
import CreditMetadataFormModal from "./CreditMetadataFormModal";

interface CreditMetadata {
  id?: number;
  nom_meta: string;
  type_meta: string;
  obligatoire?: boolean;
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
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMeta, setEditingMeta] = useState<CreditMetadata | null>(null);
  const [replicating, setReplicating] = useState(false);
  const [replicateMessage, setReplicateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleCreate = () => {
    setEditingMeta(null);
    setShowFormModal(true);
  };

  const handleEdit = (meta: CreditMetadata) => {
    setEditingMeta(meta);
    setShowFormModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette métadonnée ?")) return;
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

  const handleFormSaved = () => {
    loadMetadata();
  };

  const getTypeLabel = (type: string) => {
    const typeObj = CREDIT_METADATA_TYPES.find((t) => t.value === type);
    return typeObj?.label || type;
  };

  /**
   * Réplique la config metadata de ce sous-dossier vers tous les autres
   * sous-dossiers de crédit.
   */
  const handleReplicate = async () => {
    if (metadata.length === 0) {
      setReplicateMessage({ type: 'error', text: 'Aucune métadonnée à répliquer.' });
      return;
    }
    if (!confirm(
      `Voulez-vous appliquer ces ${metadata.length} métadonnée(s) à tous les autres sous-dossiers de crédit ?\n\nLes métadonnées déjà existantes sur les cibles ne seront pas dupliquées.`
    )) return;

    setReplicating(true);
    setReplicateMessage(null);
    try {
      const response = await fetchWithAuth('/api/metadata-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'replicate',
          sourceSousDossierId: sousDossierId,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setReplicateMessage({ type: 'success', text: result.message });
      } else {
        setReplicateMessage({ type: 'error', text: result.message || 'Erreur lors de la réplication.' });
      }
    } catch (error) {
      console.error('Erreur réplication:', error);
      setReplicateMessage({ type: 'error', text: 'Erreur réseau lors de la réplication.' });
    } finally {
      setReplicating(false);
      // Auto-dismiss après 5s
      setTimeout(() => setReplicateMessage(null), 5000);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal modal-open">
        <div className="modal-box w-11/12 max-w-6xl max-h-[95vh] overflow-hidden bg-neutral-50 border border-primary-200">
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
            <div className="flex items-center gap-3">
              {metadata.length > 0 && (
                <button
                  onClick={handleReplicate}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-bold border border-emerald-600 disabled:opacity-50"
                  disabled={loading || replicating}
                  title="Copier cette configuration vers tous les autres sous-dossiers de crédit"
                >
                  {replicating ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {replicating ? 'Réplication...' : 'Appliquer à tous'}
                </button>
              )}
              <button
                onClick={handleCreate}
                className="button-primary btn-sm gap-2 text-primary-50"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                Nouvelle métadonnée
              </button>
              <button
                onClick={onClose}
                className="btn btn-sm btn-circle btn-ghost hover:bg-primary-100"
              >
                <X className="w-5 h-5 text-primary-600" />
              </button>
            </div>
          </div>

          {/* Message de réplication */}
          {replicateMessage && (
            <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 border ${
              replicateMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {replicateMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p className="text-sm font-medium">{replicateMessage.text}</p>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="text-center py-12">
                <span className="loading loading-spinner loading-lg text-primary-600"></span>
                <p className="mt-4 text-primary-600 font-medium">
                  Chargement des métadonnées...
                </p>
              </div>
            ) : metadata.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-primary-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Database className="w-8 h-8 text-primary-400" />
                </div>
                <h4 className="text-lg font-semibold text-primary-800 mb-2">
                  Aucune métadonnée définie
                </h4>
                <p className="text-primary-500 mb-6">
                  Commencez par ajouter des métadonnées pour structurer les données de ce sous-dossier
                </p>
                <button
                  onClick={handleCreate}
                  className="button-primary btn-sm gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une métadonnée
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto content-scrollbar">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr className="bg-primary-50 border-b border-primary-600">
                      <th className="text-primary-700 font-semibold">#</th>
                      <th className="text-primary-700 font-semibold">Nom de la métadonnée</th>
                      <th className="text-primary-700 font-semibold">Type</th>
                      <th className="text-primary-700 font-semibold">Statut</th>
                      <th className="text-primary-700 font-semibold">Date de création</th>
                      <th className="text-primary-700 font-semibold text-center">Actions</th>
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
                          {meta.obligatoire ? (
                            <span className="badge badge-sm bg-red-100 text-red-700 border-red-300">
                              Obligatoire
                            </span>
                          ) : (
                            <span className="badge badge-sm bg-gray-100 text-gray-600 border-gray-300">
                              Optionnel
                            </span>
                          )}
                        </td>
                        <td>
                          {meta.created_at ? (
                            <span className="text-primary-600 text-sm">
                              {new Date(meta.created_at).toLocaleDateString("fr-FR")}
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
            )}
          </div>
        </div>
      </div>

      {/* Modale dédiée pour création/modification */}
      <CreditMetadataFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingMeta(null);
        }}
        onSaved={handleFormSaved}
        sousDossierId={sousDossierId}
        editData={editingMeta ? {
          id: editingMeta.id!,
          nom_meta: editingMeta.nom_meta,
          type_meta: editingMeta.type_meta,
          obligatoire: editingMeta.obligatoire,
        } : null}
      />
    </>
  );
}

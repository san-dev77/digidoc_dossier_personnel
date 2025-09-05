"use client";

import { useState } from "react";
import { X, FileText, AlertCircle, Plus, Trash2 } from "lucide-react";
import type { PieceFormData, MetadataModel } from "@/types";

interface PieceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: PieceFormData) => void;
  mode: "create" | "edit";
  piece?: PieceFormData;
}

export default function PieceForm({
  isOpen,
  onClose,
  onSubmit,
  mode,
  piece,
}: PieceFormProps) {
  const [formData, setFormData] = useState({
    nom: piece?.nom || "",
    description: piece?.description || "",
    has_meta: piece?.has_meta || false,
  });
  const [metadonnees, setMetadonnees] = useState<
    Omit<MetadataModel, "id" | "createdAt" | "updatedAt">[]
  >([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMetadata = () => {
    setMetadonnees([
      ...metadonnees,
      {
        nom: "",
        type: "text",
        obligatoire: false,
        description: "",
      },
    ]);
  };

  const updateMetadata = (
    index: number,
    field: keyof Omit<MetadataModel, "id" | "createdAt" | "updatedAt">,
    value: string | boolean
  ) => {
    const updated = [...metadonnees];
    updated[index] = { ...updated[index], [field]: value };
    setMetadonnees(updated);
  };

  const removeMetadata = (index: number) => {
    setMetadonnees(metadonnees.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom de la pièce est requis";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (mode === "create") {
        await onSubmit({
          nom: formData.nom,
          description: formData.description,
          has_meta: formData.has_meta,
          metadonnees: formData.has_meta ? metadonnees : undefined,
        });
      }
      onClose();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-accent-green/5 to-accent-green/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-green to-accent-green rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === "create" ? "Créer une Pièce" : "Modifier la Pièce"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {mode === "create"
                  ? "Définissez les informations de la pièce et ses métadonnées"
                  : "Modifiez les informations de la pièce"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom de la pièce */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom de la pièce *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, nom: e.target.value }));
                  setErrors((prev) => ({ ...prev, nom: "" }));
                }}
                className={`w-full text-black px-4 py-3 border rounded-xl focus:ring-2 focus:ring-accent-green focus:border-accent-green transition-all duration-200 hover:border-accent-green/50 ${
                  errors.nom
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 hover:shadow-sm"
                }`}
                placeholder="Ex: CNI, Passeport, Diplôme..."
              />
              {formData.nom && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            {errors.nom && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4" />
                {errors.nom}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full text-black px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-green focus:border-accent-green transition-all duration-200 hover:border-accent-green/50 hover:shadow-sm resize-none"
                rows={3}
                placeholder="Description du document..."
              />
              {formData.description && (
                <div className="absolute right-3 top-3">
                  <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>

          {/* Checkbox pour les métadonnées */}
          <div className="p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 transition-all duration-200 hover:shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.has_meta}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      has_meta: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 text-black bg-white border-gray-300 rounded focus:ring-accent-green focus:ring-2 transition-all duration-200"
                />
                {formData.has_meta && (
                  <div className="absolute inset-0 w-5 h-5 bg-accent-green rounded animate-in zoom-in-50 duration-200"></div>
                )}
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-accent-green transition-colors duration-200">
                Cette pièce a des métadonnées
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2 ml-8">
              Cochez cette case si vous souhaitez définir des métadonnées
              spécifiques pour cette pièce
            </p>
          </div>

          {/* Section de création des métadonnées */}
          {formData.has_meta && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Modèle de métadonnées
                </h3>
                <button
                  type="button"
                  onClick={addMetadata}
                  className="flex items-center gap-2 bg-accent-green hover:bg-accent-green text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un champ
                </button>
              </div>

              {metadonnees.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    Aucun champ de métadonnée défini
                  </p>
                  <p className="text-sm text-gray-500">
                    Cliquez sur &quot;Ajouter un champ&quot; pour créer votre
                    premier champ de métadonnée
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {metadonnees.map((meta, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">
                          Champ {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeMetadata(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nom du champ */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom du champ *
                          </label>
                          <input
                            type="text"
                            value={meta.nom}
                            onChange={(e) =>
                              updateMetadata(index, "nom", e.target.value)
                            }
                            className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-green focus:border-accent-green transition-all duration-200"
                            placeholder="Ex: Date d'émission"
                          />
                        </div>

                        {/* Type de champ */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type de champ
                          </label>
                          <select
                            value={meta.type}
                            onChange={(e) =>
                              updateMetadata(index, "type", e.target.value)
                            }
                            className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-green focus:border-accent-green transition-all duration-200"
                          >
                            <option value="text">Texte</option>
                            <option value="number">Nombre</option>
                            <option value="date">Date</option>
                            <option value="email">Email</option>
                            <option value="url">URL</option>
                          </select>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (optionnel)
                        </label>
                        <textarea
                          value={meta.description}
                          onChange={(e) =>
                            updateMetadata(index, "description", e.target.value)
                          }
                          className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-green focus:border-accent-green transition-all duration-200 resize-none"
                          rows={2}
                          placeholder="Description du champ..."
                        />
                      </div>

                      {/* Checkbox obligatoire */}
                      <div className="mt-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={meta.obligatoire}
                            onChange={(e) =>
                              updateMetadata(
                                index,
                                "obligatoire",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-black bg-white border-gray-300 rounded focus:ring-accent-green focus:ring-2"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Champ obligatoire
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50/50 to-transparent -mx-6 px-6 pb-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200 hover:scale-105"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="button-primary flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {mode === "create"
                      ? "Création en cours..."
                      : "Modification..."}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>
                    {mode === "create" ? "Créer la Pièce" : "Modifier"}
                  </span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, FileText, AlertCircle, Plus, Trash2 } from "lucide-react";
import type { PieceFormData, MetadataModel } from "@/types";
import { Input, SecureTextarea } from "@/components/forms";
import { useFormValidation } from "@/hooks/useFormValidation";
import { pieceFormSchema, type PieceFormData as PieceFormDataZod } from "@/lib/validation/schemas";

interface PieceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: PieceFormData) => void;
  mode: "create" | "edit";
  piece?: PieceFormData;
  rubriqueId?: string;
  sousDossierId?: string;
}

export default function PieceForm({
  isOpen,
  onClose,
  onSubmit,
  mode,
  piece,
  rubriqueId,
  sousDossierId,
}: PieceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // selectedFile supprimé - Pas de chargement au niveau des rubriques
  const [metadonnees, setMetadonnees] = useState<
    Omit<MetadataModel, "id" | "createdAt" | "updatedAt">[]
  >([]);

  const initialValues: PieceFormDataZod = {
    nom: "",
    description: "",
    has_meta: false,
    sous_dossier_id: sousDossierId || "",
  };

  const {
    values: formData,
    errors,
    setValue,
    setFieldTouched,
    validateForm,
    reset,
  } = useFormValidation(pieceFormSchema, initialValues);

  // Mettre à jour les données du formulaire quand la pièce change
  useEffect(() => {
    if (piece && mode === "edit") {
      console.log(
        "📝 Chargement des données de la pièce dans le formulaire:",
        piece
      );
      reset({
        nom: piece.nom || "",
        description: piece.description || "",
        has_meta: piece.has_meta || false,
        sous_dossier_id: sousDossierId || "",
      });
      setMetadonnees(piece.metadonnees || []);
    } else {
      // Réinitialiser pour le mode création
      reset({
        nom: "",
        description: "",
        has_meta: false,
        sous_dossier_id: sousDossierId || "",
      });
      setMetadonnees([]);
    }
  }, [piece, mode, isOpen, sousDossierId]);

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

  // handleFileSelect supprimé - Pas de chargement au niveau des rubriques

  // formatFileSize supprimé - Pas de chargement au niveau des rubriques

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("📤 Soumission du formulaire - Mode:", mode);
      console.log("📋 Données du formulaire:", formData);

      const submitData: PieceFormData = {
        nom: formData.nom,
        description: formData.description || "",
        has_meta: formData.has_meta,
        metadonnees: formData.has_meta ? metadonnees : undefined,
        rubriqueId: rubriqueId!,
      };

      await onSubmit(submitData);
      console.log("✅ Soumission réussie - Fermeture du formulaire");
      onClose();
    } catch (error) {
      console.error("❌ Erreur lors de la soumission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-400 bg-gradient-to-r from-accent-green/5 to-accent-green/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-300 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-black" />
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
          <Input
            label="Nom de la pièce"
            value={formData.nom}
            onChange={(e) => setValue("nom", e.target.value)}
            onBlur={() => setFieldTouched("nom")}
            error={errors.nom}
            required
            placeholder="Ex: CNI, Passeport, Diplôme..."
          />

          {/* Description */}
          <SecureTextarea
            label="Description (optionnel)"
            value={formData.description || ""}
            onChange={(value) => {
              setValue("description", value);
              setFieldTouched("description");
            }}
            error={errors.description}
            maxLength={1000}
            sanitize={true}
            rows={3}
            placeholder="Description du document..."
          />

          {/* Upload de fichier supprimé - Pas de chargement au niveau des rubriques */}

          {/* Checkbox pour les métadonnées */}
          <div className="p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 transition-all duration-200 hover:shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.has_meta}
                  onChange={(e) =>
                    setValue("has_meta", e.target.checked)
                  }
                  className="w-5 h-5 text-black bg-white border-gray-300 rounded focus:ring-accent-green focus:ring-2 transition-all duration-200"
                />
                {formData.has_meta && (
                  <div className="absolute inset-0 w-5 h-5 bg-accent-green rounded transform transition-all duration-200 ease-out scale-100"></div>
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
            <div className="space-y-6 transform transition-all duration-300 ease-out">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-accent-green rounded-full animate-pulse"></div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Modèle de métadonnées
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addMetadata}
                  className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 text-white" />
                  Ajouter un champ
                </button>
              </div>

              {metadonnees.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-semibold mb-2">
                    Aucun champ de métadonnée défini
                  </p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Cliquez sur &quot;Ajouter un champ&quot; pour créer votre
                    premier champ de métadonnée personnalisé
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metadonnees.map((meta, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-primary-200">
                              {index + 1}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-800">
                            Champ {index + 1}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMetadata(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nom du champ */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nom du champ *
                          </label>
                          <input
                            type="text"
                            value={meta.nom}
                            onChange={(e) =>
                              updateMetadata(index, "nom", e.target.value)
                            }
                            className="w-full text-black px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-green focus:border-accent-green transition-all duration-200 hover:border-accent-green/50"
                            placeholder="Ex: Date d'émission"
                          />
                        </div>

                        {/* Type de champ */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Type de champ
                          </label>
                          <select
                            value={meta.type}
                            onChange={(e) =>
                              updateMetadata(index, "type", e.target.value)
                            }
                            className="w-full text-black px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-green focus:border-accent-green transition-all duration-200 hover:border-accent-green/50"
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
                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description (optionnel)
                        </label>
                        <textarea
                          value={meta.description}
                          onChange={(e) =>
                            updateMetadata(index, "description", e.target.value)
                          }
                          className="w-full text-black px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-green focus:border-accent-green transition-all duration-200 resize-none hover:border-accent-green/50"
                          rows={2}
                          placeholder="Description du champ..."
                        />
                      </div>

                      {/* Checkbox obligatoire */}
                      <div className="mt-4">
                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
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
                            className="w-5 h-5 text-accent-green bg-white border-gray-300 rounded focus:ring-accent-green focus:ring-2 transition-all duration-200"
                          />
                          <span className="text-sm font-semibold text-gray-700">
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

          {/* Message d'erreur de soumission */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </p>
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

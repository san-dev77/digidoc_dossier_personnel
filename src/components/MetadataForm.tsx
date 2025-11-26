"use client";

import { useState } from "react";
import { X, Plus, Trash2, Save, Loader2 } from "lucide-react";
import type { MetadataModel } from "@/types";
import { Input, SecureTextarea, Select } from "@/components/forms";

interface MetadataFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    metadata: Omit<MetadataModel, "id" | "createdAt" | "updatedAt">[]
  ) => void;
  initialMetadata?: Omit<MetadataModel, "id" | "createdAt" | "updatedAt">[];
  pieceName?: string;
}

export default function MetadataForm({
  isOpen,
  onClose,
  onSubmit,
  initialMetadata = [],
  pieceName = "cette pièce",
}: MetadataFormProps) {
  const [metadata, setMetadata] = useState<
    Omit<MetadataModel, "id" | "createdAt" | "updatedAt">[]
  >(
    initialMetadata.length > 0
      ? initialMetadata
      : [
          {
            nom: "",
            type: "text" as const,
            obligatoire: false,
            description: "",
          },
        ]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMetadataField = () => {
    setMetadata([
      ...metadata,
      {
        nom: "",
        type: "text" as const,
        obligatoire: false,
        description: "",
      },
    ]);
  };

  const removeMetadataField = (index: number) => {
    if (metadata.length > 1) {
      setMetadata(metadata.filter((_, i) => i !== index));
    }
  };

  const updateMetadataField = (
    index: number,
    field: keyof Omit<MetadataModel, "id" | "createdAt" | "updatedAt">,
    value: string | boolean | string[]
  ) => {
    const updated = [...metadata];
    updated[index] = { ...updated[index], [field]: value };
    setMetadata(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filtrer les champs vides
    const validMetadata = metadata.filter((meta) => meta.nom.trim() !== "");

    if (validMetadata.length === 0) {
      alert("Veuillez ajouter au moins un champ de métadonnée.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(validMetadata);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] transition-400">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-500 bg-primary-100/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Gérer les métadonnées
              </h2>
              <p className="text-sm text-gray-600">
                Définir les champs personnalisés pour {pieceName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          <div className="space-y-6">
            {metadata.map((meta, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-primary-600/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Champ {index + 1}
                  </h3>
                  {metadata.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMetadataField(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nom du champ */}
                  <Input
                    label="Nom du champ"
                    type="text"
                    value={meta.nom}
                    onChange={(e) =>
                      updateMetadataField(index, "nom", e.target.value)
                    }
                    required
                    placeholder="Ex: Date de signature, Montant, etc."
                  />

                  {/* Type de champ */}
                  <Select
                    label="Type de champ"
                    value={meta.type}
                    onChange={(e) =>
                      updateMetadataField(index, "type", e.target.value)
                    }
                    required
                    options={[
                      { value: "text", label: "Texte" },
                      { value: "number", label: "Nombre" },
                      { value: "date", label: "Date" },
                      { value: "email", label: "Email" },
                      { value: "url", label: "URL" },
                    ]}
                  />

                  {/* Description */}
                  <div className="md:col-span-2">
                    <SecureTextarea
                      label="Description"
                      value={meta.description || ""}
                      onChange={(value) =>
                        updateMetadataField(index, "description", value)
                      }
                      maxLength={500}
                      sanitize={true}
                      rows={2}
                      placeholder="Description du champ (optionnel)"
                    />
                  </div>

                  {/* Options pour les listes déroulantes */}
                  {meta.type === "select" && (
                    <div className="md:col-span-2">
                      <Input
                        label="Options (séparées par des virgules)"
                        type="text"
                        value={meta.options?.join(", ") || ""}
                        onChange={(e) =>
                          updateMetadataField(
                            index,
                            "options",
                            e.target.value
                              .split(",")
                              .map((opt) => opt.trim())
                              .filter((opt) => opt !== "")
                          )
                        }
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}

                  {/* Champ obligatoire */}
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={meta.obligatoire}
                        onChange={(e) =>
                          updateMetadataField(
                            index,
                            "obligatoire",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-accent-blue focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Ce champ est obligatoire
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bouton d'ajout */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={addMetadataField}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              Ajouter un autre champ
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-500 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement en cours...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer les métadonnées
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

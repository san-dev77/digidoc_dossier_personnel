"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ButtonLoader } from "./Loader";
import { Rubrique, RubriqueFormData } from "@/types";

interface RubriqueFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RubriqueFormData) => void;
  rubrique?: Rubrique;
  mode: "create" | "edit";
}

export default function RubriqueForm({
  isOpen,
  onClose,
  onSubmit,
  rubrique,
  mode,
}: RubriqueFormProps) {
  const [formData, setFormData] = useState<RubriqueFormData>({
    nom: "",
    description: "",
  });

  const [errors, setErrors] = useState<Partial<RubriqueFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && rubrique) {
      setFormData({
        nom: rubrique.nom,
        description: rubrique.description,
      });
    } else {
      setFormData({
        nom: "",
        description: "",
      });
    }
    setErrors({});
  }, [mode, rubrique, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<RubriqueFormData> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    }
    if (!formData.description.trim()) {
      newErrors.description = "La description est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (field: keyof RubriqueFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === "create" ? "Nouvelle Rubrique" : "Modifier la Rubrique"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom de la rubrique *
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => handleChange("nom", e.target.value)}
              className={`w-full text-black px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.nom ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Ex: Documents administratifs"
            />
            {errors.nom && (
              <p className="text-red-600 text-sm mt-1">{errors.nom}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className={`w-full text-black px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none ${
                errors.description ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Décrivez le contenu de cette rubrique..."
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <ButtonLoader size="sm" />
                  {mode === "create" ? "Création..." : "Modification..."}
                </>
              ) : mode === "create" ? (
                "Créer"
              ) : (
                "Modifier"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

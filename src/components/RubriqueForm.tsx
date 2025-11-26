"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ButtonLoader } from "./Loader";
import { Rubrique, RubriqueFormData } from "@/types";
import { Input, SecureTextarea } from "@/components/forms";
import { useFormValidation } from "@/hooks/useFormValidation";
import {
  rubriqueFormSchema,
  type RubriqueFormData as RubriqueFormDataZod,
} from "@/lib/validation/schemas";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues: RubriqueFormDataZod = {
    nom: "",
    description: "",
  };

  const {
    values: formData,
    errors,
    setValue,
    setFieldTouched,
    validateForm,
    reset,
  } = useFormValidation(rubriqueFormSchema, initialValues);

  useEffect(() => {
    if (mode === "edit" && rubrique) {
      reset({
        nom: rubrique.nom,
        description: rubrique.description || "",
      });
    } else {
      reset(initialValues);
    }
  }, [mode, rubrique, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData as RubriqueFormData);
      } finally {
        setIsSubmitting(false);
      }
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
          <Input
            label="Nom de la rubrique"
            value={formData.nom}
            onChange={(e) => setValue("nom", e.target.value)}
            onBlur={() => setFieldTouched("nom")}
            error={errors.nom}
            required
            placeholder="Ex: Documents administratifs"
          />

          {/* Description */}
          <SecureTextarea
            label="Description"
            value={formData.description || ""}
            onChange={(value) => {
              setValue("description", value);
              setFieldTouched("description");
            }}
            error={errors.description}
            maxLength={1000}
            sanitize={true}
            rows={3}
            placeholder="Décrivez le contenu de cette rubrique..."
          />

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

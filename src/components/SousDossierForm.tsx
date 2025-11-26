"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ButtonLoader } from "./Loader";
import { Input, SecureTextarea } from "@/components/forms";
import { useFormValidation } from "@/hooks/useFormValidation";
import {
  sousDossierFormSchema,
  type SousDossierFormData as SousDossierFormDataZod,
} from "@/lib/validation/schemas";

interface SousDossierFormData {
  titre: string;
  description: string;
  rubrique_id: string;
}

interface SousDossierFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SousDossierFormData) => void;
  rubriqueId: string;
  mode: "create" | "edit";
  sousDossier?: {
    id: string;
    titre: string;
    description: string;
    rubrique_id: string;
    createdAt: string;
    updatedAt: string;
  };
}

export default function SousDossierForm({
  isOpen,
  onClose,
  onSubmit,
  rubriqueId,
  mode,
  sousDossier,
}: SousDossierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues: SousDossierFormDataZod = {
    titre: "",
    description: "",
    rubrique_id: rubriqueId,
  };

  const {
    values: formData,
    errors,
    setValue,
    setFieldTouched,
    validateForm,
    reset,
  } = useFormValidation(sousDossierFormSchema, initialValues);

  useEffect(() => {
    if (mode === "edit" && sousDossier) {
      reset({
        titre: sousDossier.titre || "",
        description: sousDossier.description || "",
        rubrique_id: rubriqueId,
      });
    } else {
      reset({
        titre: "",
        description: "",
        rubrique_id: rubriqueId,
      });
    }
  }, [mode, sousDossier, rubriqueId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData as SousDossierFormData);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === "create"
              ? "Nouveau Sous-dossier"
              : "Modifier le Sous-dossier"}
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
          {/* Titre */}
          <Input
            label="Titre du sous-dossier"
            value={formData.titre}
            onChange={(e) => setValue("titre", e.target.value)}
            onBlur={() => setFieldTouched("titre")}
            error={errors.titre}
            required
            placeholder="Ex: Documents administratifs 2024"
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
            placeholder="Décrivez le contenu de ce sous-dossier..."
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

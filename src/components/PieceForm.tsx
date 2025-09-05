"use client";

import { useState } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import { PieceFormData } from "@/services/pieces";

interface PieceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: PieceFormData) => void;
  mode: "create" | "edit";
  piece?: any;
  sousDossierId: string;
}

export default function PieceForm({
  isOpen,
  onClose,
  onSubmit,
  mode,
  piece,
  sousDossierId,
}: PieceFormProps) {
  const [formData, setFormData] = useState({
    nom: piece?.nom || "",
    description: piece?.description || "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom de la pièce est requis";
    }

    if (mode === "create" && !selectedFile) {
      newErrors.fichier = "Veuillez sélectionner un fichier";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (mode === "create" && selectedFile) {
        await onSubmit({
          nom: formData.nom,
          fichier: selectedFile,
          description: formData.description,
        });
      }
      onClose();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrors((prev) => ({ ...prev, fichier: "" }));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-green to-accent-green rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {mode === "create" ? "Ajouter une Pièce" : "Modifier la Pièce"}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === "create"
                  ? "Téléchargez un nouveau document"
                  : "Modifiez les informations de la pièce"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom de la pièce */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom de la pièce *
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, nom: e.target.value }));
                setErrors((prev) => ({ ...prev, nom: "" }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-accent-green focus:border-accent-green transition-all ${
                errors.nom ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Ex: CNI, Passeport, Diplôme..."
            />
            {errors.nom && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.nom}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-green focus:border-accent-green transition-all resize-none"
              rows={3}
              placeholder="Description du document..."
            />
          </div>

          {/* Upload de fichier */}
          {mode === "create" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fichier *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-accent-green transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-12 h-12 bg-accent-green-light rounded-xl flex items-center justify-center">
                    <Upload className="w-6 h-6 text-accent-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Cliquez pour sélectionner un fichier
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, JPG, PNG (max 10MB)
                    </p>
                  </div>
                </label>
              </div>

              {selectedFile && (
                <div className="mt-4 p-4 bg-accent-green-light rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-accent-green" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {errors.fichier && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fichier}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="button-primary flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === "create" ? "Ajout en cours..." : "Modification..."}
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  {mode === "create" ? "Ajouter la Pièce" : "Modifier"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

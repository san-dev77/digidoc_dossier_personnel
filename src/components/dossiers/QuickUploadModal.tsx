"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Database,
} from "lucide-react";
import type { PieceData } from "@/services/agent-data";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

interface MetadataModel {
  id: string;
  piece_id: string;
  libelle: string;
  type: string;
  obligatoire: boolean;
  description?: string;
  created_at: string;
}

interface QuickUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pieceData: PieceData | null;
  agentId: string;
  agentName: string;
  rubriqueId: string;
  rubriqueName: string;
  sousDossierId: string;
  sousDossierName: string;
  agentDossierId?: number;
  onUploadSuccess?: () => void;
}

export default function QuickUploadModal({
  isOpen,
  onClose,
  pieceData,
  agentName,
  rubriqueName,
  sousDossierName,
  agentDossierId,
  onUploadSuccess,
}: QuickUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [metadataModels, setMetadataModels] = useState<MetadataModel[]>([]);
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>(
    {}
  );
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les modèles de métadonnées pour la pièce
  useEffect(() => {
    if (pieceData?.piece.id) {
      setLoadingMetadata(true);
      fetchWithAuth(`/api/pieces/${pieceData.piece.id}/metadata-models`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setMetadataModels(data || []);
        })
        .catch((err) => {
          console.error("Erreur chargement métadonnées:", err);
          setMetadataModels([]);
        })
        .finally(() => {
          setLoadingMetadata(false);
        });
    }
  }, [pieceData?.piece.id]);

  if (!isOpen) return null;

  if (!pieceData) {
    console.error("QuickUploadModal: pieceData is null or undefined", {
      isOpen,
      pieceData,
    });
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setSuccess(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !pieceData) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (agentDossierId) {
        formData.append("agentDossierId", agentDossierId.toString());
      }

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Récupérer le token d'authentification
      const token =
        typeof window !== "undefined"
          ? sessionStorage.getItem("auth-token")
          : null;

      // Préparer les headers avec le token
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      // Ne pas définir Content-Type pour FormData, le navigateur le fait automatiquement

      const response = await fetch(`/api/pieces/${pieceData.piece.id}/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'upload");
      }

      await response.json();

      // Sauvegarder les métadonnées si elles existent
      if (metadataModels.length > 0 && agentDossierId) {
        for (const model of metadataModels) {
          const metadataKey = model.id;
          const metadataValue = metadataValues[metadataKey];

          if (metadataValue && metadataValue.trim() !== "") {
            try {
              const metadataResponse = await fetchWithAuth(
                `/api/pieces/${pieceData.piece.id}/metadata`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    meta_model_id: model.id,
                    valeur: metadataValue,
                    agent_dossier_id: agentDossierId,
                  }),
                }
              );

              if (metadataResponse.ok) {
                console.log(`Métadonnée ${model.libelle} sauvegardée`);
              }
            } catch (err) {
              console.error(`Erreur métadonnée ${model.libelle}:`, err);
            }
          }
        }
      }

      setSuccess(true);

      // Appeler le callback de succès immédiatement pour rafraîchir
      onUploadSuccess?.();

      // Attendre un peu pour montrer le succès avant de fermer
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error("Erreur upload:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setError(null);
      setSuccess(false);
      setUploadProgress(0);
      setMetadataValues({});
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/70 transition-all duration-300 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-200 bg-gradient-to-r from-primary-50/50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-900">
                Charger un fichier
              </h2>
              <p className="text-sm text-primary-600 mt-1">
                {pieceData.piece.nom}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Informations de contexte */}
          <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-200">
            <h3 className="text-sm font-semibold text-primary-800 mb-3">
              Contexte
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-primary-600 font-medium">Agent:</span>
                <p className="text-primary-900 font-semibold">{agentName}</p>
              </div>
              <div>
                <span className="text-primary-600 font-medium">Rubrique:</span>
                <p className="text-primary-900 font-semibold">{rubriqueName}</p>
              </div>
              <div>
                <span className="text-primary-600 font-medium">
                  Sous-dossier:
                </span>
                <p className="text-primary-900 font-semibold">
                  {sousDossierName}
                </p>
              </div>
              <div>
                <span className="text-primary-600 font-medium">Pièce:</span>
                <p className="text-primary-900 font-semibold">
                  {pieceData.piece.nom}
                </p>
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          {metadataModels.length > 0 && (
            <div className="mb-6 p-4 bg-primary-50 rounded-xl border-2 border-primary-200">
              <h3 className="text-sm font-bold text-primary-900 mb-3 border-b-2 border-primary-300 pb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Métadonnées ({metadataModels.length})
              </h3>
              {loadingMetadata ? (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600 mx-auto" />
                  <p className="text-sm text-primary-600 mt-2">
                    Chargement des métadonnées...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {metadataModels.map((model) => (
                    <div
                      key={model.id}
                      className="space-y-2 bg-white p-3 rounded-lg border-2 border-primary-200"
                    >
                      <label className="text-sm font-bold text-primary-900">
                        {model.libelle}
                        {model.obligatoire && (
                          <span className="text-red-600 ml-1 font-bold">*</span>
                        )}
                      </label>
                      {model.type === "text" && (
                        <input
                          type="text"
                          value={metadataValues[model.id] || ""}
                          onChange={(e) =>
                            setMetadataValues((prev) => ({
                              ...prev,
                              [model.id]: e.target.value,
                            }))
                          }
                          placeholder={`Saisir ${model.libelle.toLowerCase()}`}
                          className="w-full px-3 py-2.5 border-2 border-primary-400 bg-white rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-primary-900 font-medium shadow-sm"
                        />
                      )}
                      {model.type === "number" && (
                        <input
                          type="number"
                          value={metadataValues[model.id] || ""}
                          onChange={(e) =>
                            setMetadataValues((prev) => ({
                              ...prev,
                              [model.id]: e.target.value,
                            }))
                          }
                          placeholder={`Saisir ${model.libelle.toLowerCase()}`}
                          className="w-full px-3 py-2.5 border-2 border-primary-400 bg-white rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-primary-900 font-medium shadow-sm"
                        />
                      )}
                      {model.type === "date" && (
                        <input
                          type="date"
                          value={metadataValues[model.id] || ""}
                          onChange={(e) =>
                            setMetadataValues((prev) => ({
                              ...prev,
                              [model.id]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2.5 border-2 border-primary-400 bg-white text-primary-900 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 font-medium shadow-sm"
                        />
                      )}
                      {model.type === "boolean" && (
                        <select
                          value={metadataValues[model.id] || ""}
                          onChange={(e) =>
                            setMetadataValues((prev) => ({
                              ...prev,
                              [model.id]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2.5 border-2 border-primary-400 bg-white rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-primary-900 font-medium shadow-sm"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="true">Oui</option>
                          <option value="false">Non</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Zone de drop */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              selectedFile
                ? "border-success-400 bg-success-50"
                : "border-primary-300 bg-primary-50/50 hover:border-primary-400 hover:bg-primary-100/50"
            }`}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-success-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-success-700 mt-1">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="text-sm text-primary-600 hover:text-primary-800 underline"
                >
                  Changer de fichier
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary-200 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-primary-900">
                    Glissez-déposez un fichier ici
                  </p>
                  <p className="text-sm text-primary-600 mt-2">
                    ou cliquez pour sélectionner
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  Sélectionner un fichier
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Barre de progression */}
          {isUploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary-700">
                  Upload en cours...
                </span>
                <span className="text-sm font-semibold text-primary-900">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-primary-200 rounded-full h-2">
                <div
                  className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Messages d'erreur */}
          {error && (
            <div className="mt-4 p-4 bg-error-50 border border-error-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-error-900">Erreur</p>
                <p className="text-sm text-error-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Message de succès */}
          {success && (
            <div className="mt-4 p-4 bg-success-50 border border-success-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-success-900">
                  Fichier chargé avec succès!
                </p>
                <p className="text-sm text-success-700 mt-1">
                  Le fichier a été ajouté à la pièce.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-primary-200 bg-gradient-to-r from-primary-50/50 to-white">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-6 py-2 text-primary-600 hover:text-primary-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "Annulation..." : "Annuler"}
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || success}
            className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-to-r hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Charger
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

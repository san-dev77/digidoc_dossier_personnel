"use client";

import { useState, useEffect } from "react";
import {
  X,
  UploadCloud,
  CheckCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useDossiersStore } from "@/store/dossiersStore";
import { sousDossiersService } from "@/services/sous-dossiers";
import { piecesService } from "@/services/pieces";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";
import { DossiersOptimizedService } from "@/services/dossiers-optimized";
import type { Rubrique, Agent, Piece, MetadataModel } from "@/types";
import type { SousDossier } from "@/services/sous-dossiers";
import RubriqueSelector from "./QuickCreateDossierModal/RubriqueSelector";
import SousDossierSelector from "./QuickCreateDossierModal/SousDossierSelector";
import PieceSelector from "./QuickCreateDossierModal/PieceSelector";
import FilePreviewModal from "./QuickCreateDossierModal/FilePreviewModal";

interface QuickCreateDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
  onSuccess: () => void;
}

export default function QuickCreateDossierModal({
  isOpen,
  onClose,
  agent,
  onSuccess,
}: QuickCreateDossierModalProps) {
  const { rubriques } = useDossiersStore();
  const [step, setStep] = useState(1);
  const [selectedRubrique, setSelectedRubrique] = useState<Rubrique | null>(
    null
  );
  const [sousDossiers, setSousDossiers] = useState<SousDossier[]>([]);
  const [selectedSousDossier, setSelectedSousDossier] =
    useState<SousDossier | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPieces, setSelectedPieces] = useState<Set<string>>(new Set());
  const [piecesWithFiles, setPiecesWithFiles] = useState<Map<string, File[]>>(
    new Map()
  );
  const [previewFile, setPreviewFile] = useState<{
    file: File;
    pieceId: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingSousDossiers, setLoadingSousDossiers] = useState(false);
  const [loadingPieces, setLoadingPieces] = useState(false);
  const [searchSousDossier, setSearchSousDossier] = useState("");
  const [searchPiece, setSearchPiece] = useState("");
  const [piecesMetadataModels, setPiecesMetadataModels] = useState<
    Map<string, MetadataModel[]>
  >(new Map());
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>(
    {}
  );

  // Charger les sous-dossiers quand une rubrique est sélectionnée
  useEffect(() => {
    if (selectedRubrique) {
      setLoadingSousDossiers(true);
      const loadSousDossiers = async () => {
        try {
          const data = await sousDossiersService.getAllSousDossiersByRubrique(
            selectedRubrique.id
          );
          setSousDossiers(data);
        } catch (error) {
          console.error("Erreur chargement sous-dossiers:", error);
          setSousDossiers([]);
        } finally {
          setLoadingSousDossiers(false);
        }
      };
      loadSousDossiers();
    } else {
      setSousDossiers([]);
      setSelectedSousDossier(null);
      setPieces([]);
      setSelectedPieces(new Set());
    }
  }, [selectedRubrique]);

  // Charger les pièces quand un sous-dossier est sélectionné
  useEffect(() => {
    if (selectedSousDossier) {
      setLoadingPieces(true);
      const loadPieces = async () => {
        try {
          const data = await piecesService.getAllPiecesBySousDossier(
            selectedSousDossier.id
          );
          setPieces(data);

          // Charger les métadonnées pour chaque pièce
          const metadataMap = new Map<string, MetadataModel[]>();
          await Promise.all(
            data.map(async (piece) => {
              try {
                const res = await fetchWithAuth(
                  `/api/pieces/${piece.id}/metadata-models`
                );
                if (res.ok) {
                  const models = await res.json();
                  metadataMap.set(piece.id, models || []);
                }
              } catch (err) {
                console.error(
                  `Erreur chargement métadonnées pour ${piece.id}:`,
                  err
                );
              }
            })
          );
          setPiecesMetadataModels(metadataMap);
        } catch (error) {
          console.error("Erreur chargement pièces:", error);
          setPieces([]);
        } finally {
          setLoadingPieces(false);
        }
      };
      loadPieces();
    } else {
      setPieces([]);
      setSelectedPieces(new Set());
      setPiecesMetadataModels(new Map());
    }
  }, [selectedSousDossier]);

  const handleClose = () => {
    setStep(1);
    setSelectedRubrique(null);
    setSousDossiers([]);
    setSelectedSousDossier(null);
    setPieces([]);
    setSelectedPieces(new Set());
    setPiecesWithFiles(new Map());
    setPreviewFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    setSearchSousDossier("");
    setSearchPiece("");
    setPiecesMetadataModels(new Map());
    setMetadataValues({});
    onClose();
  };

  const handleNextStep = () => {
    if (step === 1 && selectedRubrique) {
      setStep(2);
    } else if (step === 2 && selectedSousDossier) {
      setStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const togglePieceSelection = (pieceId: string) => {
    setSelectedPieces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pieceId)) {
        newSet.delete(pieceId);
        setPiecesWithFiles((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.delete(pieceId);
          return newMap;
        });
      } else {
        newSet.add(pieceId);
      }
      return newSet;
    });
  };

  const handleFileChange = (pieceId: string, files: FileList | null) => {
    if (files && files.length > 0) {
      setPiecesWithFiles((prev) => {
        const newMap = new Map(prev);
        const existingFiles = newMap.get(pieceId) || [];
        newMap.set(pieceId, [...existingFiles, ...Array.from(files)]);
        return newMap;
      });
      // S'assurer que la pièce est sélectionnée si elle ne l'est pas déjà
      setSelectedPieces((prev) => {
        const newSet = new Set(prev);
        if (!newSet.has(pieceId)) {
          newSet.add(pieceId);
        }
        return newSet;
      });
    }
  };

  const handleDrop = (pieceId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(pieceId, files);
      // S'assurer que la pièce est sélectionnée
      setSelectedPieces((prev) => {
        const newSet = new Set(prev);
        if (!newSet.has(pieceId)) {
          newSet.add(pieceId);
        }
        return newSet;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (pieceId: string, fileIndex: number) => {
    setPiecesWithFiles((prev) => {
      const newMap = new Map(prev);
      const currentFiles = newMap.get(pieceId) || [];
      newMap.set(
        pieceId,
        currentFiles.filter((_, i) => i !== fileIndex)
      );
      return newMap;
    });
  };

  const openPreview = (file: File, pieceId: string) => {
    setPreviewFile({ file, pieceId });
  };

  const closePreview = () => {
    if (previewFile?.file) {
      URL.revokeObjectURL(URL.createObjectURL(previewFile.file));
    }
    setPreviewFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleUpload = async () => {
    if (
      !selectedRubrique ||
      !selectedSousDossier ||
      selectedPieces.size === 0
    ) {
      setError(
        "Veuillez sélectionner une rubrique, un sous-dossier et au moins une pièce."
      );
      return;
    }

    // Vérifier que chaque pièce sélectionnée a au moins un fichier
    for (const pieceId of selectedPieces) {
      if (
        !piecesWithFiles.has(pieceId) ||
        piecesWithFiles.get(pieceId)!.length === 0
      ) {
        setError(
          `Veuillez sélectionner au moins un fichier pour chaque pièce.`
        );
        return;
      }
    }

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      // 1. Créer l'agent_dossier si nécessaire
      let agentDossierId: number | null = null;

      // Vérifier si l'agent_dossier existe déjà
      const existingResponse = await fetchWithAuth(
        `/api/agent-dossiers?sousDossierId=${selectedSousDossier.id}`
      );
      if (existingResponse.ok) {
        const existing = await existingResponse.json();
        const existingForAgent = existing.find(
          (ad: { agent_id: number; id: number }) =>
            ad.agent_id === parseInt(agent.id)
        );
        if (existingForAgent) {
          agentDossierId = existingForAgent.id;
        }
      }

      // Créer l'agent_dossier s'il n'existe pas
      if (!agentDossierId) {
        const createResponse = await fetchWithAuth("/api/agent-dossiers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: parseInt(agent.id),
            rubrique_id: parseInt(selectedRubrique.id),
            sous_dossier_id: parseInt(selectedSousDossier.id),
          }),
        });

        if (!createResponse.ok) {
          throw new Error("Erreur lors de la création de l'agent_dossier");
        }

        const created = await createResponse.json();
        agentDossierId = created.id;
      }

      // 2. Uploader les fichiers pour chaque pièce
      const totalFiles = Array.from(selectedPieces).reduce(
        (sum, pieceId) => sum + (piecesWithFiles.get(pieceId)?.length || 0),
        0
      );
      let uploadedFiles = 0;

      for (const pieceId of selectedPieces) {
        const files = piecesWithFiles.get(pieceId) || [];
        const piece = pieces.find((p) => p.id === pieceId);

        if (!piece) continue;

        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("rubriqueId", selectedRubrique.id);
          formData.append("sousDossierId", selectedSousDossier.id);
          formData.append("agentId", agent.id);
          formData.append("nom", piece.nom);
          formData.append("fileName", file.name);
          formData.append("description", `Fichier uploadé: ${file.name}`);

          const uploadResponse = await fetchWithAuth("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(
              errorData.error || `Erreur lors de l'upload de ${file.name}`
            );
          }

          const uploadResult = await uploadResponse.json();

          // Lier le fichier à la pièce
          const linkResponse = await fetchWithAuth(
            `/api/pieces/${pieceId}/files`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file_path: uploadResult.data.filePath,
                agent_dossier_id: agentDossierId,
              }),
            }
          );

          if (!linkResponse.ok) {
            throw new Error(
              `Erreur lors de la liaison du fichier ${file.name}`
            );
          }

          // Sauvegarder les métadonnées pour cette pièce si elles existent
          const metadataModels = piecesMetadataModels.get(pieceId) || [];
          if (metadataModels.length > 0 && agentDossierId) {
            for (const model of metadataModels) {
              const metadataKey = `${pieceId}_${model.id}`;
              const metadataValue = metadataValues[metadataKey];

              if (metadataValue && metadataValue.trim() !== "") {
                try {
                  const metadataResponse = await fetchWithAuth(
                    `/api/pieces/${pieceId}/metadata`,
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
                    console.log(
                      `Métadonnée ${model.libelle} sauvegardée pour ${piece.nom}`
                    );
                  }
                } catch (err) {
                  console.error(`Erreur métadonnée ${model.libelle}:`, err);
                }
              }
            }
          }

          uploadedFiles++;
          setUploadProgress(Math.round((uploadedFiles / totalFiles) * 100));
        }
      }

      setSuccess(true);
      setUploadProgress(100);

      // Recharger les dossiers
      await DossiersOptimizedService.loadDossiers(true);

      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Échec de l'upload des fichiers.";
      console.error("Erreur upload:", err);
      setError(errorMessage);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 transition-all duration-300 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="relative bg-primary-50 p-8 border-b-2 border-primary-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <UploadCloud className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary-900 mb-1">
                    Créer un dossier pour {agent.prenom} {agent.nom}
                  </h2>
                  <p className="text-primary-700 font-medium">
                    Étape {step}/3 -{" "}
                    {step === 1
                      ? "Sélection de la rubrique"
                      : step === 2
                      ? "Sélection du sous-dossier"
                      : "Gestion des pièces et fichiers"}
                  </p>
                  <div className="mt-3 w-64 bg-primary-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(step / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-primary-700 hover:text-primary-900 hover:bg-primary-200 rounded-lg transition-colors border-2 border-primary-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto flex-1">
            {/* Étape 1: Sélection Rubrique */}
            {step === 1 && (
              <RubriqueSelector
                rubriques={rubriques}
                selectedRubrique={selectedRubrique}
                onSelect={(rubrique) => {
                  setSelectedRubrique(rubrique);
                  setSelectedSousDossier(null);
                  setPieces([]);
                  setSelectedPieces(new Set());
                  setPiecesWithFiles(new Map());
                }}
              />
            )}

            {/* Étape 2: Sélection Sous-dossier */}
            {step === 2 && (
              <SousDossierSelector
                sousDossiers={sousDossiers}
                selectedSousDossier={selectedSousDossier}
                loading={loadingSousDossiers}
                searchTerm={searchSousDossier}
                onSearchChange={setSearchSousDossier}
                onSelect={(sousDossier) => {
                  setSelectedSousDossier(sousDossier);
                  setPieces([]);
                  setSelectedPieces(new Set());
                  setPiecesWithFiles(new Map());
                }}
              />
            )}

            {/* Étape 3: Sélection Pièces et Upload */}
            {step === 3 && (
              <PieceSelector
                pieces={pieces}
                selectedPieces={selectedPieces}
                piecesWithFiles={piecesWithFiles}
                loading={loadingPieces}
                searchTerm={searchPiece}
                onSearchChange={setSearchPiece}
                onToggleSelection={togglePieceSelection}
                onFileChange={handleFileChange}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onRemoveFile={removeFile}
                onPreviewFile={openPreview}
                formatFileSize={formatFileSize}
                piecesMetadataModels={piecesMetadataModels}
                metadataValues={metadataValues}
                onMetadataChange={(pieceId, modelId, value) => {
                  setMetadataValues((prev) => ({
                    ...prev,
                    [`${pieceId}_${modelId}`]: value,
                  }));
                }}
              />
            )}

            {isUploading && (
              <div className="mt-6">
                <div className="w-full bg-primary-200 rounded-full h-3">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-primary-600 mt-2">
                  Chargement: {uploadProgress}%
                </p>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-error-50 text-error-700 border border-error-200 rounded-xl">
                <p className="font-medium">Erreur: {error}</p>
              </div>
            )}

            {success && (
              <div className="mt-6 p-4 bg-success-50 text-success-700 border border-success-200 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5" />
                <p className="font-medium">Fichiers uploadés avec succès !</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t-2 border-primary-300 bg-primary-100">
            <button
              onClick={handlePreviousStep}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 text-primary-900 bg-white border-2 border-primary-400 rounded-xl hover:bg-primary-50 hover:border-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              Précédent
            </button>

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                disabled={
                  (step === 1 && !selectedRubrique) ||
                  (step === 2 && !selectedSousDossier)
                }
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-semibold border-2 border-primary-700"
              >
                Suivant
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleUpload}
                disabled={
                  selectedPieces.size === 0 ||
                  isUploading ||
                  success ||
                  Array.from(selectedPieces).some((pieceId) => {
                    const files = piecesWithFiles.get(pieceId);
                    return !files || files.length === 0;
                  })
                }
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 font-semibold border-2 border-primary-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Chargement...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    <span>Créer et charger les fichiers</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de prévisualisation */}
      <FilePreviewModal
        file={previewFile?.file || null}
        onClose={closePreview}
      />
    </>
  );
}

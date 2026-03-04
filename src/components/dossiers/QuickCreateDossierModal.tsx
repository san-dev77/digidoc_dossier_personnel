"use client";

import { useState, useEffect } from "react";
import {
  X,
  UploadCloud,
  CheckCircle,
  Loader2,
  ChevronRight,
  CreditCard,
  Database,
  FileText,
  Trash2,
  Plus,
} from "lucide-react";
import { useDossiersStore } from "@/store/dossiersStore";
import { sousDossiersService } from "@/services/sous-dossiers";
import { piecesService } from "@/services/pieces";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";
import { DossiersOptimizedService } from "@/services/dossiers-optimized";
import type { Rubrique, Agent, Piece, MetadataModel } from "@/types";
import type { SousDossier } from "@/services/sous-dossiers";
import { isDossierCredit } from "@/utils/rubrique-utils";
import RubriqueSelector from "./QuickCreateDossierModal/RubriqueSelector";
import SousDossierSelector from "./QuickCreateDossierModal/SousDossierSelector";
import PieceSelector from "./QuickCreateDossierModal/PieceSelector";
import FilePreviewModal from "./QuickCreateDossierModal/FilePreviewModal";

interface CreditMetadata {
  id: number;
  nom_meta: string;
  type_meta: string;
  is_required?: boolean;
}

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
  const [selectedRubrique, setSelectedRubrique] = useState<Rubrique | null>(null);
  const [sousDossiers, setSousDossiers] = useState<SousDossier[]>([]);
  const [selectedSousDossier, setSelectedSousDossier] = useState<SousDossier | null>(null);

  // Personal dossier state
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPieces, setSelectedPieces] = useState<Set<string>>(new Set());
  const [piecesWithFiles, setPiecesWithFiles] = useState<Map<string, File[]>>(new Map());
  const [previewFile, setPreviewFile] = useState<{ file: File; pieceId: string } | null>(null);
  const [piecesMetadataModels, setPiecesMetadataModels] = useState<Map<string, MetadataModel[]>>(new Map());
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>({});

  // Credit dossier state
  const [creditMetadata, setCreditMetadata] = useState<CreditMetadata[]>([]);
  const [creditValues, setCreditValues] = useState<Record<string, string>>({});
  const [creditFiles, setCreditFiles] = useState<File[]>([]);

  // Common state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingSousDossiers, setLoadingSousDossiers] = useState(false);
  const [loadingPieces, setLoadingPieces] = useState(false);
  const [searchSousDossier, setSearchSousDossier] = useState("");
  const [searchPiece, setSearchPiece] = useState("");

  // Credit detection
  const isCredit = selectedRubrique ? isDossierCredit(selectedRubrique) : false;

  // Load sous-dossiers when rubrique selected
  useEffect(() => {
    if (selectedRubrique) {
      setLoadingSousDossiers(true);
      const loadSousDossiers = async () => {
        try {
          const data = await sousDossiersService.getAllSousDossiersByRubrique(selectedRubrique.id);
          setSousDossiers(data);
        } catch (err) {
          console.error("Erreur chargement sous-dossiers:", err);
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

  // Load pieces when sous-dossier selected (personal dossier)
  useEffect(() => {
    if (selectedSousDossier && !isCredit) {
      setLoadingPieces(true);
      const loadPieces = async () => {
        try {
          const data = await piecesService.getAllPiecesBySousDossier(selectedSousDossier.id);
          setPieces(data);
          const metadataMap = new Map<string, MetadataModel[]>();
          await Promise.all(
            data.map(async (piece) => {
              try {
                const res = await fetchWithAuth(`/api/pieces/${piece.id}/metadata-models`);
                if (res.ok) {
                  const models = await res.json();
                  metadataMap.set(piece.id, models || []);
                }
              } catch (err) {
                console.error(`Erreur métadonnées pour ${piece.id}:`, err);
              }
            })
          );
          setPiecesMetadataModels(metadataMap);
        } catch (err) {
          console.error("Erreur chargement pièces:", err);
          setPieces([]);
        } finally {
          setLoadingPieces(false);
        }
      };
      loadPieces();
    }
  }, [selectedSousDossier, isCredit]);

  // Load credit metadata when sous-dossier selected (credit dossier)
  useEffect(() => {
    if (selectedSousDossier && isCredit) {
      setLoadingPieces(true);
      const loadCreditMeta = async () => {
        try {
          const response = await fetchWithAuth(
            `/api/metadata-credit?action=by-sous-dossier&sous_dossier_id=${selectedSousDossier.id}`
          );
          if (response.ok) {
            const data = await response.json();
            setCreditMetadata(data.data || []);
            const valuesMap: Record<string, string> = {};
            (data.data || []).forEach((m: CreditMetadata) => { valuesMap[m.id] = ""; });
            setCreditValues(valuesMap);
          }
        } catch (err) {
          console.error("Erreur chargement métadonnées crédit:", err);
        } finally {
          setLoadingPieces(false);
        }
      };
      loadCreditMeta();
    }
  }, [selectedSousDossier, isCredit]);

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
    setCreditMetadata([]);
    setCreditValues({});
    setCreditFiles([]);
    onClose();
  };

  const handleNextStep = () => {
    if (step === 1 && selectedRubrique) setStep(2);
    else if (step === 2 && selectedSousDossier) setStep(3);
  };

  const handlePreviousStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // === Personal dossier handlers ===
  const togglePieceSelection = (pieceId: string) => {
    setSelectedPieces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pieceId)) {
        newSet.delete(pieceId);
        setPiecesWithFiles((prevMap) => { const newMap = new Map(prevMap); newMap.delete(pieceId); return newMap; });
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
        const existing = newMap.get(pieceId) || [];
        newMap.set(pieceId, [...existing, ...Array.from(files)]);
        return newMap;
      });
      setSelectedPieces((prev) => { const newSet = new Set(prev); newSet.add(pieceId); return newSet; });
    }
  };

  const handleDrop = (pieceId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(pieceId, files);
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
      newMap.set(pieceId, currentFiles.filter((_, i) => i !== fileIndex));
      return newMap;
    });
  };

  const openPreview = (file: File, pieceId: string) => {
    setPreviewFile({ file, pieceId });
  };

  const closePreview = () => {
    if (previewFile?.file) URL.revokeObjectURL(URL.createObjectURL(previewFile.file));
    setPreviewFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // === Credit dossier upload ===
  const handleCreditUpload = async () => {
    if (!selectedRubrique || !selectedSousDossier) return;

    if (creditFiles.length === 0) {
      setError("Vous devez ajouter au moins un fichier.");
      return;
    }

    const confirmed = confirm(
      `Créer ce dossier de crédit ?\n\n` +
      `• ${creditFiles.length} fichier(s)\n` +
      `• ${Object.values(creditValues).filter((v) => v && v.trim()).length} métadonnée(s)\n\n` +
      `Cette action est irréversible.`
    );
    if (!confirmed) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("agentId", String(agent.id));
      formData.append("rubriqueId", String(selectedRubrique.id));
      formData.append("sousDossierId", String(selectedSousDossier.id));
      formData.append("metadataValues", JSON.stringify(creditValues));
      creditFiles.forEach((file) => formData.append("files", file));

      setUploadProgress(40);
      const response = await fetchWithAuth("/api/credit-upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);
      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setUploadProgress(100);
        await DossiersOptimizedService.loadDossiers(true);
        setTimeout(() => { onSuccess?.(); handleClose(); }, 1500);
      } else {
        setError(result.message || "Erreur lors de la création");
        setIsUploading(false);
      }
    } catch (err) {
      console.error("Erreur upload crédit:", err);
      setError("Erreur lors de la création du dossier de crédit");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // === Personal dossier upload ===
  const handleUpload = async () => {
    if (!selectedRubrique || !selectedSousDossier || selectedPieces.size === 0) {
      setError("Veuillez sélectionner une rubrique, un sous-dossier et au moins une pièce.");
      return;
    }

    for (const pieceId of selectedPieces) {
      if (!piecesWithFiles.has(pieceId) || piecesWithFiles.get(pieceId)!.length === 0) {
        setError("Veuillez sélectionner au moins un fichier pour chaque pièce.");
        return;
      }
    }

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      let agentDossierId: number | null = null;
      const existingResponse = await fetchWithAuth(`/api/agent-dossiers?sousDossierId=${selectedSousDossier.id}`);
      if (existingResponse.ok) {
        const existing = await existingResponse.json();
        const existingForAgent = existing.find((ad: { agent_id: number; id: number }) => ad.agent_id === parseInt(agent.id));
        if (existingForAgent) agentDossierId = existingForAgent.id;
      }

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
        if (!createResponse.ok) throw new Error("Erreur lors de la création de l'agent_dossier");
        const created = await createResponse.json();
        agentDossierId = created.id;
      }

      const totalFiles = Array.from(selectedPieces).reduce((sum, pieceId) => sum + (piecesWithFiles.get(pieceId)?.length || 0), 0);
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

          const uploadResponse = await fetchWithAuth("/api/upload", { method: "POST", body: formData });
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || `Erreur lors de l'upload de ${file.name}`);
          }
          const uploadResult = await uploadResponse.json();

          const linkResponse = await fetchWithAuth(`/api/pieces/${pieceId}/files`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_path: uploadResult.data.filePath, agent_dossier_id: agentDossierId }),
          });
          if (!linkResponse.ok) throw new Error(`Erreur lors de la liaison du fichier ${file.name}`);

          const metadataModels = piecesMetadataModels.get(pieceId) || [];
          if (metadataModels.length > 0 && agentDossierId) {
            for (const model of metadataModels) {
              const metadataKey = `${pieceId}_${model.id}`;
              const metadataValue = metadataValues[metadataKey];
              if (metadataValue && metadataValue.trim() !== "") {
                try {
                  await fetchWithAuth(`/api/pieces/${pieceId}/metadata`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ meta_model_id: model.id, valeur: metadataValue, agent_dossier_id: agentDossierId }),
                  });
                } catch (err) { console.error(`Erreur métadonnée ${model.libelle}:`, err); }
              }
            }
          }

          uploadedFiles++;
          setUploadProgress(Math.round((uploadedFiles / totalFiles) * 100));
        }
      }

      setSuccess(true);
      setUploadProgress(100);
      await DossiersOptimizedService.loadDossiers(true);
      setTimeout(() => { onSuccess?.(); handleClose(); }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Échec de l'upload des fichiers.";
      console.error("Erreur upload:", err);
      setError(errorMessage);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  const stepLabel = step === 1 ? "Rubrique" : step === 2 ? "Sous-dossier" : isCredit ? "Dossier de crédit" : "Pièces & fichiers";
  const totalSteps = 3;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center">
                  {isCredit && step === 3
                    ? <CreditCard className="w-5 h-5 text-white" />
                    : <UploadCloud className="w-5 h-5 text-white" />
                  }
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Créer pour {agent.prenom} {agent.nom}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Étape {step}/{totalSteps} — {stepLabel}
                  </p>
                  <div className="mt-2 w-48 bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(step / totalSteps) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Step 1: Rubrique */}
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
                  setCreditMetadata([]);
                  setCreditValues({});
                  setCreditFiles([]);
                }}
              />
            )}

            {/* Step 2: Sous-dossier */}
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

            {/* Step 3: Pieces (personal) OR Credit flow */}
            {step === 3 && !isCredit && (
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
                  setMetadataValues((prev) => ({ ...prev, [`${pieceId}_${modelId}`]: value }));
                }}
              />
            )}

            {/* Step 3: Credit flow */}
            {step === 3 && isCredit && (
              <div className="space-y-6">
                {loadingPieces ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                    <span className="ml-3 text-sm text-slate-500">Chargement des métadonnées...</span>
                  </div>
                ) : (
                  <>
                    {/* Credit info banner */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <CreditCard className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">Dossier de crédit</p>
                        <p className="text-xs text-emerald-600">Sous-dossier : <strong>{selectedSousDossier?.titre}</strong></p>
                      </div>
                    </div>

                    {/* Credit metadata fields */}
                    {creditMetadata.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                          <Database className="w-4 h-4 text-primary-600" />
                          Métadonnées du crédit
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {creditMetadata.map((meta) => (
                            <div key={meta.id}>
                              <label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                {meta.nom_meta}
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{meta.type_meta}</span>
                                {meta.is_required && <span className="text-red-500">*</span>}
                              </label>
                              <input
                                type={meta.type_meta === "date" ? "date" : meta.type_meta === "number" || meta.type_meta === "currency" || meta.type_meta === "percentage" ? "number" : "text"}
                                value={creditValues[meta.id] || ""}
                                onChange={(e) => setCreditValues({ ...creditValues, [meta.id]: e.target.value })}
                                placeholder={`Saisir ${meta.nom_meta.toLowerCase()}`}
                                className={`w-full px-3 py-2.5 text-sm border-2 rounded-lg outline-none transition-colors ${
                                  meta.type_meta === "date"
                                    ? "bg-slate-800 text-white border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                    : "bg-white text-slate-800 border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Credit file upload */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Documents à joindre
                        <span className="text-red-500 text-xs">*obligatoire</span>
                      </h4>

                      {/* Drop zone */}
                      <label className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all">
                        <Plus className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-sm font-medium text-slate-600">Glissez ou cliquez pour ajouter des fichiers</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, images, documents...</p>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              setCreditFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                            }
                          }}
                        />
                      </label>

                      {/* File list */}
                      {creditFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {creditFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-sm transition-all">
                              <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-indigo-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                <p className="text-[11px] text-slate-400">{formatFileSize(file.size)}</p>
                              </div>
                              <button
                                onClick={() => setCreditFiles((prev) => prev.filter((_, i) => i !== index))}
                                className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <p className="text-xs text-slate-500 text-right">
                            {creditFiles.length} fichier{creditFiles.length > 1 ? "s" : ""} sélectionné{creditFiles.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Upload progress */}
            {isUploading && (
              <div className="mt-6">
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="text-center text-xs text-slate-500 mt-2">Chargement : {uploadProgress}%</p>
              </div>
            )}

            {error && (
              <div className="mt-4 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="mt-4 px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" />
                Créé avec succès !
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button
              onClick={handlePreviousStep}
              disabled={step === 1}
              className="flex items-center gap-1.5 px-4 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Précédent
            </button>

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                disabled={(step === 1 && !selectedRubrique) || (step === 2 && !selectedSousDossier)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : isCredit ? (
              <button
                onClick={handleCreditUpload}
                disabled={creditFiles.length === 0 || isUploading || success}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Création...</>
                ) : (
                  <><CreditCard className="w-4 h-4" /> Créer le dossier de crédit</>
                )}
              </button>
            ) : (
              <button
                onClick={handleUpload}
                disabled={
                  selectedPieces.size === 0 || isUploading || success ||
                  Array.from(selectedPieces).some((pieceId) => {
                    const files = piecesWithFiles.get(pieceId);
                    return !files || files.length === 0;
                  })
                }
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</>
                ) : (
                  <><UploadCloud className="w-4 h-4" /> Créer et charger les fichiers</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* File preview modal */}
      <FilePreviewModal
        file={previewFile?.file || null}
        onClose={closePreview}
      />
    </>
  );
}

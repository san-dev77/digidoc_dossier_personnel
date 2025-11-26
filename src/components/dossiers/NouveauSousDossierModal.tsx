"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Building2,
  ChevronRight,
  Plus,
  Eye,
  Database,
  Upload,
  Download,
  X,
  User,
  ChevronLeft,
  File,
  CheckCircle,
} from "lucide-react";
import {
  sousDossiersService,
  type SousDossier,
} from "@/services/sous-dossiers";
import { piecesService } from "@/services/pieces";
import { useDossiersStore } from "@/store/dossiersStore";
import { isDossierCredit } from "@/utils/rubrique-utils";
import type { Rubrique, MetaValue, Agent } from "@/types";
import Image from "next/image";
import SuccessNotification from "@/components/SuccessNotification";
import FullScreenLoader from "@/components/FullScreenLoader";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";
import { DossiersOptimizedService } from "@/services/dossiers-optimized";

// Types pour les dossiers
interface PieceWithMetadata {
  id: string;
  nom: string;
  libelle?: string;
  description?: string;
  aMetadonnees: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: MetaValue[];
  filePath?: string;
  files?: PieceFile[];
  metadataModels?: MetadataModel[];
}

interface MetadataModel {
  id: string;
  piece_id: string;
  libelle: string;
  type: string;
  obligatoire: boolean;
  description?: string;
  created_at: string;
  updated_at?: string;
}

interface PieceFile {
  id: string;
  piece_id: string;
  file_path: string;
  created_at: string;
}

interface CreditMetadata {
  id: string;
  nom_meta: string;
  type_meta: string;
  [key: string]: unknown;
}

interface ModalData {
  agent: Agent | null;
  rubrique: Rubrique | null;
  sousDossier: SousDossier | null;
  pieces: PieceWithMetadata[];
}

interface NouveauSousDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ModalData) => void;
  showSuccessPopup: boolean;
  setShowSuccessPopup: (show: boolean) => void;
  onReset: () => void;
}

export default function NouveauSousDossierModal({
  isOpen,
  onClose,
  onReset,
}: NouveauSousDossierModalProps) {
  const [step, setStep] = useState(1);

  // Utiliser le store au lieu de l'état local
  const { agents, rubriques } = useDossiersStore();

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedRubrique, setSelectedRubrique] = useState<Rubrique | null>(
    null
  );
  const [selectedSousDossier, setSelectedSousDossier] =
    useState<SousDossier | null>(null);
  const [sousDossiers, setSousDossiers] = useState<SousDossier[]>([]);
  const [pieces, setPieces] = useState<PieceWithMetadata[]>([]);
  const [creditMetadata, setCreditMetadata] = useState<CreditMetadata[]>([]);
  const [creditValues, setCreditValues] = useState<Record<string, string>>({});
  const [pieceFiles, setPieceFiles] = useState<Record<string, File[]>>({});
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>(
    {}
  );
  const [searchAgent, setSearchAgent] = useState("");
  const [searchRubrique, setSearchRubrique] = useState("");
  const [searchSousDossier, setSearchSousDossier] = useState("");
  const [justUploaded, setJustUploaded] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [ignoreExistingValues, setIgnoreExistingValues] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingPieces, setLoadingPieces] = useState(false);

  // Fonction pour créer l'aperçu d'un fichier
  const createFilePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewFile(file);
    return url;
  };

  // Fonction pour fermer l'aperçu
  const closePreview = () => {
    if (previewFile) {
      URL.revokeObjectURL(URL.createObjectURL(previewFile));
    }
    setPreviewFile(null);
  };

  // Fonction pour reset tous les champs
  const resetForm = () => {
    setStep(1);
    setSelectedAgent(null);
    setSelectedRubrique(null);
    setSelectedSousDossier(null);
    setPieces([]);
    setPieceFiles({});
    setPreviewFile(null);
    setMetadataValues({});
    setLoadingPieces(false);
    setSearchAgent("");
    setSearchRubrique("");
    setSearchSousDossier("");
    setJustUploaded(false);
    setIgnoreExistingValues(true);
    setModalKey((prev) => prev + 1);
    setValidationError(null);
    setSuccessMessage(null);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedRubrique) {
      const loadSousDossiers = async () => {
        try {
          const sousDossiersData =
            await sousDossiersService.getAllSousDossiersByRubrique(
              selectedRubrique.id
            );
          setSousDossiers(sousDossiersData);
        } catch (error) {
          console.error("Erreur chargement sous-dossiers:", error);
          setSousDossiers([]);
        }
      };
      loadSousDossiers();
    }
  }, [selectedRubrique]);

  useEffect(() => {
    if (selectedSousDossier && !justUploaded) {
      const loadPieces = async () => {
        setLoadingPieces(true);
        try {
          const piecesData = await piecesService.getAllPiecesBySousDossier(
            selectedSousDossier.id
          );

          const piecesWithDetails = await Promise.all(
            piecesData.map(async (piece) => {
              const [metadataModels, files] = await Promise.all([
                fetchWithAuth(`/api/pieces/${piece.id}/metadata-models`).then((res) =>
                  res.ok ? res.json() : []
                ),
                fetchWithAuth(`/api/pieces/${piece.id}/files`).then((res) =>
                  res.ok ? res.json() : []
                ),
              ]);

              return {
                ...piece,
                metadata: [],
                metadataModels: metadataModels || [],
                files: files || [],
              };
            })
          );

          setPieces(piecesWithDetails as PieceWithMetadata[]);
        } catch (error) {
          console.error("Erreur chargement pièces:", error);
          setPieces([]);
        } finally {
          setLoadingPieces(false);
        }
      };
      loadPieces();
    }
  }, [selectedSousDossier, selectedRubrique, justUploaded]);

  useEffect(() => {
    if (ignoreExistingValues) {
      const timer = setTimeout(() => {
        setIgnoreExistingValues(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [ignoreExistingValues]);

  useEffect(() => {
    if (
      selectedSousDossier &&
      selectedRubrique &&
      (selectedRubrique.nom?.toLowerCase().includes("crédit") ||
        selectedRubrique.nom?.toLowerCase().includes("credit"))
    ) {
      const loadCreditMetadata = async () => {
        try {
          const response = await fetch(
            `/api/metadata-credit?action=by-sous-dossier&sous_dossier_id=${selectedSousDossier.id}`
          );
          if (response.ok) {
            const data = await response.json();
            setCreditMetadata(data.data || []);
            const valuesMap: Record<string, string> = {};
            (data.data || []).forEach((metadata: CreditMetadata) => {
              valuesMap[metadata.id] = "";
            });
            setCreditValues(valuesMap);
          } else {
            const errorData = await response.json();
            console.error(
              "❌ Erreur lors du chargement des métadonnées de crédit:",
              errorData
            );
            setCreditMetadata([]);
          }
        } catch (error) {
          console.error(
            "❌ Erreur lors du chargement des métadonnées de crédit:",
            error
          );
          setCreditMetadata([]);
        }
      };
      loadCreditMetadata();
    } else {
      setCreditMetadata([]);
    }
  }, [selectedSousDossier, selectedRubrique]);

  const filteredAgents = agents.filter(
    (agent) =>
      agent.nom.toLowerCase().includes(searchAgent.toLowerCase()) ||
      agent.matricule.toLowerCase().includes(searchAgent.toLowerCase())
  );

  const filteredRubriques = rubriques.filter((rubrique) =>
    rubrique.nom.toLowerCase().includes(searchRubrique.toLowerCase())
  );

  const filteredSousDossiers = sousDossiers.filter((sousDossier) =>
    sousDossier.titre.toLowerCase().includes(searchSousDossier.toLowerCase())
  );

  const handleClose = () => {
    setStep(1);
    setSelectedAgent(null);
    setSelectedRubrique(null);
    setSelectedSousDossier(null);
    setPieces([]);
    setPieceFiles({});
    setPreviewFile(null);
    setMetadataValues({});
    setLoadingPieces(false);
    setSearchAgent("");
    setSearchRubrique("");
    setSearchSousDossier("");
    setJustUploaded(false);
    setIgnoreExistingValues(true);
    onReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 transition-all duration-300 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header du modal */}
        <div className="relative bg-gradient-to-r from-primary-50 to-white p-8 border-b border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary-800 mb-1">
                  Gestion des Dossiers
                </h2>
                <p className="text-primary-600">
                  Étape {step}/4 -{" "}
                  {step === 1
                    ? "Sélection de l'agent"
                    : step === 2
                    ? "Sélection de la rubrique"
                    : step === 3
                    ? "Sélection du sous-dossier"
                    : "Gestion des pièces"}
                </p>
                <div className="mt-3 w-64 bg-primary-200 rounded-full h-2">
                  <div
                    className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(step / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-12 h-12 bg-primary-100 hover:bg-primary-200 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <X className="w-6 h-6 text-primary-600" />
            </button>
          </div>
        </div>

        {/* Contenu du modal */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-primary-800 mb-4">
                Sélectionner un agent
              </h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
                <input
                  type="text"
                  placeholder="Rechercher un agent..."
                  value={searchAgent}
                  onChange={(e) => setSearchAgent(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                />
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {filteredAgents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`group p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform ${
                      selectedAgent?.id === agent.id
                        ? "border-blue-700 bg-gradient-to-r from-primary-50 to-primary-100 shadow-lg"
                        : "border-primary-200 hover:border-primary-500 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          selectedAgent?.id === agent.id
                            ? "bg-gradient-primary"
                            : "bg-primary-100 group-hover:bg-primary-200"
                        }`}
                      >
                        <User
                          className={`w-6 h-6 ${
                            selectedAgent?.id === agent.id
                              ? "text-white"
                              : "text-primary-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-primary-800 text-lg">
                          {agent.nom}
                        </div>
                        <div className="text-sm text-primary-600">
                          {agent.matricule} • {agent.fonction}
                        </div>
                      </div>
                      {selectedAgent?.id === agent.id && (
                        <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-primary-800 mb-4">
                Sélectionner une rubrique
              </h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
                <input
                  type="text"
                  placeholder="Rechercher une rubrique..."
                  value={searchRubrique}
                  onChange={(e) => setSearchRubrique(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                />
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {filteredRubriques.map((rubrique) => (
                  <div
                    key={rubrique.id}
                    onClick={() => setSelectedRubrique(rubrique)}
                    className={`group p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1] ${
                      selectedRubrique?.id === rubrique.id
                        ? "border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 shadow-lg"
                        : "border-primary-200 hover:border-primary-700 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          selectedRubrique?.id === rubrique.id
                            ? "bg-gradient-primary"
                            : "bg-primary-100 group-hover:bg-primary-200"
                        }`}
                      >
                        <Building2
                          className={`w-6 h-6 ${
                            selectedRubrique?.id === rubrique.id
                              ? "text-white"
                              : "text-primary-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-primary-800 text-lg">
                          {rubrique.nom}
                        </div>
                        {rubrique.description && (
                          <div className="text-sm text-primary-600">
                            {rubrique.description}
                          </div>
                        )}
                      </div>
                      {selectedRubrique?.id === rubrique.id && (
                        <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="relative mb-4 border border-primary-500 text-black rounded-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
                <input
                  type="text"
                  placeholder="Rechercher un sous-dossier..."
                  value={searchSousDossier}
                  onChange={(e) => setSearchSousDossier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-primary-500 text-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="space-y-3 p-3 border-2 border-primary-500 text-black rounded-lg max-h-60 overflow-y-auto">
                {filteredSousDossiers.map((sousDossier) => (
                  <div
                    key={sousDossier.id}
                    onClick={() => setSelectedSousDossier(sousDossier)}
                    className={`group p-4 border-2  rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1] ${
                      selectedSousDossier?.id === sousDossier.id
                        ? "border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 shadow-lg"
                        : "border-primary-200 hover:border-primary-700 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          selectedSousDossier?.id === sousDossier.id
                            ? "bg-gradient-primary"
                            : "bg-primary-100 group-hover:bg-primary-200"
                        }`}
                      >
                        <FileText
                          className={`w-6 h-6 ${
                            selectedSousDossier?.id === sousDossier.id
                              ? "text-white"
                              : "text-primary-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-primary-800 text-lg">
                          {sousDossier.titre}
                        </div>
                        {sousDossier.description && (
                          <div className="text-sm text-primary-600">
                            {sousDossier.description}
                          </div>
                        )}
                      </div>
                      {selectedSousDossier?.id === sousDossier.id && (
                        <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-lg font-semibold text-primary-800 mb-4">
                {selectedRubrique?.nom?.toLowerCase().includes("crédit") ||
                selectedRubrique?.nom?.toLowerCase().includes("credit")
                  ? "Gestion du dossier de crédit"
                  : "Gestion des pièces"}
              </h3>

              {loadingPieces ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full animate-ping opacity-75"></div>
                    <div className="relative w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg">
                      <FileText className="w-10 h-10 text-white animate-pulse" />
                    </div>
                  </div>
                  <p className="text-primary-700 font-semibold text-lg">
                    Chargement des pièces...
                  </p>
                  <p className="text-primary-500 text-sm mt-2">
                    Veuillez patienter
                  </p>
                </div>
              ) : (
                <>
                  {selectedRubrique?.nom?.toLowerCase().includes("crédit") ||
                  selectedRubrique?.nom?.toLowerCase().includes("credit") ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-md font-medium text-blue-800 mb-3">
                          Métadonnées du dossier de crédit
                        </h4>
                        <p className="text-sm text-blue-600">
                          Sous-dossier sélectionné:{" "}
                          <strong>{selectedSousDossier?.titre}</strong>
                        </p>
                      </div>

                      <div className="bg-white border border-primary-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-primary-700 mb-3">
                          Champs de métadonnées
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {creditMetadata.length > 0 ? (
                            creditMetadata.map((metadata) => (
                              <div key={metadata.id} className="space-y-2">
                                <label className="text-sm font-medium text-primary-700 flex items-center gap-2">
                                  <Database className="w-4 h-4" />
                                  {metadata.nom_meta}
                                  <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded">
                                    {metadata.type_meta}
                                  </span>
                                </label>
                                {metadata.type_meta === "text" && (
                                  <input
                                    type="text"
                                    value={creditValues[metadata.id] || ""}
                                    onChange={(e) => {
                                      const newValues = { ...creditValues };
                                      newValues[metadata.id] = e.target.value;
                                      setCreditValues(newValues);
                                    }}
                                    onBlur={async () => {
                                      if (creditValues[metadata.id]) {
                                        try {
                                          await fetch("/api/meta-credit-values", {
                                            method: "POST",
                                            headers: {
                                              "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify({
                                              metadata_credit_id: metadata.id,
                                              valeur: creditValues[metadata.id],
                                            }),
                                          });
                                        } catch (error) {
                                          console.error("❌ Erreur sauvegarde:", error);
                                        }
                                      }
                                    }}
                                    placeholder={`Saisir ${metadata.nom_meta.toLowerCase()}`}
                                    className="w-full text-black px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                  />
                                )}
                                {metadata.type_meta === "number" && (
                                  <input
                                    type="number"
                                    value={creditValues[metadata.id] || ""}
                                    onChange={(e) => {
                                      const newValues = { ...creditValues };
                                      newValues[metadata.id] = e.target.value;
                                      setCreditValues(newValues);
                                    }}
                                    onBlur={async () => {
                                      if (creditValues[metadata.id]) {
                                        try {
                                          await fetch("/api/meta-credit-values", {
                                            method: "POST",
                                            headers: {
                                              "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify({
                                              metadata_credit_id: metadata.id,
                                              valeur: creditValues[metadata.id],
                                            }),
                                          });
                                        } catch (error) {
                                          console.error("❌ Erreur sauvegarde:", error);
                                        }
                                      }
                                    }}
                                    placeholder={`Saisir ${metadata.nom_meta.toLowerCase()}`}
                                    className="w-full text-black px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                  />
                                )}
                                {metadata.type_meta === "date" && (
                                  <input
                                    type="date"
                                    value={creditValues[metadata.id] || ""}
                                    onChange={(e) => {
                                      const newValues = { ...creditValues };
                                      newValues[metadata.id] = e.target.value;
                                      setCreditValues(newValues);
                                    }}
                                    onBlur={async () => {
                                      if (creditValues[metadata.id]) {
                                        try {
                                          await fetch("/api/meta-credit-values", {
                                            method: "POST",
                                            headers: {
                                              "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify({
                                              metadata_credit_id: metadata.id,
                                              valeur: creditValues[metadata.id],
                                            }),
                                          });
                                        } catch (error) {
                                          console.error("❌ Erreur sauvegarde:", error);
                                        }
                                      }
                                    }}
                                    className="w-full bg-gray-700 text-white px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                  />
                                )}
                                {metadata.type_meta === "textarea" && (
                                  <textarea
                                    value={creditValues[metadata.id] || ""}
                                    onChange={(e) => {
                                      const newValues = { ...creditValues };
                                      newValues[metadata.id] = e.target.value;
                                      setCreditValues(newValues);
                                    }}
                                    onBlur={async () => {
                                      if (creditValues[metadata.id]) {
                                        try {
                                          await fetch("/api/meta-credit-values", {
                                            method: "POST",
                                            headers: {
                                              "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify({
                                              metadata_credit_id: metadata.id,
                                              valeur: creditValues[metadata.id],
                                            }),
                                          });
                                        } catch (error) {
                                          console.error("❌ Erreur sauvegarde:", error);
                                        }
                                      }
                                    }}
                                    placeholder={`Saisir ${metadata.nom_meta.toLowerCase()}`}
                                    rows={3}
                                    className="w-full text-black px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                  />
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="col-span-full text-center py-8 text-primary-500">
                              <Database className="w-8 h-8 mx-auto mb-2" />
                              <p>
                                Aucune métadonnée de crédit définie pour ce
                                sous-dossier
                              </p>
                              <p className="text-xs mt-1">
                                Les métadonnées peuvent être créées dans les
                                paramètres de la rubrique
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedRubrique && isDossierCredit(selectedRubrique) && (
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={async () => {
                              setIsUploading(true);
                              if (
                                selectedAgent &&
                                selectedRubrique &&
                                selectedSousDossier
                              ) {
                                try {
                                  await fetchWithAuth("/api/agent-dossiers", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      agent_id: selectedAgent.id,
                                      rubrique_id: selectedRubrique.id,
                                      sous_dossier_id: selectedSousDossier.id,
                                    }),
                                  });
                                } catch (error) {
                                  console.log(
                                    "agent_dossiers déjà existant ou erreur:",
                                    error
                                  );
                                }
                              }
                              setSuccessMessage(
                                "✅ Dossier de crédit créé avec succès !"
                              );
                              setTimeout(async () => {
                                try {
                                  // Recharger tous les dossiers pour inclure les nouveaux agents
                                  await DossiersOptimizedService.loadDossiers(true);
                                  handleClose();
                                } catch (error) {
                                  console.error(
                                    "Erreur lors du rafraîchissement:",
                                    error
                                  );
                                  // En cas d'erreur, recharger la page
                                  window.location.reload();
                                }
                              }, 1500);
                            }}
                            className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg"
                          >
                            <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                            Terminer la création du dossier
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {pieces.map((piece) => (
                        <div
                          key={piece.id}
                          className="border border-primary-600 bg-primary-100 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold flex gap-2 justify-between bg-gradient-primary text-white px-2 py-1 rounded-lg items-center text-lg">
                              <FileText className="w-4 h-4 text-white" />
                              {piece.nom}
                            </h4>
                            <div className="flex items-center gap-2">
                              {piece.files && piece.files.length > 0 && (
                                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {piece.files.length} fichier(s)
                                </span>
                              )}
                              {piece.metadataModels &&
                                piece.metadataModels.length > 0 && (
                                  <span className="text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded">
                                    {piece.metadataModels.length} métadonnée(s)
                                  </span>
                                )}
                            </div>
                          </div>

                          {piece.description && (
                            <p className="text-md text-primary-600 mb-3">
                              {piece.description}
                            </p>
                          )}

                          {piece.metadataModels &&
                            piece.metadataModels.length > 0 && (
                              <div className="mb-3">
                                <h5 className="text-md font-medium text-primary-700 mb-2">
                                  Métadonnées:
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {piece.metadataModels.map(
                                    (model: MetadataModel) => (
                                      <div key={model.id} className="space-y-1">
                                        <label className="text-sm font-medium text-primary-700">
                                          {model.libelle}
                                          {model.obligatoire && (
                                            <span className="text-red-500 ml-1">
                                              *
                                            </span>
                                          )}
                                        </label>
                                        {model.type === "text" && (
                                          <input
                                            key={`${modalKey}_${piece.id}_${model.id}_text`}
                                            type="text"
                                            value={
                                              metadataValues[
                                                `${piece.id}_${model.id}`
                                              ] || ""
                                            }
                                            onChange={(e) => {
                                              setMetadataValues((prev) => ({
                                                ...prev,
                                                [`${piece.id}_${model.id}`]:
                                                  e.target.value,
                                              }));
                                            }}
                                            className="w-full px-3 py-2 border border-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                                          />
                                        )}
                                        {model.type === "number" && (
                                          <input
                                            key={`${modalKey}_${piece.id}_${model.id}_number`}
                                            type="number"
                                            value={
                                              metadataValues[
                                                `${piece.id}_${model.id}`
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              setMetadataValues((prev) => ({
                                                ...prev,
                                                [`${piece.id}_${model.id}`]:
                                                  e.target.value,
                                              }))
                                            }
                                            className="w-full px-3 py-2 border border-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                                          />
                                        )}
                                        {model.type === "date" && (
                                          <input
                                            key={`${modalKey}_${piece.id}_${model.id}_date`}
                                            type="date"
                                            value={
                                              metadataValues[
                                                `${piece.id}_${model.id}`
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              setMetadataValues((prev) => ({
                                                ...prev,
                                                [`${piece.id}_${model.id}`]:
                                                  e.target.value,
                                              }))
                                            }
                                            className="w-full px-3 bg-gray-700 text-white py-2 border border-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                          />
                                        )}
                                        {model.type === "boolean" && (
                                          <select
                                            key={`${modalKey}_${piece.id}_${model.id}_boolean`}
                                            value={
                                              metadataValues[
                                                `${piece.id}_${model.id}`
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              setMetadataValues((prev) => ({
                                                ...prev,
                                                [`${piece.id}_${model.id}`]:
                                                  e.target.value,
                                              }))
                                            }
                                            className="w-full px-3 py-2 border border-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                                          >
                                            <option value="">
                                              Sélectionner...
                                            </option>
                                            <option value="true">Oui</option>
                                            <option value="false">Non</option>
                                          </select>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          <div>
                            <h5 className="text-sm font-medium text-primary-700 mb-2">
                              Fichiers pour cette pièce:
                            </h5>

                            {pieceFiles[piece.id] &&
                              pieceFiles[piece.id].length > 0 && (
                                <div className="mb-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                                  <h6 className="text-xs font-semibold text-primary-600 mb-2">
                                    Fichiers sélectionnés (
                                    {pieceFiles[piece.id].length}):
                                  </h6>
                                  <div className="space-y-2">
                                    {pieceFiles[piece.id].map((file, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-white rounded border border-primary-200"
                                      >
                                        <div className="flex items-center gap-2">
                                          <File className="w-4 h-4 text-primary-500" />
                                          <span className="text-sm text-primary-700">
                                            {file.name}
                                          </span>
                                          <span className="text-xs text-primary-500">
                                            (
                                            {(file.size / 1024 / 1024).toFixed(
                                              2
                                            )}{" "}
                                            MB)
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() =>
                                              createFilePreview(file)
                                            }
                                            className="text-blue-500 hover:text-blue-700 p-1"
                                            title="Aperçu"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setPieceFiles((prev) => ({
                                                ...prev,
                                                [piece.id]:
                                                  prev[piece.id]?.filter(
                                                    (_, i) => i !== index
                                                  ) || [],
                                              }));
                                            }}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Supprimer"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            <div className="border-2 border-dashed border-primary-600 rounded-lg p-3 text-center">
                              <Upload className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                              <p className="text-sm text-primary-600 mb-2">
                                Glissez-déposez vos fichiers ici ou cliquez pour
                                sélectionner
                              </p>
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                id={`file-upload-${piece.id}`}
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files && files.length > 0) {
                                    setPieceFiles((prev) => ({
                                      ...prev,
                                      [piece.id]: [
                                        ...(prev[piece.id] || []),
                                        ...Array.from(files),
                                      ],
                                    }));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`file-upload-${piece.id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
                              >
                                <Upload className="w-4 h-4" />
                                {pieceFiles[piece.id] &&
                                pieceFiles[piece.id].length > 0
                                  ? "Ajouter des fichiers"
                                  : "Sélectionner des fichiers"}
                              </label>
                            </div>

                            {pieceFiles[piece.id] &&
                              pieceFiles[piece.id].length > 0 && (
                                <div className="mt-3 flex justify-center">
                                  <button
                                    onClick={async () => {
                                      if (
                                        !selectedRubrique ||
                                        !selectedSousDossier
                                      ) {
                                        setValidationError(
                                          "❌ Erreur : Rubrique ou sous-dossier non sélectionné"
                                        );
                                        return;
                                      }

                                      setIsUploading(true);
                                      try {
                                        const file = pieceFiles[piece.id][0];
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        formData.append(
                                          "rubriqueId",
                                          selectedRubrique.id
                                        );
                                        formData.append(
                                          "sousDossierId",
                                          selectedSousDossier.id
                                        );
                                        formData.append(
                                          "agentId",
                                          selectedAgent?.id || ""
                                        );
                                        formData.append("nom", piece.nom);
                                        formData.append("fileName", file.name);
                                        formData.append(
                                          "description",
                                          `Fichier uploadé: ${file.name}`
                                        );

                                        const response = await fetchWithAuth(
                                          "/api/upload",
                                          {
                                            method: "POST",
                                            body: formData,
                                          }
                                        );

                                        if (!response.ok) {
                                          const error = await response.json();
                                          console.error("Erreur upload:", error);
                                          setValidationError(
                                            `❌ Erreur lors de l'upload de ${file.name}`
                                          );
                                          return;
                                        }

                                        const uploadResult =
                                          await response.json();

                                        let agentDossierId: string | null =
                                          null;
                                        if (
                                          selectedAgent &&
                                          selectedRubrique &&
                                          selectedSousDossier
                                        ) {
                                          try {
                                            const adResponse = await fetchWithAuth(
                                              "/api/agent-dossiers",
                                              {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  agent_id: selectedAgent.id,
                                                  rubrique_id:
                                                    selectedRubrique.id,
                                                  sous_dossier_id:
                                                    selectedSousDossier.id,
                                                }),
                                              }
                                            );

                                            if (adResponse.ok) {
                                              const adData =
                                                await adResponse.json();
                                              agentDossierId =
                                                adData.id.toString();
                                            } else {
                                              const getResponse = await fetchWithAuth(
                                                `/api/agent-dossiers?sousDossierId=${selectedSousDossier.id}`
                                              );
                                              if (getResponse.ok) {
                                                const existingData =
                                                  await getResponse.json();
                                                if (existingData.length > 0) {
                                                  agentDossierId =
                                                    existingData[0].id.toString();
                                                }
                                              }
                                            }
                                          } catch (error) {
                                            console.log(
                                              "Erreur agent_dossiers:",
                                              error
                                            );
                                          }
                                        }

                                        try {
                                          const fileResponse = await fetchWithAuth(
                                            `/api/pieces/${piece.id}/files`,
                                            {
                                              method: "POST",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                file_path:
                                                  uploadResult.data.filePath,
                                                agent_dossier_id:
                                                  agentDossierId,
                                              }),
                                            }
                                          );

                                          if (!fileResponse.ok) {
                                            console.error(
                                              "Erreur liaison fichier à la pièce"
                                            );
                                            setValidationError(
                                              "❌ Erreur lors de la liaison du fichier à la pièce"
                                            );
                                            setIsUploading(false);
                                            return;
                                          }

                                          setPieceFiles((prev) => ({
                                            ...prev,
                                            [piece.id]:
                                              prev[piece.id]?.filter(
                                                (_, i) => i !== 0
                                              ) || [],
                                          }));

                                          if (
                                            piece.metadataModels &&
                                            piece.metadataModels.length > 0
                                          ) {
                                            for (const model of piece.metadataModels) {
                                              const metadataKey = `${piece.id}_${model.id}`;
                                              const metadataValue =
                                                metadataValues[metadataKey];

                                              if (
                                                metadataValue &&
                                                metadataValue.trim() !== ""
                                              ) {
                                                try {
                                                  const metadataResponse =
                                                    await fetch(
                                                      `/api/pieces/${piece.id}/metadata`,
                                                      {
                                                        method: "POST",
                                                        headers: {
                                                          "Content-Type":
                                                            "application/json",
                                                        },
                                                        body: JSON.stringify({
                                                          meta_model_id:
                                                            model.id,
                                                          valeur: metadataValue,
                                                          agent_dossier_id:
                                                            agentDossierId,
                                                        }),
                                                      }
                                                    );

                                                  if (metadataResponse.ok) {
                                                    console.log(
                                                      `Métadonnée ${model.libelle} sauvegardée`
                                                    );
                                                  }
                                                } catch (error) {
                                                  console.error(
                                                    `Erreur métadonnée ${model.libelle}:`,
                                                    error
                                                  );
                                                }
                                              }
                                            }
                                          }

                                          setValidationError(null);
                                          setSuccessMessage(
                                            `✅ Dossier créé avec succès pour "${piece.nom}"`
                                          );

                                          setTimeout(async () => {
                                            try {
                                              // Recharger tous les dossiers pour inclure les nouveaux agents
                                              await DossiersOptimizedService.loadDossiers(true);
                                              handleClose();
                                            } catch (error) {
                                              console.error(
                                                "Erreur lors du rafraîchissement:",
                                                error
                                              );
                                              // En cas d'erreur, recharger la page
                                              window.location.reload();
                                            }
                                          }, 1500);
                                        } catch (error) {
                                          console.error(
                                            "Erreur lors de la liaison du fichier:",
                                            error
                                          );
                                          setValidationError(
                                            "❌ Erreur lors de la liaison du fichier"
                                          );
                                          setIsUploading(false);
                                        }
                                      } catch (error) {
                                        console.error(
                                          "Erreur lors de l'upload:",
                                          error
                                        );
                                        setValidationError(
                                          "❌ Erreur lors de l'upload du fichier"
                                        );
                                        setIsUploading(false);
                                      }
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Charger pour {piece.nom}
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {validationError && (
          <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <p className="text-red-700 font-medium">{validationError}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-8 border-t border-primary-200 bg-gradient-to-r from-primary-50 to-white">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-xl hover:bg-gradient-to-r hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                Précédent
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-primary-600 hover:text-primary-800 transition-all duration-300 hover:bg-primary-100 rounded-xl font-medium"
            >
              Annuler
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !selectedAgent) ||
                  (step === 2 && !selectedRubrique) ||
                  (step === 3 && !selectedSousDossier)
                }
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-xl hover:bg-gradient-to-r hover:from-primary-700 hover:to-primary-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
              >
                Suivant
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-primary-600">
                  Utilisez les boutons &quot;Charger&quot; individuels pour
                  chaque pièce
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SuccessNotification
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
        duration={4000}
      />

      <FullScreenLoader isOpen={isUploading} message="Upload en cours..." />

      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500/5 to-blue-500/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <File className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Aperçu du fichier
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {previewFile.name} (
                    {(previewFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              </div>
              <button
                onClick={closePreview}
                className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {previewFile.type.startsWith("image/") ? (
                <div className="text-center">
                  <Image
                    src={URL.createObjectURL(previewFile)}
                    alt={previewFile.name}
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                    width={100}
                    height={100}
                  />
                </div>
              ) : previewFile.type === "application/pdf" ? (
                <div className="text-center">
                  <iframe
                    src={URL.createObjectURL(previewFile)}
                    className="w-full h-96 rounded-lg border"
                    title={previewFile.name}
                  />
                </div>
              ) : previewFile.type.startsWith("text/") ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 max-h-96 overflow-y-auto">
                    {(() => {
                      const reader = new FileReader();
                      reader.readAsText(previewFile);
                      return "Chargement du contenu...";
                    })()}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <File className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-semibold mb-2">
                    Aperçu non disponible
                  </p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    L&apos;aperçu n&apos;est pas disponible pour ce type de
                    fichier. Vous pouvez télécharger le fichier pour le
                    consulter.
                  </p>
                  <button
                    onClick={() => {
                      const url = URL.createObjectURL(previewFile);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = previewFile.name;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


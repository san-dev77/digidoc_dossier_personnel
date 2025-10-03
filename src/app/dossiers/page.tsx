"use client";

import { useState, useEffect, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Folder,
  Search,
  FileText,
  Calendar,
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
import { rubriquesService } from "@/services/rubriques";
import {
  sousDossiersService,
  type SousDossier,
} from "@/services/sous-dossiers";
import { piecesService } from "@/services/pieces";
import { agentsService } from "@/services/agents";
import { type PieceData } from "@/services/agent-data";
import { DossiersOptimizedService } from "@/services/dossiers-optimized";
import { useDossiersStore } from "@/store/dossiersStore";
import AgentDataViewer from "@/components/AgentDataViewer";
import PieceViewerModal from "@/components/PieceViewerModal";
import type { Rubrique, MetaValue, Agent } from "@/types";

// Types pour les dossiers
interface DossierData {
  rubrique: Rubrique;
  sousDossiers: SousDossierWithStats[];
  totalPieces: number;
  totalSousDossiers: number;
  totalMetadata: number;
}

interface SousDossierWithStats extends SousDossier {
  pieces: PieceWithMetadata[];
  piecesCount: number;
  piecesWithMetadataCount: number;
  totalMetadataCount: number;
  lastActivity: string;
}

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

// Composant pour afficher les métadonnées d'une pièce
function PieceMetadata({ piece }: { piece: PieceWithMetadata }) {
  if (!piece.metadata || piece.metadata.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic">
        Aucune métadonnée renseignée
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {piece.metadata.map((meta) => (
        <div key={meta.id} className="flex items-center gap-2 text-sm">
          <span className="font-medium text-slate-700">
            {meta.metadataModel?.libelle || "Métadonnée"}:
          </span>
          <span className="text-slate-600">{meta.valeur}</span>
          {meta.metadataModel?.obligatoire && (
            <span className="text-red-500 text-xs">*</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Composant pour une pièce
function PieceCard({ piece }: { piece: PieceWithMetadata }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-slate-800 mb-1">{piece.nom}</h5>
            {piece.description && (
              <p className="text-sm text-slate-600 mb-2">{piece.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  Ajouté le {new Date(piece.createdAt).toLocaleDateString()}
                </span>
              </div>
              {piece.aMetadonnees && (
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>{piece.metadata.length} métadonnée(s)</span>
                </div>
              )}
              {piece.filePath && (
                <div className="flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>Fichier uploadé</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {piece.filePath && (
            <button
              className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
              title="Télécharger le fichier"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {piece.aMetadonnees && (
        <div className="border-t border-slate-200 pt-3">
          <h6 className="text-sm font-medium text-slate-700 mb-2">
            Métadonnées:
          </h6>
          <PieceMetadata piece={piece} />
        </div>
      )}
    </div>
  );
}

// Composant pour un sous-dossier

// Composant Modal pour créer/éditer un sous-dossier
interface ModalData {
  agent: Agent | null;
  rubrique: Rubrique | null;
  sousDossier: SousDossier | null;
  pieces: PieceWithMetadata[];
}

function NouveauSousDossierModal({
  isOpen,
  onClose,
  setShowSuccessPopup,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ModalData) => void;
  showSuccessPopup: boolean;
  setShowSuccessPopup: (show: boolean) => void;
  onReset: () => void;
}) {
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // const [uploadedFiles, setUploadedFiles] = useState<
  //   Array<{ name: string; size: number; url: string }>
  // >([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [searchAgent, setSearchAgent] = useState("");
  const [searchRubrique, setSearchRubrique] = useState("");
  const [searchSousDossier, setSearchSousDossier] = useState("");
  const [justUploaded, setJustUploaded] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [ignoreExistingValues, setIgnoreExistingValues] = useState(false);
  // const [forceRerender, setForceRerender] = useState(0);

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
    setSelectedFiles([]);
    // setUploadedFiles([]);
    setPreviewFile(null);
    setMetadataValues({}); // Reset des valeurs de métadonnées
    setLoading(false);
    setSearchAgent("");
    setSearchRubrique("");
    setSearchSousDossier("");
    setJustUploaded(false); // Reset du flag d'upload
    setIgnoreExistingValues(true); // Ignorer les valeurs existantes
    setModalKey((prev) => prev + 1); // Incrémenter la clé pour forcer la recréation
    // setForceRerender((prev) => prev + 1); // Forcer un rerender complet
  };

  useEffect(() => {
    if (isOpen) {
      // Reset tous les champs quand la modale s'ouvre
      resetForm();
      // Plus besoin de charger agents et rubriques, ils viennent du store
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedRubrique) {
      // Récupérer les sous-dossiers depuis le store au lieu de faire un appel API
      const { dossiers } = useDossiersStore.getState();
      const dossier = dossiers.find(
        (d) => d.rubrique.id === selectedRubrique.id
      );
      if (dossier) {
        setSousDossiers(dossier.sousDossiers);
      }
    }
  }, [selectedRubrique]);

  useEffect(() => {
    if (selectedSousDossier && !justUploaded) {
      // Récupérer les pièces depuis le store au lieu de faire des appels API
      const { dossiers } = useDossiersStore.getState();
      const dossier = dossiers.find(
        (d) => d.rubrique.id === selectedRubrique?.id
      );
      if (dossier) {
        const sousDossier = dossier.sousDossiers.find(
          (sd) => sd.id === selectedSousDossier.id
        );
        if (sousDossier) {
          setPieces(sousDossier.pieces as PieceWithMetadata[]);
        }
      }
    }
  }, [selectedSousDossier, selectedRubrique, justUploaded]);

  // Remettre le flag à false après un délai pour permettre l'affichage des valeurs existantes
  useEffect(() => {
    if (ignoreExistingValues) {
      const timer = setTimeout(() => {
        setIgnoreExistingValues(false);
      }, 1000); // 1 seconde après le reset
      return () => clearTimeout(timer);
    }
  }, [ignoreExistingValues]);

  // Les données agents et rubriques viennent maintenant du store
  // Plus besoin de les charger via API

  // La fonction loadPieces a été supprimée car les données viennent maintenant du store

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
    // Reset tous les champs
    setStep(1);
    setSelectedAgent(null);
    setSelectedRubrique(null);
    setSelectedSousDossier(null);
    setPieces([]);
    setSelectedFiles([]);
    // setUploadedFiles([]);
    setPreviewFile(null);
    setMetadataValues({}); // Reset des valeurs de métadonnées
    setLoading(false);
    setSearchAgent("");
    setSearchRubrique("");
    setSearchSousDossier("");
    setJustUploaded(false); // Reset du flag d'upload
    setIgnoreExistingValues(true); // Ignorer les valeurs existantes
    onReset(); // Appeler la fonction de reset du parent
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 transition-all duration-300 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header du modal */}
        <div className="relative bg-gradient-to-r from-slate-50 to-white p-8 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">
                  Gestion des Dossiers
                </h2>
                <p className="text-slate-600">
                  Étape {step}/4 -{" "}
                  {step === 1
                    ? "Sélection de l'agent"
                    : step === 2
                    ? "Sélection de la rubrique"
                    : step === 3
                    ? "Sélection du sous-dossier"
                    : "Gestion des pièces"}
                </p>
                {/* Progress bar */}
                <div className="mt-3 w-64 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-slate-600 to-slate-700 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(step / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Contenu du modal */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Sélectionner un agent
              </h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un agent..."
                  value={searchAgent}
                  onChange={(e) => setSearchAgent(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-black"
                />
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {filteredAgents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`group p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                      selectedAgent?.id === agent.id
                        ? "border-slate-500 bg-gradient-to-r from-slate-50 to-slate-100 shadow-lg"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          selectedAgent?.id === agent.id
                            ? "bg-gradient-to-r from-slate-600 to-slate-700"
                            : "bg-slate-100 group-hover:bg-slate-200"
                        }`}
                      >
                        <User
                          className={`w-6 h-6 ${
                            selectedAgent?.id === agent.id
                              ? "text-white"
                              : "text-slate-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-lg">
                          {agent.nom}
                        </div>
                        <div className="text-sm text-slate-600">
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
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Sélectionner une rubrique
              </h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une rubrique..."
                  value={searchRubrique}
                  onChange={(e) => setSearchRubrique(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-black"
                />
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {filteredRubriques.map((rubrique) => (
                  <div
                    key={rubrique.id}
                    onClick={() => setSelectedRubrique(rubrique)}
                    className={`group p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                      selectedRubrique?.id === rubrique.id
                        ? "border-slate-500 bg-gradient-to-r from-slate-50 to-slate-100 shadow-lg"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          selectedRubrique?.id === rubrique.id
                            ? "bg-gradient-to-r from-slate-600 to-slate-700"
                            : "bg-slate-100 group-hover:bg-slate-200"
                        }`}
                      >
                        <Building2
                          className={`w-6 h-6 ${
                            selectedRubrique?.id === rubrique.id
                              ? "text-white"
                              : "text-slate-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-lg">
                          {rubrique.nom}
                        </div>
                        {rubrique.description && (
                          <div className="text-sm text-slate-600">
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
              <div className="relative mb-4 border border-slate-500 text-black rounded-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un sous-dossier..."
                  value={searchSousDossier}
                  onChange={(e) => setSearchSousDossier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-500 text-black rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
              </div>
              <div className="space-y-3 border-2 border-slate-500 text-black rounded-lg max-h-60 overflow-y-auto">
                {filteredSousDossiers.map((sousDossier) => (
                  <div
                    key={sousDossier.id}
                    onClick={() => setSelectedSousDossier(sousDossier)}
                    className={`group p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                      selectedSousDossier?.id === sousDossier.id
                        ? "border-slate-500 bg-gradient-to-r from-slate-50 to-slate-100 shadow-lg"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          selectedSousDossier?.id === sousDossier.id
                            ? "bg-gradient-to-r from-slate-600 to-slate-700"
                            : "bg-slate-100 group-hover:bg-slate-200"
                        }`}
                      >
                        <Folder
                          className={`w-6 h-6 ${
                            selectedSousDossier?.id === sousDossier.id
                              ? "text-white"
                              : "text-slate-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-lg">
                          {sousDossier.titre}
                        </div>
                        {sousDossier.description && (
                          <div className="text-sm text-slate-600">
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
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Gestion des pièces
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600">Chargement des pièces...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pieces.map((piece) => (
                    <div
                      key={piece.id}
                      className="border border-slate-600 bg-slate-100 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold flex gap-2 justify-between bg-gradient-to-r from-slate-600 to-slate-700 text-white px-2 py-1 rounded-lg items-center text-lg">
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
                              <span className="text-sm bg-slate-100 text-slate-800 px-2 py-1 rounded">
                                {piece.metadataModels.length} métadonnée(s)
                              </span>
                            )}
                        </div>
                      </div>

                      {piece.description && (
                        <p className="text-md text-slate-600 mb-3">
                          {piece.description}
                        </p>
                      )}

                      {/* Métadonnées */}
                      {piece.metadataModels &&
                        piece.metadataModels.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-md font-medium text-slate-700 mb-2">
                              Métadonnées:
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {piece.metadataModels.map(
                                (model: MetadataModel) => {
                                  return (
                                    <div key={model.id} className="space-y-1">
                                      <label className="text-sm font-medium text-slate-700">
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
                                          className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-black"
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
                                          className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-black"
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
                                          className="w-full px-3 bg-gray-700 text-white py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
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
                                          className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-black"
                                        >
                                          <option value="">
                                            Sélectionner...
                                          </option>
                                          <option value="true">Oui</option>
                                          <option value="false">Non</option>
                                        </select>
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}

                      {/* Upload de fichiers */}
                      <div>
                        <h5 className="text-sm font-medium text-slate-700 mb-2">
                          Fichiers:
                        </h5>

                        {/* Liste des fichiers sélectionnés */}
                        {selectedFiles.length > 0 && (
                          <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <h6 className="text-xs font-semibold text-slate-600 mb-2">
                              Fichiers sélectionnés ({selectedFiles.length}):
                            </h6>
                            <div className="space-y-2">
                              {selectedFiles.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <File className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-700">
                                      {file.name}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                                      MB)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => createFilePreview(file)}
                                      className="text-blue-500 hover:text-blue-700 p-1"
                                      title="Aperçu"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedFiles(
                                          selectedFiles.filter(
                                            (_, i) => i !== index
                                          )
                                        );
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

                        <div className="border-2 border-dashed border-slate-600 rounded-lg p-3 text-center">
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600 mb-2">
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
                                console.log("Fichiers sélectionnés:", files);
                                // Ajouter les nouveaux fichiers aux fichiers déjà sélectionnés
                                setSelectedFiles((prev) => [
                                  ...prev,
                                  ...Array.from(files),
                                ]);
                              }
                            }}
                          />
                          <label
                            htmlFor={`file-upload-${piece.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            {selectedFiles.length > 0
                              ? "Ajouter des fichiers"
                              : "Sélectionner des fichiers"}
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer du modal */}
        <div className="flex items-center justify-between p-8 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                Précédent
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 transition-all duration-300 hover:bg-slate-100 rounded-xl font-medium"
            >
              Annuler
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !selectedAgent) ||
                  (step === 2 && !selectedRubrique) ||
                  (step === 3 && !selectedSousDossier)
                }
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
              >
                Suivant
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            ) : (
              <button
                onClick={async () => {
                  // Uploader les fichiers sélectionnés
                  if (
                    selectedFiles.length > 0 &&
                    selectedRubrique &&
                    selectedSousDossier
                  ) {
                    console.log("🔍 Debug upload:", {
                      selectedRubrique: selectedRubrique,
                      selectedSousDossier: selectedSousDossier,
                      rubriqueId: selectedRubrique.id,
                      sousDossierId: selectedSousDossier.id,
                    });

                    try {
                      // Pour chaque pièce sélectionnée
                      for (const piece of pieces) {
                        // Si cette pièce a des fichiers sélectionnés
                        if (selectedFiles.length > 0) {
                          // Uploader le premier fichier (on peut adapter pour plusieurs)
                          const file = selectedFiles[0];
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("rubriqueId", selectedRubrique.id);
                          formData.append(
                            "sousDossierId",
                            selectedSousDossier.id
                          );
                          formData.append("nom", file.name);
                          formData.append(
                            "description",
                            `Fichier uploadé: ${file.name}`
                          );

                          const response = await fetch("/api/upload", {
                            method: "POST",
                            body: formData,
                          });

                          if (!response.ok) {
                            const error = await response.json();
                            console.error("Erreur upload:", error);
                            alert(`Erreur lors de l'upload de ${file.name}`);
                            return;
                          } else {
                            const uploadResult = await response.json();
                            console.log("Fichier uploadé:", uploadResult);

                            // Lier le fichier à la pièce existante
                            try {
                              const fileResponse = await fetch(
                                `/api/pieces/${piece.id}/files`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    file_path: uploadResult.data.filePath,
                                  }),
                                }
                              );

                              if (!fileResponse.ok) {
                                console.error(
                                  "Erreur liaison fichier à la pièce"
                                );
                              } else {
                                console.log(
                                  "Fichier lié à la pièce avec succès"
                                );
                              }
                            } catch (error) {
                              console.error(
                                "Erreur lors de la liaison du fichier:",
                                error
                              );
                            }
                          }
                        }

                        // Sauvegarder les métadonnées pour cette pièce
                        if (
                          piece.metadataModels &&
                          piece.metadataModels.length > 0
                        ) {
                          for (const model of piece.metadataModels) {
                            const metadataKey = `${piece.id}_${model.id}`;
                            const metadataValue = metadataValues[metadataKey];

                            if (metadataValue && metadataValue.trim() !== "") {
                              try {
                                const metadataResponse = await fetch(
                                  `/api/pieces/${piece.id}/metadata`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      meta_model_id: model.id,
                                      valeur: metadataValue,
                                    }),
                                  }
                                );

                                if (metadataResponse.ok) {
                                  console.log(
                                    `Métadonnée ${model.libelle} sauvegardée`
                                  );
                                } else {
                                  console.error(
                                    `Erreur sauvegarde métadonnée ${model.libelle}`
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
                      }
                      console.log(
                        `${selectedFiles.length} fichier(s) uploadé(s) avec succès !`
                      );

                      // Marquer qu'on vient de faire un upload
                      setJustUploaded(true);

                      // Afficher la popup de succès
                      setShowSuccessPopup(true);

                      // Fermer la modale après un délai
                      setTimeout(() => {
                        // Reset tous les champs avant de fermer
                        resetForm();
                        onClose();
                        setShowSuccessPopup(false);
                      }, 2000);
                    } catch (error) {
                      console.error("Erreur lors de l'upload:", error);
                      alert("Erreur lors de l'upload des fichiers");
                      return;
                    }
                  } else {
                    // Si pas de fichiers à uploader, fermer directement
                    onClose();
                  }
                }}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Sauvegarder
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modale d'aperçu de fichier */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
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

            {/* Contenu de l'aperçu */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {previewFile.type.startsWith("image/") ? (
                <div className="text-center">
                  <img
                    src={URL.createObjectURL(previewFile)}
                    alt={previewFile.name}
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
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

// Composant principal pour les dossiers
export default function DossiersPage() {
  // Utiliser le store Zustand au lieu du state local
  const { dossiers, loading, setDossiers, setLoading } = useDossiersStore();

  const [searchTerm, setSearchTerm] = useState("");
  // const [expandedRubriques, setExpandedRubriques] = useState<Set<string>>(
  //   new Set()
  // );
  const [showNouveauModal, setShowNouveauModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showPieceViewer, setShowPieceViewer] = useState(false);
  const [selectedPieceData, setSelectedPieceData] = useState<PieceData | null>(
    null
  );

  const loadDossiers = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        console.log("🚀 Chargement optimisé des dossiers...");
        const dossiersData = await DossiersOptimizedService.loadDossiers(
          forceRefresh
        );
        setDossiers(dossiersData);
        console.log("✅ Dossiers chargés avec succès:", dossiersData.length);
      } catch (error) {
        console.error("❌ Erreur lors du chargement des dossiers:", error);
      }
    },
    [setDossiers]
  );

  useEffect(() => {
    loadDossiers();
  }, [loadDossiers]);

  // Filtrage des dossiers (désactivé pour l'instant)
  const filteredDossiers = dossiers;

  // const toggleRubrique = (rubriqueId: string) => {
  //   const newExpanded = new Set(expandedRubriques);
  //   if (newExpanded.has(rubriqueId)) {
  //     newExpanded.delete(rubriqueId);
  //   } else {
  //     newExpanded.add(rubriqueId);
  //   }
  //   setExpandedRubriques(newExpanded);
  // };

  // const handleEditSousDossier = (sousDossier: SousDossierWithStats) => {
  //   // TODO: Implémenter l'édition du sous-dossier
  //   console.log("Éditer le sous-dossier:", sousDossier);
  // };

  // const handleDeleteSousDossier = (sousDossier: SousDossierWithStats) => {
  //   // TODO: Implémenter la suppression du sous-dossier
  //   console.log("Supprimer le sous-dossier:", sousDossier);
  // };

  // const handleViewSousDossier = (sousDossier: SousDossierWithStats) => {
  //   // TODO: Implémenter la vue détaillée du sous-dossier
  //   console.log("Voir le sous-dossier:", sousDossier);
  // };

  const handleRefresh = () => {
    console.log("🔄 Rafraîchissement forcé des dossiers...");
    loadDossiers(true);
  };

  const handleNouveauSousDossier = () => {
    setShowNouveauModal(true);
  };

  const handleCloseNouveauModal = () => {
    setShowNouveauModal(false);
  };

  const handleSaveNouveauSousDossier = (data: ModalData) => {
    console.log("Sauvegarder les données:", data);
    setShowNouveauModal(false);
  };

  const handlePieceClick = (pieceData: PieceData) => {
    setSelectedPieceData(pieceData);
    setShowPieceViewer(true);
  };

  // Utiliser le store pour obtenir l'état du cache
  const { isCacheValid, lastFetch } = useDossiersStore();

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">
                Chargement des dossiers...
              </p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header Card */}
        <div className="mb-8">
          <div className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 mb-5 rounded-3xl shadow-2xl overflow-hidden">
            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>

            <div className="relative p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300">
                      <Folder className="w-14 h-14 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                      Gestion des Dossiers
                    </h1>
                    <p className="text-slate-200 text-xl mb-6 leading-relaxed">
                      Organisation et suivi des dossiers par rubrique et
                      sous-dossier
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="group flex items-center space-x-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                        <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-lg animate-pulse"></div>
                        <span className="text-white text-sm font-semibold">
                          {dossiers.reduce(
                            (sum, d) => sum + d.totalSousDossiers,
                            0
                          )}{" "}
                          sous-dossiers
                        </span>
                      </div>
                      <div className="group flex items-center space-x-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                        <div className="w-3 h-3 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full shadow-lg"></div>
                        <span className="text-white text-sm font-semibold">
                          {dossiers.reduce((sum, d) => sum + d.totalPieces, 0)}{" "}
                          pièces
                        </span>
                      </div>
                      <div className="group flex items-center space-x-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                        <div className="w-3 h-3 bg-gradient-to-r from-slate-300 to-slate-400 rounded-full shadow-lg"></div>
                        <span className="text-white text-sm font-semibold">
                          {dossiers.reduce(
                            (sum, d) => sum + d.totalMetadata,
                            0
                          )}{" "}
                          métadonnées
                        </span>
                      </div>
                      {/* Indicateur de cache */}
                      <div className="group flex items-center space-x-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                        <div
                          className={`w-3 h-3 rounded-full shadow-lg ${
                            isCacheValid()
                              ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                              : "bg-gradient-to-r from-orange-400 to-orange-500"
                          }`}
                        ></div>
                        <span className="text-white text-sm font-semibold">
                          {isCacheValid() ? "Cache valide" : "Cache expiré"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boutons de contrôle */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleRefresh}
                    className="group relative px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-white/30"
                  >
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                      <span>Rafraîchir</span>
                    </div>
                  </button>

                  <div className="text-xs text-slate-300 bg-white/10 px-3 py-2 rounded-lg">
                    Dernière MAJ:{" "}
                    {lastFetch
                      ? new Date(lastFetch).toLocaleTimeString("fr-FR")
                      : "Jamais"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative w-full max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une rubrique ou un sous-dossier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 bg-white shadow-lg hover:shadow-xl transition-all duration-300 text-black"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <X className="h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={handleNouveauSousDossier}
              className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-2xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-semibold">Nouveau sous-dossier</span>
            </button>
          </div>
        </div>

        {/* Liste des dossiers */}
        <div className="space-y-6">
          <AgentDataViewer onPieceClick={handlePieceClick} />
        </div>

        {/* Modal Nouveau Sous-dossier */}
        <NouveauSousDossierModal
          isOpen={showNouveauModal}
          onClose={handleCloseNouveauModal}
          onSave={handleSaveNouveauSousDossier}
          showSuccessPopup={showSuccessPopup}
          setShowSuccessPopup={setShowSuccessPopup}
          onReset={() => {
            // Reset sera géré dans la modale
          }}
        />

        {/* Modal de consultation des pièces */}
        <PieceViewerModal
          isOpen={showPieceViewer}
          onClose={() => setShowPieceViewer(false)}
          pieceData={selectedPieceData}
        />

        {/* Popup de succès */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
              <div className="text-center">
                {/* Icône de succès */}
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>

                {/* Titre */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Succès !
                </h3>

                {/* Message */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Les fichiers ont été uploadés avec succès et les métadonnées
                  ont été sauvegardées.
                </p>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full animate-pulse"
                    style={{ width: "100%" }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">
                  Fermeture automatique dans 2 secondes...
                </p>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}

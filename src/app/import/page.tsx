"use client";

import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Upload,
  FileSpreadsheet,
  Users,
  Folder,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import FullScreenLoader from "@/components/FullScreenLoader";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

type ImportType = "agents" | "documents" | "credits";

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<{
    created: number;
    updated: number;
    errors: number;
    details?: Array<{ success: boolean; message: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateAndSetFile = (selectedFile: File) => {
    // Vérifier que c'est un fichier CSV ou Excel
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (
      !validTypes.includes(selectedFile.type) &&
      !selectedFile.name.endsWith(".csv")
    ) {
      setError("Format de fichier invalide. Utilisez CSV ou Excel (.xlsx)");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const handleImport = async () => {
    if (!file || !importType) return;

    setIsUploading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", importType);

      const response = await fetchWithAuth("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'import");
      }

      const data = await response.json();
      setResults(data);
      setFile(null);

      // Reset le champ file
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = (type: ImportType) => {
    // Générer un template CSV selon le type
    let csvContent = "";
    let fileName = "";

    switch (type) {
      case "agents":
        csvContent = "Matricule,Nom,Prénom,Fonction,Direction\n";
        csvContent += "MLL000001,DUPONT,JEAN,DIRECTEUR,DRH\n";
        csvContent += "MLL000002,TRAORE,FATOU,CHEF SERVICE,DAI\n";
        fileName = "template_agents.csv";
        break;
      case "documents":
        csvContent = "Sous-dossier,Nom de la pièce\n";
        csvContent += "Documents administratifs,Casier judiciaire\n";
        csvContent += "Documents administratifs,Certificat de nationalité\n";
        csvContent += "Documents d'état civil,Acte de naissance du personnel\n";
        csvContent += "Documents d'état civil,Acte de mariage\n";
        fileName = "template_documents.csv";
        break;
      case "credits":
        csvContent = "Documents du dossier PRÊT\n";
        csvContent += "DEMANDE DE PRÊT\n";
        csvContent += "FICHE D'ACCORD DE CREDIT\n";
        csvContent += "CONVENTION DE PRÊT\n";
        csvContent += "BILLET A ORDRE\n";
        fileName = "template_credits.csv";
        break;
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-primary-700 rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Upload className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Import de données
                  </h1>
                  <p className="text-primary-200 mt-1">
                    Importez des agents, documents ou dossiers de crédit en
                    masse
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sélection du type d'import */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Type d&apos;import
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Import Agents */}
              <button
                onClick={() => setImportType("agents")}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  importType === "agents"
                    ? "border-blue-500 bg-accent-blue-light shadow-lg"
                    : "border-gray-200 hover:border-gray-400 bg-white hover:shadow-md"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${
                      importType === "agents" ? "bg-accent-blue" : "bg-gray-200"
                    }`}
                  >
                    <Users
                      className={`w-8 h-8 ${
                        importType === "agents"
                          ? "text-white"
                          : "text-gray-600"
                      }`}
                    />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Agents
                  </h3>
                  <p className="text-sm text-gray-600">
                    Importer une liste d&apos;agents avec leurs informations
                  </p>
                </div>
              </button>

              {/* Import Documents */}
              <button
                onClick={() => setImportType("documents")}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  importType === "documents"
                    ? "border-emerald-500 bg-accent-green-light shadow-lg"
                    : "border-gray-200 hover:border-gray-400 bg-white hover:shadow-md"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${
                      importType === "documents"
                        ? "bg-accent-green"
                        : "bg-gray-200"
                    }`}
                  >
                    <Folder
                      className={`w-8 h-8 ${
                        importType === "documents"
                          ? "text-white"
                          : "text-gray-600"
                      }`}
                    />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Documents du personnel
                  </h3>
                  <p className="text-sm text-gray-600">
                    Importer des documents administratifs
                  </p>
                </div>
              </button>

              {/* Import Crédits */}
              <button
                onClick={() => setImportType("credits")}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  importType === "credits"
                    ? "border-violet-500 bg-accent-purple-light shadow-lg"
                    : "border-gray-200 hover:border-gray-400 bg-white hover:shadow-md"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${
                      importType === "credits"
                        ? "bg-accent-purple"
                        : "bg-gray-200"
                    }`}
                  >
                    <FileSpreadsheet
                      className={`w-8 h-8 ${
                        importType === "credits"
                          ? "text-white"
                          : "text-gray-600"
                      }`}
                    />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Dossiers de crédit
                  </h3>
                  <p className="text-sm text-gray-600">
                    Importer des demandes de crédit
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Zone d'import */}
          {importType && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Import :{" "}
                  {importType === "agents"
                    ? "Agents"
                    : importType === "documents"
                    ? "Documents du personnel"
                    : "Dossiers de crédit"}
                </h2>
                <button
                  onClick={() => downloadTemplate(importType)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le template
                </button>
              </div>

              {/* Upload zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center mb-6 transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-accent-blue-light"
                    : "border-gray-300"
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  Glissez-déposez votre fichier ici
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  ou cliquez pour sélectionner (CSV ou Excel)
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors cursor-pointer font-semibold text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Sélectionner un fichier
                </label>

                {file && (
                  <div className="mt-4 inline-flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <CheckCircle className="w-5 h-5 text-accent-green flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-gray-800 font-semibold text-sm">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} Ko
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton d'import */}
              <div className="flex justify-center">
                <button
                  onClick={handleImport}
                  disabled={!file || isUploading}
                  className="flex items-center gap-3 px-8 py-3.5 bg-primary-700 text-white rounded-xl hover:bg-primary-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base"
                >
                  <Upload className="w-5 h-5" />
                  Importer les données
                </button>
              </div>
            </div>
          )}

          {/* Résultats */}
          {results && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-accent-green rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Import réussi !
                  </h3>
                  <p className="text-gray-600">
                    Les données ont été importées avec succès
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-accent-green-light rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-accent-green mb-1 font-semibold">Créés</p>
                  <p className="text-3xl font-bold text-accent-green">
                    {results.created || 0}
                  </p>
                </div>
                <div className="bg-accent-blue-light rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-accent-blue mb-1 font-semibold">Mis à jour</p>
                  <p className="text-3xl font-bold text-accent-blue">
                    {results.updated || 0}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-700 mb-1 font-semibold">Erreurs</p>
                  <p className="text-3xl font-bold text-red-600">
                    {results.errors || 0}
                  </p>
                </div>
              </div>

              {results.details && results.details.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Détails de l&apos;import :
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {results.details.map((detail, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          detail.success
                            ? "bg-accent-green-light border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <p
                          className={`text-sm ${
                            detail.success ? "text-accent-green" : "text-red-700"
                          }`}
                        >
                          {detail.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 rounded-2xl border-2 border-red-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900 mb-1">
                    Erreur
                  </h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              Comment ça marche
            </h2>
            <div className="space-y-5">
              <div className="flex gap-4">
                <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                    Choisissez le type d&apos;import
                  </h3>
                  <p className="text-sm text-gray-500">
                    Sélectionnez le type de données que vous souhaitez importer
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                    Téléchargez le template
                  </h3>
                  <p className="text-sm text-gray-500">
                    Utilisez le bouton &apos;Télécharger le template&apos; pour
                    obtenir un fichier exemple
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  3
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                    Remplissez vos données
                  </h3>
                  <p className="text-sm text-gray-500">
                    Complétez le fichier CSV ou Excel avec vos données
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  4
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                    Importez le fichier
                  </h3>
                  <p className="text-sm text-gray-500">
                    Glissez-déposez votre fichier ou cliquez pour le
                    sélectionner
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loader */}
        <FullScreenLoader isOpen={isUploading} message="Import en cours..." />
      </DashboardLayout>
    </AuthGuard>
  );
}

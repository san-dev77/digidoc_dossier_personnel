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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
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
    }
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

      const response = await fetch("/api/import", {
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-3xl shadow-2xl p-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Import de données
                  </h1>
                  <p className="text-slate-200 text-lg">
                    Importez des agents, documents ou dossiers de crédit en
                    masse
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sélection du type d'import */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Type d&apos;import
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Import Agents */}
              <button
                onClick={() => setImportType("agents")}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  importType === "agents"
                    ? "border-blue-500 bg-blue-50 shadow-lg"
                    : "border-slate-200 hover:border-slate-400 bg-white hover:shadow-md"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${
                      importType === "agents" ? "bg-blue-500" : "bg-slate-200"
                    }`}
                  >
                    <Users
                      className={`w-8 h-8 ${
                        importType === "agents"
                          ? "text-white"
                          : "text-slate-600"
                      }`}
                    />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">
                    Agents
                  </h3>
                  <p className="text-sm text-slate-600">
                    Importer une liste d&apos;agents avec leurs informations
                  </p>
                </div>
              </button>

              {/* Import Documents */}
              <button
                onClick={() => setImportType("documents")}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  importType === "documents"
                    ? "border-emerald-500 bg-emerald-50 shadow-lg"
                    : "border-slate-200 hover:border-slate-400 bg-white hover:shadow-md"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${
                      importType === "documents"
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    }`}
                  >
                    <Folder
                      className={`w-8 h-8 ${
                        importType === "documents"
                          ? "text-white"
                          : "text-slate-600"
                      }`}
                    />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">
                    Documents du personnel
                  </h3>
                  <p className="text-sm text-slate-600">
                    Importer des documents administratifs
                  </p>
                </div>
              </button>

              {/* Import Crédits */}
              <button
                onClick={() => setImportType("credits")}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  importType === "credits"
                    ? "border-purple-500 bg-purple-50 shadow-lg"
                    : "border-slate-200 hover:border-slate-400 bg-white hover:shadow-md"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${
                      importType === "credits"
                        ? "bg-purple-500"
                        : "bg-slate-200"
                    }`}
                  >
                    <FileSpreadsheet
                      className={`w-8 h-8 ${
                        importType === "credits"
                          ? "text-white"
                          : "text-slate-600"
                      }`}
                    />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">
                    Dossiers de crédit
                  </h3>
                  <p className="text-sm text-slate-600">
                    Importer des demandes de crédit
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Zone d'import */}
          {importType && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  Import :{" "}
                  {importType === "agents"
                    ? "Agents"
                    : importType === "documents"
                    ? "Documents du personnel"
                    : "Dossiers de crédit"}
                </h2>
                <button
                  onClick={() => downloadTemplate(importType)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le template
                </button>
              </div>

              {/* Upload zone */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center mb-6">
                <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Glissez-déposez votre fichier ici
                </h3>
                <p className="text-slate-500 mb-4">
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Sélectionner un fichier
                </label>

                {file && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 inline-block">
                    <p className="text-slate-700 font-medium">📄 {file.name}</p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
              </div>

              {/* Bouton d'import */}
              <div className="flex justify-center">
                <button
                  onClick={handleImport}
                  disabled={!file || isUploading}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-lg"
                >
                  <Upload className="w-6 h-6" />
                  Importer les données
                </button>
              </div>
            </div>
          )}

          {/* Résultats */}
          {results && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Import réussi !
                  </h3>
                  <p className="text-slate-600">
                    Les données ont été importées avec succès
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <p className="text-sm text-emerald-700 mb-1">Créés</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {results.created || 0}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-700 mb-1">Mis à jour</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {results.updated || 0}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-sm text-orange-700 mb-1">Erreurs</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {results.errors || 0}
                  </p>
                </div>
              </div>

              {results.details && results.details.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-slate-800 mb-3">
                    Détails de l&apos;import :
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {results.details.map((detail, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          detail.success
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <p
                          className={`text-sm ${
                            detail.success ? "text-emerald-700" : "text-red-700"
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
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
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
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              📋 Instructions
            </h2>
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-semibold mb-2">
                  1. Choisissez le type d&apos;import
                </h3>
                <p className="text-sm text-slate-600">
                  Sélectionnez le type de données que vous souhaitez importer
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  2. Téléchargez le template
                </h3>
                <p className="text-sm text-slate-600">
                  Utilisez le bouton &apos;Télécharger le template&apos; pour
                  obtenir un fichier exemple
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  3. Remplissez vos données
                </h3>
                <p className="text-sm text-slate-600">
                  Complétez le fichier CSV ou Excel avec vos données
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">4. Importez le fichier</h3>
                <p className="text-sm text-slate-600">
                  Glissez-déposez votre fichier ou cliquez pour le sélectionner
                </p>
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

"use client";

import {
  FileText,
  Printer,
  X,
  User,
  Folder,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";
import type { ConformityReport } from "./types";
import type { PieceWithCheck } from "@/types";

interface FicheModalProps {
  isOpen: boolean;
  report: ConformityReport | null;
  onClose: () => void;
  onPrint: () => void;
}

function calculateSousDossierStatus(pieces: PieceWithCheck[]): {
  status: "all_checked" | "partial_checked" | "none_checked" | "no_pieces";
  checkedCount: number;
  totalPieces: number;
} {
  if (pieces.length === 0) {
    return { status: "no_pieces", checkedCount: 0, totalPieces: 0 };
  }

  const checkedCount = pieces.filter((p) => p.isDisponible === true).length;
  const verifiedCount = pieces.filter((p) => p.isDisponible !== null).length;
  const totalPieces = pieces.length;

  if (verifiedCount === 0) {
    return { status: "none_checked", checkedCount: 0, totalPieces };
  } else if (checkedCount === totalPieces && verifiedCount === totalPieces) {
    return { status: "all_checked", checkedCount, totalPieces };
  } else if (checkedCount > 0 && checkedCount < totalPieces) {
    return { status: "partial_checked", checkedCount, totalPieces };
  } else if (verifiedCount === totalPieces && checkedCount === 0) {
    return { status: "none_checked", checkedCount: 0, totalPieces };
  } else {
    return { status: "partial_checked", checkedCount, totalPieces };
  }
}

export default function FicheModal({
  isOpen,
  report,
  onClose,
  onPrint,
}: FicheModalProps) {
  if (!isOpen || !report) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "all_checked":
        return "text-green-600 bg-green-50 border-green-200";
      case "partial_checked":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "none_checked":
        return "text-red-600 bg-red-50 border-red-200";
      case "no_pieces":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "all_checked":
        return <CheckCircle className="w-5 h-5" />;
      case "partial_checked":
        return <AlertTriangle className="w-5 h-5" />;
      case "none_checked":
        return <XCircle className="w-5 h-5" />;
      case "no_pieces":
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 transition-all duration-300 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Fiche d&apos;État de Conformité
              </h2>
              <p className="text-sm text-slate-600">
                {report.agent.nom} - {report.agent.matricule}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="print-content bg-white">
            <div className="text-center mb-8 border-b-2 border-primary-200 pb-6">
              <h1 className="text-3xl font-bold text-primary-800 mb-2">
                FICHE D&apos;ÉTAT DE CONFORMITÉ
              </h1>
              <p className="text-lg text-slate-600">
                Système de Gestion Documentaire
              </p>
              <p className="text-sm text-slate-500">
                Générée le {new Date().toLocaleDateString("fr-FR")}
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-6 h-6" />
                Informations de l&apos;Agent
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">
                      Nom complet :
                    </span>
                    <span className="text-slate-600">{report.agent.nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">
                      Matricule :
                    </span>
                    <span className="text-slate-600">
                      {report.agent.matricule}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">
                      Fonction :
                    </span>
                    <span className="text-slate-600">
                      {report.agent.fonction}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">Email :</span>
                    <span className="text-slate-600">
                      {report.agent.email || "Non renseigné"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">
                      Téléphone :
                    </span>
                    <span className="text-slate-600">
                      {report.agent.telephone || "Non renseigné"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">
                      Date d&apos;inscription :
                    </span>
                    <span className="text-slate-600">
                      {new Date(report.agent.createdAt).toLocaleDateString(
                        "fr-FR"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Folder className="w-6 h-6" />
                Détail par Rubrique
              </h2>
              {report.rubriques.map((rubrique) => (
                <div
                  key={rubrique.rubrique.id}
                  className="mb-6 border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="bg-slate-50 p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">
                          {rubrique.rubrique.nom}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {rubrique.sousDossiers.length} sous-dossier
                          {rubrique.sousDossiers.length > 1 ? "s" : ""} •{" "}
                          {rubrique.totalPieces} pièce
                          {rubrique.totalPieces > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      {rubrique.sousDossiers.map((sousDossier) => {
                        const statusData = calculateSousDossierStatus(
                          sousDossier.pieces
                        );
                        return (
                          <div
                            key={sousDossier.id}
                            className={`border rounded-lg p-4 ${getStatusColor(
                              statusData.status
                            )}`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(statusData.status)}
                                <div>
                                  <h4 className="font-bold text-slate-800">
                                    {sousDossier.titre}
                                  </h4>
                                  {sousDossier.description && (
                                    <p className="text-sm text-slate-600">
                                      {sousDossier.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-slate-600">
                                  {statusData.checkedCount}/
                                  {statusData.totalPieces} pièces
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {sousDossier.pieces.map((piece) => (
                                <div
                                  key={piece.id}
                                  className="flex items-center justify-between bg-white/50 rounded-lg p-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">
                                      {piece.nom}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {piece.isDisponible === null ? (
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        Non disponible
                                      </span>
                                    ) : piece.isDisponible ? (
                                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                        Disponible
                                      </span>
                                    ) : (
                                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                        Non disponible
                                      </span>
                                    )}
                                    {piece.lastCheckDate && (
                                      <span className="text-xs text-slate-400">
                                        {new Date(
                                          piece.lastCheckDate
                                        ).toLocaleDateString("fr-FR")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t-2 border-primary-200 text-center">
              <p className="text-sm text-slate-500">
                Ce document a été généré automatiquement le{" "}
                {new Date().toLocaleString("fr-FR")} par le système de gestion
                documentaire.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Pour toute question concernant cette fiche, veuillez contacter
                l&apos;administrateur système.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


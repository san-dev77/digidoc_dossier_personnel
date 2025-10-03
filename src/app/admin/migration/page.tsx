"use client";

import { useState } from "react";
import {
  Database,
  Play,
  RotateCcw,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

interface MigrationResult {
  success: boolean;
  message: string;
  data?: object;
  action?: string;
  timestamp: string;
}

export default function MigrationAdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const executeMigration = async (action: string) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/migration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      setResult({
        success: false,
        message: `Erreur: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/migration");
      const data = await response.json();
      setResult(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      setResult({
        success: false,
        message: `Erreur: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    {
      id: "initialize",
      label: "Initialiser la DB",
      description: "Génère le client Prisma et crée toutes les tables",
      icon: Play,
      color: "btn-primary",
    },
    {
      id: "generate",
      label: "Générer Client",
      description: "Génère uniquement le client Prisma",
      icon: Database,
      color: "btn-secondary",
    },
    {
      id: "migrate",
      label: "Migrer",
      description: "Applique les migrations au schéma",
      icon: RefreshCw,
      color: "btn-accent",
    },
    {
      id: "reset",
      label: "Reset DB",
      description: "Supprime et recrée toutes les tables",
      icon: RotateCcw,
      color: "btn-warning",
    },
    {
      id: "backup",
      label: "Sauvegarder",
      description: "Crée une sauvegarde de la base",
      icon: Download,
      color: "btn-info",
    },
  ];

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-base-content">
              Administration de la Base de Données
            </h1>
          </div>
          <p className="text-base-content/70">
            Gérez les migrations et&apos;initialisation de votre base de données
            Prisma
          </p>
        </div>

        {/* Status Check */}
        <div className="card bg-base-200 shadow-xl mb-8">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="card-title">Statut de la Base de Données</h2>
                <p className="text-sm text-base-content/70">
                  Vérifiez l&apos;état actuel de votre base de données
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/admin/database-schema"
                  className="btn btn-outline btn-secondary"
                >
                  <BookOpen className="w-4 h-4" />
                  Voir le Schéma
                </Link>
                <button
                  onClick={checkStatus}
                  disabled={loading}
                  className="btn btn-outline btn-primary"
                >
                  <CheckCircle className="w-4 h-4" />
                  Vérifier le Statut
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.id} className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-6 h-6 text-primary" />
                    <h3 className="card-title text-lg">{action.label}</h3>
                  </div>
                  <p className="text-sm text-base-content/70 mb-4">
                    {action.description}
                  </p>
                  <button
                    onClick={() => executeMigration(action.id)}
                    disabled={loading}
                    className={`btn ${action.color} btn-sm w-full`}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>
                        <Icon className="w-4 h-4" />
                        Exécuter
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Result Display */}
        {result && (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-success" />
                ) : (
                  <XCircle className="w-6 h-6 text-error" />
                )}
                <h3 className="card-title">
                  Résultat {result.action && `- ${result.action}`}
                </h3>
              </div>

              <div
                className={`alert ${
                  result.success ? "alert-success" : "alert-error"
                } mb-4`}
              >
                <span>{result.message}</span>
              </div>

              {result.data && (
                <div className="collapse collapse-arrow bg-base-300">
                  <input type="checkbox" />
                  <div className="collapse-title text-sm font-medium">
                    Détails techniques
                  </div>
                  <div className="collapse-content">
                    <pre className="text-xs bg-base-100 p-4 rounded-lg overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="text-xs text-base-content/50 mt-4">
                {new Date(result.timestamp).toLocaleString("fr-FR")}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="card bg-info/10 border border-info/20 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-info">
              Instructions d&apos;utilisation
            </h3>
            <div className="text-sm space-y-2">
              <p>
                <strong>Initialiser la DB :</strong> Utilisez cette option pour
                la première installation
              </p>
              <p>
                <strong>Générer Client :</strong> Après avoir modifié le schéma
                Prisma
              </p>
              <p>
                <strong>Migrer :</strong> Pour appliquer les changements de
                schéma
              </p>
              <p>
                <strong>Reset DB :</strong> ⚠️ Attention : supprime toutes les
                données
              </p>
              <p>
                <strong>Sauvegarder :</strong> Crée une sauvegarde SQL de la
                base
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

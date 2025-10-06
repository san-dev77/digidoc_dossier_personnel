"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  Percent,
  MessageSquare,
  Edit,
  Save,
  X,
  Trash2,
  Database,
} from "lucide-react";
import type {
  CreditDossierData,
  MetadataCredit,
} from "../types/credit-dossier";

interface CreditDossierViewerProps {
  sousDossierId: number;
  rubriqueId: number;
  onClose?: () => void;
}

export default function CreditDossierViewer({
  sousDossierId,
  rubriqueId,
  onClose,
}: CreditDossierViewerProps) {
  const [creditData, setCreditData] = useState<CreditDossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Structure pour le tableau : métadonnées en colonnes, valeurs en lignes
  const [tableData, setTableData] = useState<Array<{ [key: string]: string }>>(
    []
  );

  const loadCreditDossierData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les métadonnées de crédit pour ce sous-dossier
      const response = await fetch(
        `/api/metadata-credit?action=by-sous-dossier&sous_dossier_id=${sousDossierId}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des données");
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Charger les valeurs pour chaque métadonnée
        const metadataWithValues = await Promise.all(
          result.data.map(async (metadata: MetadataCredit) => {
            try {
              const valuesResponse = await fetch(
                `/api/meta-credit-values?metadata_credit_id=${metadata.id}`
              );

              if (valuesResponse.ok) {
                const valuesResult = await valuesResponse.json();
                return {
                  ...metadata,
                  meta_credit_values: valuesResult.success
                    ? valuesResult.data
                    : [],
                };
              }
              return metadata;
            } catch (error) {
              console.error(
                `Erreur chargement valeurs pour ${metadata.nom_meta}:`,
                error
              );
              return metadata;
            }
          })
        );

        // Créer l'objet de données
        const dossierData: CreditDossierData = {
          sousDossier: {
            id: sousDossierId,
            titre: `Dossier de crédit ${sousDossierId}`,
            description: "Dossier de crédit personnel",
            rubrique_id: rubriqueId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          metadata: metadataWithValues,
          totalMetadata: metadataWithValues.length,
          lastActivity: new Date().toISOString(),
        };

        setCreditData(dossierData);

        // Initialiser les données du formulaire avec les valeurs existantes
        const initialFormData: Record<string, string> = {};
        metadataWithValues.forEach((metadata) => {
          if (
            metadata.meta_credit_values &&
            metadata.meta_credit_values.length > 0
          ) {
            // Prendre la dernière valeur
            const latestValue = metadata.meta_credit_values[0];
            initialFormData[metadata.id.toString()] = latestValue.valeur;
          }
        });
        setFormData(initialFormData);

        // Transformer les données en format tableau
        if (dossierData.metadata && dossierData.metadata.length > 0) {
          const transformedData: Array<{ [key: string]: string }> = [];

          // Créer une ligne pour chaque ensemble de valeurs
          dossierData.metadata.forEach((metadata) => {
            if (
              metadata.meta_credit_values &&
              metadata.meta_credit_values.length > 0
            ) {
              metadata.meta_credit_values.forEach((value, index) => {
                if (!transformedData[index]) {
                  transformedData[index] = {};
                }
                transformedData[index][metadata.id.toString()] = value.valeur;
                transformedData[index][`${metadata.id}_id`] =
                  value.id.toString();
              });
            }
          });

          setTableData(transformedData);
        }
      } else {
        setError("Aucune donnée trouvée pour ce dossier de crédit");
      }
    } catch (error) {
      console.error("Erreur lors du chargement du dossier de crédit:", error);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [sousDossierId, rubriqueId]);

  // Charger les données du dossier de crédit
  useEffect(() => {
    loadCreditDossierData();
  }, [loadCreditDossierData]);

  const handleInputChange = (metadataId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [metadataId]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Sauvegarder chaque valeur modifiée
      const savePromises = Object.entries(formData).map(
        async ([metadataId, valeur]) => {
          if (valeur.trim()) {
            const response = await fetch("/api/meta-credit-values", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                metadata_credit_id: parseInt(metadataId),
                valeur: valeur.trim(),
              }),
            });

            if (!response.ok) {
              throw new Error(`Erreur sauvegarde ${metadataId}`);
            }

            return response.json();
          }
        }
      );

      await Promise.all(savePromises);

      setSuccess("Données sauvegardées avec succès !");
      setEditing(false);

      // Recharger les données
      setTimeout(() => {
        loadCreditDossierData();
        setSuccess(null);
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setError("Erreur lors de la sauvegarde des données");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRow = async (rowIndex: number) => {
    if (
      !confirm("Êtes-vous sûr de vouloir supprimer cette ligne de valeurs ?")
    ) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const rowData = tableData[rowIndex];
      const valueIds: number[] = [];

      // Collecter tous les IDs de valeurs de cette ligne
      Object.keys(rowData).forEach((key) => {
        if (key.endsWith("_id")) {
          valueIds.push(parseInt(rowData[key]));
        }
      });

      // Supprimer toutes les valeurs de cette ligne
      const deletePromises = valueIds.map((valueId) =>
        fetch(`/api/meta-credit-values?id=${valueId}`, {
          method: "DELETE",
        })
      );

      await Promise.all(deletePromises);

      setSuccess("Ligne supprimée avec succès !");

      // Recharger les données
      setTimeout(() => {
        loadCreditDossierData();
        setSuccess(null);
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setError("Erreur lors de la suppression de la ligne");
    } finally {
      setSaving(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case "currency":
        return <DollarSign className="w-4 black h-4" />;
      case "percentage":
        return <Percent className="w-4 black h-4" />;
      case "number":
        return <FileText className="w-4 black h-4" />;
      case "date":
        return <Calendar className="w-4 black h-4" />;
      case "text":
        return <MessageSquare className="w-4 black h-4" />;
      default:
        return <FileText className="w-4 black h-4" />;
    }
  };

  const formatValue = (value: string, type: string) => {
    if (!value) return "Non renseigné";

    switch (type.toLowerCase()) {
      case "currency":
        return `${value} FCFA`;
      case "percentage":
        return `${value}%`;
      case "date":
        return new Date(value).toLocaleDateString("fr-FR");
      default:
        return value;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-slate-600">Chargement des données...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3">
          <X className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
        <button
          onClick={loadCreditDossierData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!creditData) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-800">
              {creditData.sousDossier.titre}
            </h2>
            <p className="text-emerald-600">
              {creditData.totalMetadata} métadonnée
              {creditData.totalMetadata > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </>
          ) : (
            <></>
          )}
          {onClose && <></>}
        </div>
      </div>

      {/* Messages de statut */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Save className="w-5 h-5 text-emerald-600" />
            <p className="text-emerald-800">{success}</p>
          </div>
        </div>
      )}

      {/* Tableau des valeurs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">
            Données du dossier de crédit
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            {tableData.length} ligne{tableData.length > 1 ? "s" : ""} de données
          </p>
        </div>

        {creditData.metadata.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {creditData.metadata.map((metadata) => (
                    <th
                      key={metadata.id}
                      className="px-6 bg-gray-600 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 black bg-gray-600 rounded-lg flex items-center justify-center">
                          {getIconForType(metadata.type_meta)}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {metadata.nom_meta}
                          </div>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 bg-gray-600 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {tableData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {creditData.metadata.map((metadata) => (
                      <td
                        key={metadata.id}
                        className="px-6 py-4 whitespace-nowrap bg-gray-50"
                      >
                        {editing ? (
                          <input
                            type={
                              metadata.type_meta === "date" ? "date" : "text"
                            }
                            value={
                              formData[metadata.id.toString()] ||
                              row[metadata.id.toString()] ||
                              ""
                            }
                            onChange={(e) =>
                              handleInputChange(
                                metadata.id.toString(),
                                e.target.value
                              )
                            }
                            placeholder={`Saisir ${metadata.nom_meta.toLowerCase()}`}
                            className="w-full text-black px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
                          />
                        ) : (
                          <div className="text-sm text-slate-900">
                            {row[metadata.id.toString()] ? (
                              <span className="font-medium">
                                {formatValue(
                                  row[metadata.id.toString()],
                                  metadata.type_meta
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">
                                Non renseigné
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm bg-gray-50">
                      <div className="flex items-center gap-2">
                        {/* Bouton Update/Modifier */}
                        {!editing && (
                          <button
                            onClick={() => {
                              setEditing(true);
                              // Pré-remplir le formulaire avec les valeurs de cette ligne
                              const newFormData: Record<string, string> = {};
                              creditData.metadata.forEach((metadata) => {
                                newFormData[metadata.id.toString()] =
                                  row[metadata.id.toString()] || "";
                              });
                              setFormData(newFormData);
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Modifier cette ligne"
                          >
                            <Edit className="w-3 h-3" />
                            Modifier
                          </button>
                        )}

                        {/* Bouton Delete pour la ligne */}
                        <button
                          onClick={() => handleDeleteRow(rowIndex)}
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Supprimer cette ligne"
                        >
                          <Trash2 className="w-3 h-3" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">
              Aucune métadonnée configurée
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Les métadonnées de crédit n&apos;ont pas encore été configurées
              pour ce dossier.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

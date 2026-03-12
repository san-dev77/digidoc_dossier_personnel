"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";
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
  Download,
  File,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Types
interface CreditEntryFile {
  id: number;
  file_name: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  thumbnail_path: string | null;
  created_at: string;
}

interface CreditEntryMetaValue {
  id: number;
  valeur: string;
  created_at: string;
  metadata_credit: {
    id: number;
    nom_meta: string;
    type_meta: string;
  };
}

interface CreditEntry {
  id: number;
  label: string | null;
  created_at: string;
  updated_at: string | null;
  meta_credit_values: CreditEntryMetaValue[];
  credit_files: CreditEntryFile[];
}

interface CreditDossierViewerProps {
  sousDossierId: number;
  rubriqueId: number;
  agentDossierId: number;
  onClose?: () => void;
}

export default function CreditDossierViewer({
  sousDossierId,
  agentDossierId,
}: CreditDossierViewerProps) {
  const [entries, setEntries] = useState<CreditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());
  const [previewFile, setPreviewFile] = useState<CreditEntryFile | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});
  const [editValueIds, setEditValueIds] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  // Blob URL preview
  const openPreview = async (file: CreditEntryFile) => {
    setPreviewFile(file);
    setLoadingPreview(true);
    try {
      const response = await fetchWithAuth(`/api/credit-files/${file.id}`);
      if (response.ok) {
        const blob = await response.blob();
        setPreviewBlobUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error("Erreur chargement fichier:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewBlobUrl(null);
    setPreviewFile(null);
  };

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchWithAuth(
        agentDossierId
          ? `/api/credit-upload?agent_dossier_id=${agentDossierId}`
          : `/api/credit-upload?sous_dossier_id=${sousDossierId}`
      );
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const result = await response.json();
      if (result.success) {
        setEntries(result.data || []);
        setExpandedEntries(new Set<number>((result.data || []).map((e: CreditEntry) => e.id)));
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error("Erreur chargement:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [sousDossierId, agentDossierId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const toggleEntry = (id: number) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startEditing = (entry: CreditEntry) => {
    setEditingEntryId(entry.id);
    const formData: Record<string, string> = {};
    const valueIds: Record<string, number> = {};
    entry.meta_credit_values.forEach((mv) => {
      formData[mv.metadata_credit.id.toString()] = mv.valeur;
      valueIds[mv.metadata_credit.id.toString()] = mv.id;
    });
    setEditFormData(formData);
    setEditValueIds(valueIds);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await Promise.all(
        Object.entries(editFormData).map(async ([metadataId, valeur]) => {
          const existingId = editValueIds[metadataId];
          if (existingId && valeur.trim()) {
            await fetchWithAuth("/api/meta-credit-values", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: existingId, valeur: valeur.trim() }),
            });
          }
        })
      );
      setEditingEntryId(null);
      setEditValueIds({});
      loadEntries();
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm("Supprimer ce fichier définitivement ?")) return;
    try {
      const response = await fetchWithAuth(`/api/credit-files/${fileId}`, { method: "DELETE" });
      if (response.ok) {
        loadEntries();
      } else {
        setError("Erreur lors de la suppression du fichier");
      }
    } catch (err) {
      console.error("Erreur suppression fichier:", err);
      setError("Erreur lors de la suppression");
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
  if (!confirm("Supprimer cette entrée, tous ses fichiers et métadonnées ?")) return;
  try {
    setSaving(true);
    const res = await fetchWithAuth(`/api/credit-entries/${entryId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Erreur de suppression");
    }
    loadEntries();
  } catch (err) {
    console.error("Erreur suppression:", err);
    setError("Erreur lors de la suppression");
  } finally {
    setSaving(false);
  }
};

  const formatValue = (value: string, type: string) => {
    if (!value) return "—";
    switch (type.toLowerCase()) {
      case "currency": return `${Number(value).toLocaleString("fr-FR")} FCFA`;
      case "percentage": return `${value}%`;
      case "date":
        try { return new Date(value).toLocaleDateString("fr-FR"); } catch { return value; }
      default: return value;
    }
  };

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case "currency": return <DollarSign className="w-3.5 h-3.5" />;
      case "percentage": return <Percent className="w-3.5 h-3.5" />;
      case "number": return <FileText className="w-3.5 h-3.5" />;
      case "date": return <Calendar className="w-3.5 h-3.5" />;
      case "text": return <MessageSquare className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // ===== RENDER =====

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-emerald-500 border-t-transparent"></div>
        <span className="ml-3 text-sm text-slate-500">Chargement...</span>
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <X className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button onClick={loadEntries} className="text-sm text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
          Réessayer
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Database className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-700">Aucun dossier de crédit</p>
        <p className="text-xs text-slate-400 mt-1">Créez un dossier via le bouton &quot;Nouveau dossier&quot;.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header compact */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Dossiers de crédit</h2>
            <p className="text-xs text-slate-400">{entries.length} entrée{entries.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs text-red-600">❌ {error}</p>
        </div>
      )}

      {/* Entry cards */}
      {entries.map((entry) => {
        const isExpanded = expandedEntries.has(entry.id);
        const isEditing = editingEntryId === entry.id;

        return (
          <div key={entry.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
            {/* Entry header */}
            <button
              className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors text-left ${isExpanded ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
              onClick={() => toggleEntry(entry.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {entry.label || `Entrée #${entry.id}`}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(entry.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="text-indigo-400">•</span>
                    <span className="font-semibold text-indigo-600">{entry.credit_files.length} doc{entry.credit_files.length > 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {!isEditing && (
                  <>
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); startEditing(entry); }}
                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200"
                    >
                      <Edit className="w-4 h-4" />
                    </span>
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                      className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </span>
                  </>
                )}
                {isExpanded
                  ? <ChevronUp className="w-5 h-5 text-indigo-500 ml-1" />
                  : <ChevronDown className="w-5 h-5 text-slate-400 ml-1" />
                }
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t-2 border-indigo-100 bg-slate-50/50">
                {/* Metadata table */}
                {entry.meta_credit_values.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" />
                        Informations
                      </p>
                      {isEditing && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          Édition
                        </span>
                      )}
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-800">
                            {entry.meta_credit_values.map((mv) => (
                              <th key={mv.metadata_credit.id} className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-200 uppercase tracking-wider whitespace-nowrap">
                                <span className="flex items-center gap-1.5">
                                  {getIconForType(mv.metadata_credit.type_meta)}
                                  {mv.metadata_credit.nom_meta}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {entry.meta_credit_values.map((mv) => (
                              <td key={mv.id} className="px-3 py-2.5 border-t border-slate-100 whitespace-nowrap">
                                {isEditing ? (
                                  <input
                                    type={mv.metadata_credit.type_meta === "date" ? "date" : "text"}
                                    value={editFormData[mv.metadata_credit.id.toString()] || ""}
                                    onChange={(e) => setEditFormData({ ...editFormData, [mv.metadata_credit.id.toString()]: e.target.value })}
                                    className={`w-full text-sm px-2.5 py-1.5 border-2 rounded-lg outline-none transition-colors ${
                                      mv.metadata_credit.type_meta === "date"
                                        ? "bg-slate-800 text-white border-slate-700 focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                                        : "bg-white text-slate-800 border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    }`}
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-slate-800">
                                    {formatValue(mv.valeur, mv.metadata_credit.type_meta)}
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {isEditing && (
                      <div className="flex gap-2 mt-2.5 justify-end">
                        <button onClick={() => { setEditingEntryId(null); setEditValueIds({}); }} className="text-xs px-3 py-1.5 text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors flex items-center gap-1">
                          <X className="w-3 h-3" /> Annuler
                        </button>
                        <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1.5 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1">
                          <Save className="w-3 h-3" /> {saving ? "..." : "Sauvegarder"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Files section */}
                <div className="px-4 pb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <File className="w-3.5 h-3.5" />
                    Documents ({entry.credit_files.length})
                  </p>
                  {entry.credit_files.length > 0 ? (
                    <div className="space-y-1.5">
                      {entry.credit_files.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all">
                          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{file.original_name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString("fr-FR")}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openPreview(file)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200" title="Aperçu">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteFile(file.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-200" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      Aucun document
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Modal aperçu fichier */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closePreview}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{previewFile.original_name}</p>
                  <p className="text-[11px] text-slate-400">{formatFileSize(previewFile.file_size)} • {new Date(previewFile.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewBlobUrl && (
                  <a href={previewBlobUrl} download={previewFile.original_name} className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors font-medium flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Télécharger
                  </a>
                )}
                <button onClick={closePreview} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Modal content */}
            <div className="flex-1 overflow-auto p-5 bg-slate-50">
              {loadingPreview || !previewBlobUrl ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-400 border-t-transparent"></div>
                  <span className="ml-3 text-sm text-slate-400">Chargement...</span>
                </div>
              ) : previewFile.mime_type.startsWith("image/") ? (
                <img src={previewBlobUrl} alt={previewFile.original_name} className="max-w-full max-h-[70vh] mx-auto rounded-lg" />
              ) : previewFile.mime_type === "application/pdf" ? (
                <iframe src={previewBlobUrl} className="w-full h-[70vh] rounded-lg border border-slate-200" title={previewFile.original_name} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <File className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="text-sm font-medium">Aperçu non disponible</p>
                  <p className="text-xs mt-1">{previewFile.mime_type}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

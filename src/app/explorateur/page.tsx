"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Folder,
  FolderOpen,
  File,
  FileText,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  HardDrive,
  BarChart3,
  X,
  Eye,
  Download,
  Search,
  ExternalLink,
  Calendar,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Code,
  Database,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";

interface FileNode {
  name: string;
  type: "file" | "directory";
  path: string;
  size?: number;
  children?: FileNode[];
  extension?: string;
  modifiedAt?: string;
}

interface FileExplorerData {
  root: string;
  tree: FileNode[];
  totalFiles: number;
  totalDirectories: number;
}

export default function ExplorateurPage() {
  const [data, setData] = useState<FileExplorerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTree, setFilteredTree] = useState<FileNode[]>([]);
  const [previewFile, setPreviewFile] = useState<FileNode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const loadFileTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithAuth("/api/file-explorer");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors du chargement");
      }

      setData(result.data);
      setFilteredTree(result.data.tree);
    } catch (error) {
      console.error("Erreur lors du chargement de l'arborescence:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFileTree();
  }, [loadFileTree]);

  // Filtrage des résultats
  useEffect(() => {
    if (!data || !searchTerm) {
      setFilteredTree(data?.tree || []);
      return;
    }

    const filterTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.reduce((acc: FileNode[], node) => {
        const matchesSearch = node.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        if (node.type === "file" && matchesSearch) {
          acc.push(node);
        } else if (node.type === "directory") {
          const filteredChildren = filterTree(node.children || []);
          if (matchesSearch || filteredChildren.length > 0) {
            acc.push({
              ...node,
              children: filteredChildren,
            });
          }
        }

        return acc;
      }, []);
    };

    setFilteredTree(filterTree(data.tree));
  }, [data, searchTerm]);

  const toggleNode = (path: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const getFileIcon = (node: FileNode, size: "sm" | "md" | "lg" = "sm") => {
    const sizeClass =
      size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-8 h-8";

    if (node.type === "directory") {
      return expandedNodes.has(node.path) ? (
        <FolderOpen className={`${sizeClass} text-blue-500`} />
      ) : (
        <Folder className={`${sizeClass} text-blue-500`} />
      );
    }

    const ext = node.extension?.toLowerCase();
    switch (ext) {
      case ".pdf":
        return <File className={`${sizeClass} text-red-500`} />;
      case ".jpg":
      case ".jpeg":
      case ".png":
      case ".gif":
      case ".webp":
      case ".bmp":
      case ".svg":
        return <FileImage className={`${sizeClass} text-green-500`} />;
      case ".mp4":
      case ".avi":
      case ".mov":
      case ".wmv":
      case ".flv":
        return <FileVideo className={`${sizeClass} text-purple-500`} />;
      case ".mp3":
      case ".wav":
      case ".flac":
      case ".aac":
        return <FileAudio className={`${sizeClass} text-orange-500`} />;
      case ".zip":
      case ".rar":
      case ".7z":
      case ".tar":
      case ".gz":
        return <Archive className={`${sizeClass} text-yellow-500`} />;
      case ".txt":
      case ".md":
      case ".rtf":
        return <FileText className={`${sizeClass} text-gray-500`} />;
      case ".js":
      case ".ts":
      case ".jsx":
      case ".tsx":
      case ".html":
      case ".css":
      case ".php":
      case ".py":
      case ".java":
      case ".cpp":
      case ".c":
        return <Code className={`${sizeClass} text-indigo-500`} />;
      case ".sql":
      case ".db":
      case ".sqlite":
        return <Database className={`${sizeClass} text-cyan-500`} />;
      case ".doc":
      case ".docx":
        return <FileText className={`${sizeClass} text-blue-600`} />;
      case ".xls":
      case ".xlsx":
        return <FileText className={`${sizeClass} text-green-600`} />;
      case ".ppt":
      case ".pptx":
        return <FileText className={`${sizeClass} text-orange-600`} />;
      default:
        return <File className={`${sizeClass} text-gray-400`} />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "";

    try {
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      const size = bytes / Math.pow(1024, i);
      return `${size.toFixed(1)} ${sizes[i]}`;
    } catch (error) {
      console.warn("Erreur lors du formatage de la taille:", error);
      return "Taille inconnue";
    }
  };

  const handlePreview = async (file: FileNode) => {
    if (file.type !== "file") return;

    try {
      setPreviewFile(file);
      setIsPreviewOpen(true);

      // Charger le fichier avec authentification et créer un Blob URL
      // Encoder chaque segment du chemin individuellement pour la route [...path]
      const pathSegments = file.path
        .split("/")
        .map((segment) => encodeURIComponent(segment));
      const fileUrl = `/api/files/${pathSegments.join("/")}`;
      const response = await fetchWithAuth(fileUrl);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
    } catch (error) {
      console.error("Erreur lors de la prévisualisation:", error);
    }
  };

  const handleOpenFile = async (file: FileNode) => {
    if (file.type !== "file") return;

    try {
      // Encoder chaque segment du chemin individuellement pour la route [...path]
      const pathSegments = file.path
        .split("/")
        .map((segment) => encodeURIComponent(segment));
      const fileUrl = `/api/files/${pathSegments.join("/")}`;
      const response = await fetchWithAuth(fileUrl);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (error) {
      console.error("Erreur lors de l'ouverture du fichier:", error);
    }
  };

  const handleDownload = async (file: FileNode) => {
    if (file.type !== "file") return;

    try {
      // Encoder chaque segment du chemin individuellement pour la route [...path]
      const pathSegments = file.path
        .split("/")
        .map((segment) => encodeURIComponent(segment));
      const fileUrl = `/api/files/${pathSegments.join("/")}`;
      const response = await fetchWithAuth(fileUrl);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Nettoyer le Blob URL après un délai
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
    }
  };

  const canPreview = (file: FileNode) => {
    if (file.type !== "file") return false;
    const ext = file.extension?.toLowerCase();
    return [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".bmp",
      ".svg",
      ".pdf",
      ".txt",
      ".md",
    ].includes(ext || "");
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedFile?.path === node.path;

    return (
      <div key={node.path} className="mb-1">
        <div
          className={`group flex items-center py-2 px-3 cursor-pointer rounded-lg transition-all duration-200 ${
            isSelected
              ? "bg-primary-100 border-l-4 border-primary-500 shadow-sm"
              : "hover:bg-primary-50 border-l-4 border-transparent"
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => {
            if (node.type === "directory") {
              toggleNode(node.path);
            }
            setSelectedFile(node);
          }}
        >
          {/* Indicateur d'expansion pour les dossiers */}
          {node.type === "directory" && hasChildren && (
            <div className="mr-2 flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-primary-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-primary-500" />
              )}
            </div>
          )}
          {node.type === "directory" && !hasChildren && (
            <div className="w-4 mr-2" />
          )}

          {/* Icône du fichier/dossier */}
          <div className="mr-3 flex-shrink-0">{getFileIcon(node, "sm")}</div>

          {/* Informations principales */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary-800 truncate font-medium">
                {node.name}
              </span>
              {node.type === "file" && canPreview(node) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(node);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded bg-primary-100 text-primary-600 hover:bg-primary-200 transition-all"
                  title="Prévisualiser"
                >
                  <Eye className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Métadonnées du fichier */}
            {node.type === "file" && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-primary-500">
                  {formatFileSize(node.size)}
                </span>
                {node.extension && (
                  <span className="text-xs px-1.5 py-0.5 bg-primary-200 text-primary-700 rounded text-[10px] font-medium">
                    {node.extension.toUpperCase()}
                  </span>
                )}
                {node.modifiedAt && (
                  <span className="text-xs text-primary-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(node.modifiedAt).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions rapides pour les fichiers */}
          {node.type === "file" && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenFile(node);
                }}
                className="p-1.5 rounded bg-accent-green-light text-accent-green hover:bg-accent-green hover:text-white transition-colors"
                title="Ouvrir"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(node);
                }}
                className="p-1.5 rounded bg-accent-blue-light text-accent-blue hover:bg-accent-blue hover:text-white transition-colors"
                title="Télécharger"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Enfants du dossier */}
        {node.type === "directory" && isExpanded && hasChildren && (
          <div className="ml-2">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <HardDrive className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-primary-800">
                    Explorateur de fichiers
                  </h1>
                  <p className="text-primary-600">
                    Gestion et visualisation des fichiers uploads
                  </p>
                </div>
              </div>
              <button
                onClick={loadFileTree}
                disabled={loading}
                className="button-primary flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Actualiser
              </button>
            </div>
          </div>

          {/* Statistiques */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="stat-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <File className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-primary-600 font-medium">
                      Total fichiers
                    </p>
                    <p className="text-3xl font-bold text-primary-800">
                      {data.totalFiles}
                    </p>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Folder className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-primary-600 font-medium">
                      Total dossiers
                    </p>
                    <p className="text-3xl font-bold text-primary-800">
                      {data.totalDirectories}
                    </p>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-primary-600 font-medium">
                      Taille totale
                    </p>
                    <p className="text-3xl font-bold text-primary-800">
                      {data.totalFiles > 0 ? "Calcul..." : "0 B"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panneau de recherche et arborescence */}
            <div className="lg:col-span-2 space-y-4">
              {/* Barre de recherche */}
              <div className="card-elevated p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un fichier ou dossier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-primary-800 placeholder-primary-400 bg-primary-50"
                  />
                </div>
              </div>

              {/* Arborescence */}
              <div className="card-elevated overflow-hidden">
                <div className="p-4 border-b border-primary-200 bg-primary-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-primary-800">
                      Arborescence des fichiers
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-primary-600">
                      <span>{data?.totalFiles || 0} fichiers</span>
                      <span>•</span>
                      <span>{data?.totalDirectories || 0} dossiers</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 max-h-[500px] overflow-y-auto bg-primary-50">
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="ml-2 text-slate-600">Chargement...</span>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4">
                      <p className="text-red-800">{error}</p>
                      <button
                        onClick={loadFileTree}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                      >
                        Réessayer
                      </button>
                    </div>
                  )}

                  {filteredTree.length > 0 && !loading && (
                    <div className="p-2">
                      {filteredTree.map((node) => renderNode(node))}
                    </div>
                  )}

                  {filteredTree.length === 0 && !loading && !error && (
                    <div className="p-8 text-center">
                      <File className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">
                        {searchTerm
                          ? "Aucun résultat trouvé"
                          : "Aucun fichier trouvé"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panneau de détails */}
            <div className="space-y-4">
              <div className="card-elevated overflow-hidden">
                <div className="p-4 border-b border-primary-200 bg-primary-50">
                  <h3 className="font-semibold text-primary-800">
                    Détails du fichier
                  </h3>
                </div>
                <div className="p-4">
                  {selectedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(selectedFile)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className="font-semibold text-slate-800 truncate"
                            title={selectedFile.name}
                          >
                            {selectedFile.name}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {selectedFile.type === "file"
                              ? "Fichier"
                              : "Dossier"}
                            {selectedFile.size &&
                              ` • ${formatFileSize(selectedFile.size)}`}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-slate-700">
                            Chemin complet
                          </label>
                          <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded border font-mono break-all overflow-hidden">
                            <span
                              className="block truncate"
                              title={`uploads/${selectedFile.path}`}
                            >
                              uploads/{selectedFile.path}
                            </span>
                          </div>
                        </div>

                        {selectedFile.extension && (
                          <div>
                            <label className="text-sm font-medium text-slate-700">
                              Extension
                            </label>
                            <p className="text-sm text-slate-600 truncate">
                              {selectedFile.extension}
                            </p>
                          </div>
                        )}

                        {selectedFile.size && (
                          <div>
                            <label className="text-sm font-medium text-slate-700">
                              Taille
                            </label>
                            <p className="text-sm text-slate-600">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        )}

                        {selectedFile.modifiedAt && (
                          <div>
                            <label className="text-sm font-medium text-slate-700">
                              Dernière modification
                            </label>
                            <p className="text-sm text-slate-600 truncate">
                              {new Date(selectedFile.modifiedAt).toLocaleString(
                                "fr-FR"
                              )}
                            </p>
                          </div>
                        )}

                        {selectedFile.type === "directory" &&
                          selectedFile.children && (
                            <div>
                              <label className="text-sm font-medium text-slate-700">
                                Contenu
                              </label>
                              <p className="text-sm text-slate-600">
                                {selectedFile.children.length} élément
                                {selectedFile.children.length > 1 ? "s" : ""}
                              </p>
                            </div>
                          )}
                      </div>

                      {selectedFile.type === "file" && (
                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={() => {
                              console.log("Prévisualiser:", selectedFile);
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Prévisualiser
                          </button>
                          <button
                            onClick={() => {
                              console.log("Télécharger:", selectedFile);
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Télécharger
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <File className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">
                        Sélectionnez un fichier pour voir ses détails
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de prévisualisation */}
        {isPreviewOpen && previewFile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header du modal */}
              <div className="p-6 border-b border-primary-200 bg-primary-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      {getFileIcon(previewFile, "md")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2
                        className="text-xl font-bold text-primary-800 truncate"
                        title={previewFile.name}
                      >
                        {previewFile.name}
                      </h2>
                      <p className="text-sm text-primary-600">
                        {formatFileSize(previewFile.size)} •{" "}
                        {previewFile.extension?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenFile(previewFile)}
                      className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded-lg transition-colors"
                      title="Ouvrir dans un nouvel onglet"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(previewFile)}
                      className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded-lg transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                        }
                        setIsPreviewOpen(false);
                        setPreviewFile(null);
                        setPreviewUrl(null);
                      }}
                      className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Contenu de prévisualisation */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {previewUrl && (
                  <div className="w-full h-full flex items-center justify-center">
                    {previewFile.extension?.toLowerCase() === ".pdf" ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-[600px] border border-primary-200 rounded-lg"
                        title={`Prévisualisation de ${previewFile.name}`}
                      />
                    ) : previewFile.extension
                        ?.toLowerCase()
                        .match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/) ? (
                      <img
                        src={previewUrl}
                        alt={previewFile.name}
                        className="max-w-full max-h-full object-contain border border-primary-200 rounded-lg"
                      />
                    ) : previewFile.extension
                        ?.toLowerCase()
                        .match(/\.(txt|md)$/) ? (
                      <div className="w-full h-[600px] border border-primary-200 rounded-lg bg-primary-50 p-4 overflow-auto">
                        <pre className="text-sm text-primary-800 whitespace-pre-wrap font-mono">
                          {/* Le contenu sera chargé via fetch */}
                          Chargement du contenu...
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <File className="w-16 h-16 text-primary-300 mx-auto mb-4" />
                        <p className="text-primary-600 font-medium">
                          Prévisualisation non disponible
                        </p>
                        <p className="text-sm text-primary-500 mt-1">
                          Ce type de fichier ne peut pas être prévisualisé
                        </p>
                        <button
                          onClick={() => handleOpenFile(previewFile)}
                          className="mt-4 button-primary"
                        >
                          Ouvrir le fichier
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}

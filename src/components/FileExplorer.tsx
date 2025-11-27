"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Folder,
  FolderOpen,
  File,
  FileText,
  Image,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  HardDrive,
  BarChart3,
  X,
  Eye,
  Download,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

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

interface FileExplorerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FileExplorer({ isOpen, onClose }: FileExplorerProps) {
  const [data, setData] = useState<FileExplorerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

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
    } catch (error) {
      console.error("Erreur lors du chargement de l'arborescence:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadFileTree();
    }
  }, [isOpen, loadFileTree]);

  // Fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

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

  const getFileIcon = (node: FileNode) => {
    if (node.type === "directory") {
      return expandedNodes.has(node.path) ? (
        <FolderOpen className="w-4 h-4 text-blue-500" />
      ) : (
        <Folder className="w-4 h-4 text-blue-500" />
      );
    }

    const ext = node.extension?.toLowerCase();
    switch (ext) {
      case ".pdf":
        return <File className="w-4 h-4 text-red-500" />;
      case ".jpg":
      case ".jpeg":
      case ".png":
      case ".gif":
      case ".webp":
        return <Image className="w-4 h-4 text-green-500" />;
      case ".txt":
      case ".md":
        return <FileText className="w-4 h-4 text-gray-500" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
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

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    const indent = level * 20;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-slate-100 cursor-pointer rounded transition-colors ${
            selectedFile?.path === node.path
              ? "bg-blue-50 border-l-2 border-blue-500"
              : ""
          }`}
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => {
            if (node.type === "directory") {
              toggleNode(node.path);
            }
            setSelectedFile(node);
          }}
        >
          {node.type === "directory" && hasChildren && (
            <div className="mr-1">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-slate-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-500" />
              )}
            </div>
          )}
          {node.type === "directory" && !hasChildren && (
            <div className="w-3 mr-1" />
          )}

          <div className="mr-2 flex-shrink-0">{getFileIcon(node)}</div>

          <div className="flex-1 min-w-0">
            <span className="text-sm text-slate-800 truncate">{node.name}</span>
          </div>

          {node.type === "file" && node.size && (
            <span className="text-xs text-slate-500 ml-2">
              {formatFileSize(node.size)}
            </span>
          )}
        </div>

        {node.type === "directory" && isExpanded && hasChildren && (
          <div>
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Explorateur de fichiers
                </h2>
                <p className="text-sm text-slate-600">
                  Arborescence du dossier uploads
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadFileTree}
                disabled={loading}
                className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar - Arborescence */}
          <div className="w-1/2 border-r border-slate-200 overflow-y-auto">
            <div className="p-4">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-slate-600">Chargement...</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                  <button
                    onClick={loadFileTree}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              {data && !loading && (
                <>
                  {/* Statistiques */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">
                          {data.totalFiles} fichier
                          {data.totalFiles > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Folder className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">
                          {data.totalDirectories} dossier
                          {data.totalDirectories > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Arborescence */}
                  <div className="space-y-1">
                    {data.tree.map((node) => renderNode(node))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Main content - Détails du fichier sélectionné */}
          <div className="w-1/2 p-4">
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    {getFileIcon(selectedFile)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {selectedFile.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {selectedFile.type === "file" ? "Fichier" : "Dossier"}
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
                    <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border font-mono">
                      uploads/{selectedFile.path}
                    </p>
                  </div>

                  {selectedFile.extension && (
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Extension
                      </label>
                      <p className="text-sm text-slate-600">
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
                      <p className="text-sm text-slate-600">
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

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      // Ici on pourrait implémenter la prévisualisation
                      console.log("Prévisualiser:", selectedFile);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Prévisualiser
                  </button>
                  <button
                    onClick={() => {
                      // Ici on pourrait implémenter le téléchargement
                      console.log("Télécharger:", selectedFile);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <File className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">
                    Sélectionnez un fichier pour voir ses détails
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, FileText, Eye, File, Music, Loader2 } from "lucide-react";
import { getFileApiUrl, getMimeTypeFromExtension } from "./fileUtils";

type FileWithMimeType = {
  id: string;
  file_path: string;
  mime_type?: string;
};

interface FileViewerModalProps {
  file: FileWithMimeType | null;
  onClose: () => void;
}

export default function FileViewerModal({
  file,
  onClose,
}: FileViewerModalProps) {
  const [fileBlobUrl, setFileBlobUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const loadFileWithAuth = useCallback(async (fileToLoad: FileWithMimeType) => {
    setLoadingFile(true);
    setFileError(null);

    try {
      const fileUrl = getFileApiUrl(fileToLoad.file_path);

      const token = sessionStorage.getItem("auth-token");
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      const response = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      const fileName = fileToLoad.file_path.split("/").pop() || "";
      const extension = fileName.split(".").pop()?.toLowerCase() || "";
      const responseContentType = response.headers.get("content-type");
      const fileMimeType = fileToLoad.mime_type;
      const extensionMimeType = getMimeTypeFromExtension(extension);

      let contentType =
        responseContentType || fileMimeType || extensionMimeType;

      if (extension === "pdf" || fileName.toLowerCase().endsWith(".pdf")) {
        contentType = "application/pdf";
      }

      const typedBlob = new Blob([blob], { type: contentType });
      const blobUrl = URL.createObjectURL(typedBlob);

      setFileBlobUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return blobUrl;
      });
    } catch (error) {
      console.error("Erreur lors du chargement du fichier:", error);
      setFileError(
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement du fichier"
      );
    } finally {
      setLoadingFile(false);
    }
  }, []);

  useEffect(() => {
    if (file) {
      loadFileWithAuth(file);
    } else {
      setFileBlobUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return null;
      });
    }
  }, [file, loadFileWithAuth]);

  useEffect(() => {
    return () => {
      setFileBlobUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return null;
      });
    };
  }, []);

  if (!file) return null;

  const handleClose = () => {
    if (fileBlobUrl) {
      URL.revokeObjectURL(fileBlobUrl);
      setFileBlobUrl(null);
    }
    setFileError(null);
    onClose();
  };

  const mimeType = file.mime_type || "";
  const fileName = file.file_path.split("/").pop() || "Fichier";
  const extension = fileName.split(".").pop()?.toLowerCase();

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-primary-300 bg-primary-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary-900">{fileName}</h3>
              <p className="text-sm text-primary-700 mt-1">
                {file.mime_type || "Type de fichier inconnu"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-primary-700 hover:text-primary-900 hover:bg-primary-200 rounded-lg transition-colors border-2 border-primary-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {loadingFile ? (
            <div className="flex flex-col items-center justify-center h-[70vh]">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
              <p className="text-primary-800 font-semibold">
                Chargement du fichier...
              </p>
            </div>
          ) : fileError ? (
            <div className="flex flex-col items-center justify-center h-[70vh]">
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mb-4">
                <File className="w-8 h-8 text-error-600" />
              </div>
              <p className="text-error-700 font-semibold mb-2">
                Erreur de chargement
              </p>
              <p className="text-sm text-error-600 mb-4">{fileError}</p>
              <button
                onClick={() => loadFileWithAuth(file)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                Réessayer
              </button>
            </div>
          ) : fileBlobUrl ? (
            (() => {
              // Images
              if (
                mimeType.startsWith("image/") ||
                ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(
                  extension || ""
                )
              ) {
                return (
                  <div className="text-center">
                    <Image
                      src={fileBlobUrl}
                      alt={fileName}
                      width={1200}
                      height={800}
                      className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-xl"
                      unoptimized
                    />
                  </div>
                );
              }

              // PDF
              if (mimeType === "application/pdf" || extension === "pdf") {
                return (
                  <div className="w-full">
                    <div className="h-[70vh] mb-4 bg-gray-100 rounded-lg border-2 border-primary-300 overflow-hidden">
                      <embed
                        src={`${fileBlobUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                        type="application/pdf"
                        className="w-full h-full"
                        title={fileName}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <a
                        href={fileBlobUrl}
                        download={fileName}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold shadow-lg"
                      >
                        <FileText className="w-5 h-5" />
                        Télécharger le PDF
                      </a>
                      <button
                        onClick={() => {
                          window.open(fileBlobUrl, "_blank");
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-100 text-primary-700 border-2 border-primary-300 rounded-xl hover:bg-primary-200 transition-colors font-semibold"
                      >
                        <Eye className="w-5 h-5" />
                        Ouvrir dans un nouvel onglet
                      </button>
                    </div>
                  </div>
                );
              }

              // Videos
              if (
                mimeType.startsWith("video/") ||
                ["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(
                  extension || ""
                )
              ) {
                return (
                  <div className="text-center">
                    <video
                      src={fileBlobUrl}
                      controls
                      className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-xl"
                    >
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  </div>
                );
              }

              // Audio
              if (
                mimeType.startsWith("audio/") ||
                ["mp3", "wav", "ogg", "flac", "aac"].includes(extension || "")
              ) {
                return (
                  <div className="text-center p-12">
                    <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Music className="w-16 h-16 text-primary-600" />
                    </div>
                    <audio
                      src={fileBlobUrl}
                      controls
                      className="w-full max-w-md mx-auto"
                    >
                      Votre navigateur ne supporte pas la lecture audio.
                    </audio>
                    <p className="text-primary-800 font-semibold mt-4">
                      {fileName}
                    </p>
                  </div>
                );
              }

              // Text files
              if (
                mimeType.includes("text/") ||
                ["txt", "md", "json", "xml", "html", "css", "js", "csv"].includes(
                  extension || ""
                )
              ) {
                return (
                  <div className="bg-white rounded-lg p-6 border-2 border-primary-300">
                    <p className="text-sm text-primary-700 mb-4 font-semibold">
                      Aperçu du fichier texte
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 border border-primary-200 max-h-[60vh] overflow-auto">
                      <a
                        href={fileBlobUrl}
                        download={fileName}
                        className="text-primary-600 hover:text-primary-800 underline font-semibold"
                      >
                        Cliquez ici pour télécharger le fichier
                      </a>
                    </div>
                  </div>
                );
              }

              // Other file types
              return (
                <div className="text-center p-12">
                  <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <File className="w-16 h-16 text-primary-600" />
                  </div>
                  <p className="text-primary-800 font-semibold mb-4">
                    Aperçu non disponible pour ce type de fichier
                  </p>
                  <p className="text-sm text-primary-700 mb-6">{fileName}</p>
                  <a
                    href={fileBlobUrl}
                    download={fileName}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold shadow-lg"
                  >
                    <FileText className="w-5 h-5" />
                    Télécharger le fichier
                  </a>
                </div>
              );
            })()
          ) : null}
        </div>
      </div>
    </div>
  );
}


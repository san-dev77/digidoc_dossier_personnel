"use client";

import Image from "next/image";
import { X, File, FileText } from "lucide-react";

interface FilePreviewModalProps {
  file: File | null;
  onClose: () => void;
}

export default function FilePreviewModal({
  file,
  onClose,
}: FilePreviewModalProps) {
  if (!file) return null;

  const fileUrl = URL.createObjectURL(file);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-primary-200">
          <h3
            className="text-xl font-bold text-primary-800 truncate max-w-2xl"
            title={file.name}
          >
            {file.name.length > 40
              ? `${file.name.substring(0, 37)}...`
              : file.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {file.type.startsWith("image/") ? (
            <div className="text-center">
              <Image
                src={fileUrl}
                alt={file.name}
                width={800}
                height={600}
                className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-lg"
                unoptimized
              />
            </div>
          ) : file.type === "application/pdf" ? (
            <div className="text-center">
              <iframe
                src={fileUrl}
                className="w-full h-[70vh] rounded-lg border"
                title={file.name}
              />
            </div>
          ) : file.type.startsWith("text/") ? (
            <div className="bg-primary-50 rounded-lg p-4">
              <p className="text-sm text-primary-600 mb-2">
                Aperçu du fichier texte
              </p>
              <pre className="bg-white p-4 rounded border border-primary-200 overflow-auto max-h-[60vh] text-sm">
                Aperçu non disponible pour ce type de fichier
              </pre>
            </div>
          ) : (
            <div className="text-center p-12">
              <File className="w-16 h-16 text-primary-400 mx-auto mb-4" />
              <p className="text-primary-600">
                Aperçu non disponible pour ce type de fichier
              </p>
              <p className="text-sm text-primary-500 mt-2">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


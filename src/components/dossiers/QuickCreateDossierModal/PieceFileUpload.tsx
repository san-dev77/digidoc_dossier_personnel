"use client";

import Image from "next/image";
import { UploadCloud, Eye, FileText, File, X } from "lucide-react";

interface PieceFileUploadProps {
  pieceId: string;
  files: File[];
  onFileChange: (pieceId: string, files: FileList | null) => void;
  onDrop: (pieceId: string, e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onRemoveFile: (pieceId: string, fileIndex: number) => void;
  onPreviewFile: (file: File, pieceId: string) => void;
  formatFileSize: (bytes: number) => string;
}

export default function PieceFileUpload({
  pieceId,
  files,
  onFileChange,
  onDrop,
  onDragOver,
  onRemoveFile,
  onPreviewFile,
  formatFileSize,
}: PieceFileUploadProps) {
  return (
    <div
      className="mt-4 pl-8 space-y-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div>
        <label className="block text-sm font-bold text-primary-900 mb-3">
          Fichiers pour cette pièce
        </label>
        <label className="block w-full">
          <div
            onDrop={(e) => onDrop(pieceId, e)}
            onDragOver={onDragOver}
            className="flex items-center justify-center w-full px-4 py-8 border-4 border-dashed border-primary-500 rounded-xl bg-primary-100 hover:bg-primary-200 hover:border-primary-700 transition-all cursor-pointer"
          >
            <div className="flex flex-col items-center gap-3">
              <UploadCloud className="w-10 h-10 text-primary-800" />
              <span className="text-primary-900 font-bold text-base">
                Cliquez pour sélectionner des fichiers
              </span>
              <span className="text-sm text-primary-800 font-medium">
                ou glissez-déposez ici
              </span>
            </div>
          </div>
          <input
            type="file"
            multiple
            onChange={(e) => onFileChange(pieceId, e.target.files)}
            className="hidden"
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((file, idx) => {
            const isImage = file.type.startsWith("image/");
            const isPdf = file.type === "application/pdf";
            const fileUrl = URL.createObjectURL(file);

            return (
              <div
                key={idx}
                className="relative group border-2 border-primary-200 rounded-lg overflow-hidden bg-white hover:border-primary-400 transition-all"
              >
                {isImage ? (
                  <div className="relative aspect-square">
                    <Image
                      src={fileUrl}
                      alt={file.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button
                        onClick={() => onPreviewFile(file, pieceId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 rounded-lg hover:bg-white"
                      >
                        <Eye className="w-5 h-5 text-primary-700" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex flex-col items-center justify-center min-h-[120px]">
                    {isPdf ? (
                      <FileText className="w-12 h-12 text-error-500 mb-2" />
                    ) : (
                      <File className="w-12 h-12 text-primary-500 mb-2" />
                    )}
                    <p className="text-xs text-center text-primary-700 font-medium truncate w-full px-2">
                      {file.name}
                    </p>
                    <p className="text-xs text-primary-500 mt-1">
                      {formatFileSize(file.size)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewFile(file, pieceId);
                      }}
                      className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition-colors border-2 border-primary-700"
                    >
                      <Eye className="w-3 h-3 inline mr-1" />
                      Prévisualiser
                    </button>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(pieceId, idx);
                  }}
                  className="absolute top-2 right-2 p-1 bg-error-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


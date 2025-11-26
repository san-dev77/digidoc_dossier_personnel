"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText, Video, Music, Table, File, Image as ImageIcon } from "lucide-react";
import { getFileApiUrl } from "./fileUtils";

type FileWithMimeType = {
  id: string;
  file_path: string;
  mime_type?: string;
};

interface FilePreviewProps {
  file: FileWithMimeType;
  fileName: string;
}

export default function FilePreview({ file, fileName }: FilePreviewProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getFileApiUrl(file.file_path);

  const mimeType = file.mime_type || "";
  const extension = fileName.split(".").pop()?.toLowerCase();

  // Pour les images - afficher la vraie image
  if (
    mimeType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(
      extension || ""
    )
  ) {
    return (
      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 relative">
        {!imageError ? (
          <Image
            src={imageUrl}
            alt={fileName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            width={100}
            height={100}
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-green-600" />
          </div>
        )}
      </div>
    );
  }

  // Pour les PDF
  if (mimeType === "application/pdf" || extension === "pdf") {
    return (
      <div className="w-16 h-16 rounded-lg border border-gray-200 bg-white flex flex-col items-center justify-center p-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100"></div>
        <FileText className="w-8 h-8 text-red-600 relative z-10" />
        <div className="text-xs text-red-600 font-bold mt-1 relative z-10">
          PDF
        </div>
      </div>
    );
  }

  // Pour les fichiers texte
  if (
    mimeType.includes("text/") ||
    ["txt", "md", "json", "xml", "html", "css", "js", "csv"].includes(
      extension || ""
    )
  ) {
    return (
      <div className="w-16 h-16 rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="p-1 text-xs text-gray-700 leading-tight h-full flex flex-col justify-center">
          <div className="font-mono truncate text-center">
            {fileName.length > 10 ? fileName.substring(0, 10) + "..." : fileName}
          </div>
          <div className="text-gray-500 mt-1 text-center font-semibold">
            {extension?.toUpperCase() || "TXT"}
          </div>
        </div>
      </div>
    );
  }

  // Pour les vidéos
  if (
    mimeType.startsWith("video/") ||
    ["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(extension || "")
  ) {
    return (
      <div className="w-16 h-16 rounded-lg border border-gray-200 bg-white flex flex-col items-center justify-center p-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100"></div>
        <Video className="w-8 h-8 text-purple-600 relative z-10" />
        <div className="text-xs text-purple-600 font-bold mt-1 relative z-10">
          VID
        </div>
      </div>
    );
  }

  // Pour les fichiers audio
  if (
    mimeType.startsWith("audio/") ||
    ["mp3", "wav", "ogg", "flac", "aac"].includes(extension || "")
  ) {
    return (
      <div className="w-16 h-16 rounded-lg border border-gray-200 bg-white flex flex-col items-center justify-center p-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100"></div>
        <Music className="w-8 h-8 text-orange-600 relative z-10" />
        <div className="text-xs text-orange-600 font-bold mt-1 relative z-10">
          AUD
        </div>
      </div>
    );
  }

  // Pour les tableurs
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(extension || "")
  ) {
    return (
      <div className="w-16 h-16 rounded-lg border border-gray-200 bg-white flex flex-col items-center justify-center p-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100"></div>
        <Table className="w-8 h-8 text-green-600 relative z-10" />
        <div className="text-xs text-green-600 font-bold mt-1 relative z-10">
          {extension?.toUpperCase() || "XLS"}
        </div>
      </div>
    );
  }

  // Pour les autres types
  return (
    <div className="w-16 h-16 rounded-lg border border-gray-200 bg-white flex flex-col items-center justify-center p-2 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"></div>
      <File className="w-8 h-8 text-gray-600 relative z-10" />
      <div className="text-xs text-gray-600 font-bold mt-1 relative z-10">
        {extension?.toUpperCase() || "FILE"}
      </div>
    </div>
  );
}


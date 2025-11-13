"use client";

import { Upload } from "lucide-react";

interface FullScreenLoaderProps {
  isOpen: boolean;
  message?: string;
}

export default function FullScreenLoader({
  isOpen,
  message = "Traitement en cours...",
}: FullScreenLoaderProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Icône animée */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-700 rounded-full animate-ping opacity-75"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg">
            <Upload className="w-12 h-12 text-white animate-bounce" />
          </div>
        </div>

        {/* Message */}
        <h3 className="text-2xl font-bold text-slate-900 mb-3">{message}</h3>
        <p className="text-slate-600 mb-6">
          Veuillez patienter, ne fermez pas cette fenêtre...
        </p>

        {/* Barre de progression animée */}
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700 animate-progress"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}


"use client";

import { Loader2 } from "lucide-react";

interface PieceLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function PieceLoader({ size = "md", className = "" }: PieceLoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Chargement en cours"
    >
      <div className="relative">
        {/* Cercle de fond */}
        <div className="absolute inset-0 rounded-full border-2 border-primary-200"></div>
        {/* Spinner animé */}
        <Loader2
          className={`${sizeClasses[size]} text-primary-600 animate-spin`}
          aria-hidden="true"
        />
      </div>
      <span className="sr-only">Chargement en cours...</span>
    </div>
  );
}


"use client";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export default function Loader({
  size = "md",
  text,
  className = "",
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className="relative">
        {/* Cercle de fond */}
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-gray-200`}
        ></div>

        {/* Cercle animé */}
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-transparent border-t-primary-600 border-r-primary-600 animate-spin absolute top-0 left-0`}
        ></div>
      </div>

      {text && (
        <p className={`text-gray-600 font-medium ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
}

// Loader pour les boutons
export function ButtonLoader({ size = "sm" }: { size?: "sm" | "md" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-2 border-transparent border-t-white border-r-white animate-spin`}
    ></div>
  );
}

// Loader pour les overlays
export function OverlayLoader({ text = "Chargement..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm mx-4">
        <Loader size="lg" text={text} />
      </div>
    </div>
  );
}

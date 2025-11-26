"use client";

import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme, ThemeName } from "@/styles/theme-utils";

export default function ThemeSwitcher() {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeColors: Record<ThemeName, string> = {
    slate: "#64748b",
    blue: "#3b82f6",
    emerald: "#10b981",
    purple: "#a855f7",
  };

  const themeNames: Record<ThemeName, string> = {
    slate: "Slate",
    blue: "Blue",
    emerald: "Emerald",
    purple: "Purple",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg border border-primary-300 hover:bg-primary-50 transition-colors group"
        title="Changer le thème"
      >
        <Palette className="w-4 h-4 text-primary-600 group-hover:text-primary-700" />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-primary-200 z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-primary-600 uppercase tracking-wider">
                Thèmes
              </div>
              {availableThemes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => {
                    setTheme(theme);
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full border border-primary-200"
                      style={{ backgroundColor: themeColors[theme] }}
                    />
                    <span>{themeNames[theme]}</span>
                  </div>
                  {currentTheme === theme && (
                    <Check className="w-4 h-4 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { initializeTheme } from "@/styles/theme-utils";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialiser le thème au chargement de l'application
    initializeTheme();
  }, []);

  return <>{children}</>;
}

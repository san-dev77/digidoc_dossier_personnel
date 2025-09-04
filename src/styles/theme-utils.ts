// Utilitaires pour la gestion des thèmes
// Ce fichier permet de changer facilement le thème de l'application

export type ThemeName = "slate" | "blue" | "emerald" | "purple";

export interface Theme {
  name: string;
  colors: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

// Thèmes prédéfinis
export const themes: Record<ThemeName, Theme> = {
  slate: {
    name: "Slate",
    colors: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },
  blue: {
    name: "Blue",
    colors: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
  },
  emerald: {
    name: "Emerald",
    colors: {
      50: "#ecfdf5",
      100: "#d1fae5",
      200: "#a7f3d0",
      300: "#6ee7b7",
      400: "#34d399",
      500: "#10b981",
      600: "#059669",
      700: "#047857",
      800: "#065f46",
      900: "#064e3b",
    },
  },
  purple: {
    name: "Purple",
    colors: {
      50: "#faf5ff",
      100: "#f3e8ff",
      200: "#e9d5ff",
      300: "#d8b4fe",
      400: "#c084fc",
      500: "#a855f7",
      600: "#9333ea",
      700: "#7c3aed",
      800: "#6b21a8",
      900: "#581c87",
    },
  },
};

// Fonction pour appliquer un thème
export const applyTheme = (themeName: ThemeName) => {
  const theme = themes[themeName];
  const root = document.documentElement;

  // Appliquer les variables CSS
  Object.entries(theme.colors).forEach(([shade, color]) => {
    root.style.setProperty(`--color-primary-${shade}`, color);
  });

  // Sauvegarder le thème dans le localStorage
  localStorage.setItem("app-theme", themeName);
};

// Fonction pour récupérer le thème actuel
export const getCurrentTheme = (): ThemeName => {
  if (typeof window === "undefined") return "slate";
  return (localStorage.getItem("app-theme") as ThemeName) || "slate";
};

// Fonction pour initialiser le thème au chargement
export const initializeTheme = () => {
  if (typeof window === "undefined") return;

  const savedTheme = getCurrentTheme();
  applyTheme(savedTheme);
};

// Classes CSS prédéfinies pour chaque thème
export const getThemeClasses = (themeName: ThemeName) => {
  const theme = themes[themeName];

  return {
    // Backgrounds
    bg: {
      primary: `bg-primary-500`,
      primaryHover: `hover:bg-primary-600`,
      primaryLight: `bg-primary-100`,
      primaryDark: `bg-primary-800`,
      gradient: `bg-gradient-primary`,
    },

    // Text colors
    text: {
      primary: `text-primary-700`,
      primaryLight: `text-primary-600`,
      primaryDark: `text-primary-900`,
      onPrimary: `text-primary-50`,
    },

    // Borders
    border: {
      primary: `border-primary-300`,
      primaryFocus: `focus:border-primary-500`,
      primaryLight: `border-primary-200`,
    },

    // Shadows
    shadow: {
      primary: `shadow-primary`,
      primaryLg: `shadow-primary-lg`,
    },
  };
};

// Hook React pour gérer les thèmes (optionnel)
export const useTheme = () => {
  const currentTheme = getCurrentTheme();

  const setTheme = (themeName: ThemeName) => {
    applyTheme(themeName);
  };

  return {
    currentTheme,
    setTheme,
    availableThemes: Object.keys(themes) as ThemeName[],
  };
};

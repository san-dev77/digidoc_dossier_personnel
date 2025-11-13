"use client";

import { useState } from "react";
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import ThemeSwitcher from "./ThemeSwitcher";

export default function TopBar() {
  const { logout } = useAuth();
  const { user, fullName, fonction } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Débogage: afficher les infos utilisateur dans la console
  // Décommentez ce code pour déboguer les problèmes de session utilisateur
  /*
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("=== DÉBOGAGE SESSION UTILISATEUR ===");
      const sessionData = sessionStorage.getItem("auth-session");
      console.log("📦 SessionStorage 'auth-session' (raw):", sessionData);
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          console.log("✅ Données parsées complètes:", parsed);
          console.log("👤 AppUser dans session:", parsed.state?.appUser);
          console.log("🔐 IsAuthenticated:", parsed.state?.isAuthenticated);
        } catch (error) {
          console.error("❌ Erreur de parsing:", error);
        }
      } else {
        console.warn("⚠️ Aucune donnée dans sessionStorage 'auth-session'");
      }
      console.log("👤 User depuis hook useUser():", user);
      console.log("📝 Nom complet:", fullName);
      console.log("💼 Fonction:", fonction);
      console.log("===================================");
    }
  }, [user, fullName, fonction]);
  */

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const notifications = [
    {
      id: 1,
      title: "Nouveau dossier créé",
      message: "Le dossier de Jean Dupont a été créé avec succès",
      time: "Il y a 5 minutes",
      unread: true,
    },
    {
      id: 2,
      title: "Document validé",
      message: "Le document CNI-001 a été validé",
      time: "Il y a 1 heure",
      unread: true,
    },
    {
      id: 3,
      title: "Rapport mensuel",
      message: "Le rapport mensuel est disponible",
      time: "Il y a 2 heures",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="bg-white border-b border-primary-300 shadow-primary">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Barre de recherche */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              className="block w-64 pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
            />
          </div>
        </div>

        {/* Actions utilisateur */}
        <div className="flex items-center space-x-4">
          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Notifications */}
          <div className="relative"></div>

          {/* Profil utilisateur */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center bg-primary-300 space-x-3 p-2.5 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-primary">
                <span className="text-sm font-bold text-white uppercase">
                  {fullName?.substring(0, 2) || "U"}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {fullName || "Utilisateur"}
                </p>
                <p className="text-xs font-bold text-gray-600">
                  {fonction || "Utilisateur"}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {/* Dropdown profil */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-primary">
                      <span className="text-sm font-bold text-white uppercase">
                        {fullName?.substring(0, 2) || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {fullName || "Utilisateur"}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User className="w-4 h-4" />
                    <span>Mon profil</span>
                  </button>
                  <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Paramètres</span>
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

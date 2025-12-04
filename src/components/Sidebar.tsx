"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  HardDrive,
  Upload,
  Activity,
} from "lucide-react";
import { useState } from "react";
import logo from "@/app/assets/logo.png";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({
  isCollapsed = false,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(isCollapsed);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
    onToggle?.();
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
      description: "Vue d'ensemble",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    {
      name: "Personnels",
      href: "/agents",
      icon: Users,
      current: pathname.startsWith("/agents"),
      description: "Gestion des agents",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
    },
    {
      name: "Rubriques",
      href: "/rubriques",
      icon: Layers3,
      current: pathname.startsWith("/rubriques"),
      description: "Catégories de documents",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      borderColor: "border-purple-200",
    },
    {
      name: "Rapports",
      href: "/rapports",
      icon: BarChart3,
      current: pathname.startsWith("/rapports"),
      description: "Rapports de conformité",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-700",
      borderColor: "border-indigo-200",
    },
    {
      name: "Utilisateurs",
      href: "/utilisateurs",
      icon: Shield,
      current: pathname.startsWith("/utilisateurs"),
      description: "Accès & Permissions",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
    },
    {
      name: "Audit",
      href: "/audit",
      icon: Activity,
      current: pathname.startsWith("/audit"),
      description: "Stats & Historique",
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      textColor: "text-teal-700",
      borderColor: "border-teal-200",
    },
    {
      name: "Dossiers",
      href: "/dossiers",
      icon: FileText,
      current: pathname.startsWith("/dossiers"),
      description: "Archives et dossiers",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      borderColor: "border-orange-200",
    },
    {
      name: "Import",
      href: "/import",
      icon: Upload,
      current: pathname.startsWith("/import"),
      description: "Import de données en masse",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-cyan-50",
      textColor: "text-cyan-700",
      borderColor: "border-cyan-200",
    },
    {
      name: "Explorateur",
      href: "/explorateur",
      icon: HardDrive,
      current: pathname.startsWith("/explorateur"),
      description: "Explorateur de fichiers",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-slate-50",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
    },
  ];

  return (
    <div
      className={`bg-primary-800 border-r border-primary-700/60 transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      } flex flex-col h-full shadow-xl relative overflow-hidden`}
    >
      {/* Effet de brillance subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-transparent pointer-events-none"></div>

      {/* Header avec logo */}
      <div className="relative px-6 py-6 border-b border-primary-700/70 bg-primary-800/50">
        <div className="flex items-center justify-between gap-4">
          {!collapsed && (
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl p-2 overflow-hidden">
                  <Image
                    src={logo}
                    alt="DigiDoc Logo"
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black text-white tracking-tight">
                  DigiDoc
                </h1>
                <p className="text-sm text-primary-200 font-semibold">
                  Gestion du Personnel
                </p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center w-full">
              <div className="relative">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg ring-2 ring-primary-600/30 p-1.5 overflow-hidden">
                  <Image
                    src={logo}
                    alt="DigiDoc Logo"
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent-green rounded-full flex items-center justify-center shadow-sm ring-2 ring-primary-800">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="p-2 rounded-lg bg-primary-100 hover:bg-primary-600/70 transition-all duration-200 border border-primary-600/40 hover:border-primary-500/60 group flex-shrink-0"
              aria-label="Réduire la sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-primary-900 group-hover:text-white transition-colors" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={toggleCollapsed}
              className="absolute top-5 right-2 p-2 rounded-lg bg-primary-500 hover:bg-primary-600/70 transition-all duration-200 border border-primary-600/40 hover:border-primary-500/60 group"
              aria-label="Ouvrir la sidebar"
            >
              <ChevronRight className="w-4 h-4 text-primary-100 group-hover:text-white transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto sidebar-scrollbar">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center px-4 py-4 rounded-xl transition-all duration-200 ${
                collapsed ? "justify-center" : "gap-4"
              } ${
                item.current
                  ? `bg-gradient-to-r ${item.color} text-white shadow-xl`
                  : "text-primary-200 hover:text-white hover:bg-primary-700/70 border border-transparent hover:border-primary-600/40"
              }`}
            >
              {/* Indicateur actif */}
              {item.current && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1.5 h-12 bg-white rounded-r-full"></div>
              )}

              {/* Icône */}
              <div className="flex-shrink-0">
                <Icon
                  className={`w-6 h-6 ${
                    item.current
                      ? "text-white"
                      : "text-primary-300 group-hover:text-white"
                  } transition-all duration-200 ${item.current ? "" : "group-hover:scale-110"}`}
                />
              </div>

              {/* Labels */}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-bold text-base ${
                      item.current
                        ? "text-white"
                        : "text-white/90 group-hover:text-white"
                    } transition-colors duration-200`}
                  >
                    {item.name}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      item.current
                        ? "text-white/80"
                        : "text-primary-300 group-hover:text-white/70"
                    } transition-colors duration-200`}
                  >
                    {item.description}
                  </div>
                </div>
              )}

              {/* Tooltip amélioré pour mode collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-4 px-3 py-2.5 bg-primary-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-primary-700/70 backdrop-blur-sm">
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="text-xs text-primary-300 mt-0.5">
                    {item.description}
                  </div>
                  {/* Flèche du tooltip */}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1.5 w-3 h-3 bg-primary-800 rotate-45 border-l border-b border-primary-700/70"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer avec stats et version */}
      <div className="relative px-5 py-5 border-t border-primary-700/40 bg-primary-900/60 backdrop-blur-sm">
        {!collapsed ? (
          <div className="space-y-3">
            {/* Stats rapides avec meilleur contraste */}

            {/* Version et statut avec meilleur contraste */}
            <div className="flex items-center justify-between pt-2 ">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary-300" />
                <span className="text-xs text-primary-300 font-semibold">
                  v1.0.0
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent-green/10 rounded-md border border-accent-green/20">
                <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse"></div>
                <span className="text-xs text-accent-green font-semibold">
                  Online
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-accent-green/10 rounded-lg border border-accent-green/20">
              <Zap className="w-4 h-4 text-accent-green" />
            </div>
            <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}

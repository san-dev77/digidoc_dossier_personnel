"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Sparkles,
  Zap,
  Shield,
  Bell,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

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
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      current: pathname === "/notifications",
      description: "Centre de notifications et alertes",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      borderColor: "border-orange-200",
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
      name: "Pièces",
      href: "/pieces",
      icon: FolderOpen,
      current: pathname.startsWith("/pieces"),
      description: "Documents individuels",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-cyan-50",
      textColor: "text-cyan-700",
      borderColor: "border-cyan-200",
    },
    {
      name: "Paramètres",
      href: "/settings",
      icon: Settings,
      current: pathname.startsWith("/settings"),
      description: "Configuration",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
    },
  ];

  return (
    <div
      className={`bg-primary-800 border-r border-primary-600 transition-all duration-500 ${
        collapsed ? "w-20" : "w-64"
      } flex flex-col h-full shadow-2xl relative overflow-hidden`}
    >
      {/* Effet de brillance */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>

      {/* Header avec logo */}
      <div className="relative p-6 border-b border-primary-600/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg border border-primary-400/20">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-accent-green to-accent-green rounded-full flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">DigiDoc</h1>
                <p className="text-xs text-primary-200 font-medium">
                  Personnel Management
                </p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg border border-primary-400/20">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-accent-green to-accent-green rounded-full flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className="p-2 rounded-xl bg-primary-600/50 hover:bg-primary-500/50 transition-all duration-300 border border-primary-500/50 hover:border-primary-400/50 group"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-primary-200 group-hover:text-white transition-colors" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-primary-200 group-hover:text-white transition-colors" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                item.current
                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg border border-white/20`
                  : "text-primary-200 hover:text-white hover:bg-primary-600/50 hover:shadow-lg border border-transparent hover:border-primary-500/50"
              }`}
            >
              {/* Indicateur actif */}
              {item.current && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}

              <div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  item.current
                    ? "bg-white/20"
                    : "bg-primary-600/50 group-hover:bg-primary-500/50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${collapsed ? "mx-auto" : ""} ${
                    item.current
                      ? "text-white"
                      : "text-primary-300 group-hover:text-white"
                  } transition-colors`}
                />
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-sm ${
                      item.current
                        ? "text-white"
                        : "text-primary-100 group-hover:text-white"
                    } transition-colors`}
                  >
                    {item.name}
                  </div>
                  <div
                    className={`text-xs ${
                      item.current
                        ? "text-white/80"
                        : "text-primary-300 group-hover:text-primary-200"
                    } transition-colors`}
                  >
                    {item.description}
                  </div>
                </div>
              )}

              {/* Tooltip pour mode collapsed */}
              {collapsed && (
                <div className="absolute left-20 ml-3 px-4 py-3 bg-primary-800 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-primary-600/50">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-primary-300 mt-1">
                    {item.description}
                  </div>
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-primary-800 rotate-45 border-l border-b border-primary-600/50"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer avec stats et version */}
      <div className="relative p-4 border-t border-slate-700/50">
        {!collapsed ? (
          <div className="space-y-4">
            {/* Stats rapides */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary-600/30 rounded-xl p-3 border border-primary-500/30">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent-green rounded-full"></div>
                  <span className="text-xs text-primary-100 font-medium">
                    Actifs
                  </span>
                </div>
                <div className="text-lg font-bold text-white mt-1">24</div>
              </div>
              <div className="bg-primary-600/30 rounded-xl p-3 border border-primary-500/30">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                  <span className="text-xs text-primary-100 font-medium">
                    Docs
                  </span>
                </div>
                <div className="text-lg font-bold text-white mt-1">156</div>
              </div>
            </div>

            {/* Version */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-primary-300" />
                <span className="text-xs text-primary-300 font-medium">
                  v1.0.0
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-accent-green" />
                <span className="text-xs text-accent-green font-medium">
                  Online
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-accent-green" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

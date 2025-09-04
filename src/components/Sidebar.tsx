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
    },
    {
      name: "Personnels",
      href: "/agents",
      icon: Users,
      current: pathname.startsWith("/agents"),
    },
    {
      name: "Rubriques",
      href: "/rubriques",
      icon: Layers3,
      current: pathname.startsWith("/rubriques"),
    },
    {
      name: "Dossiers",
      href: "/dossiers",
      icon: FileText,
      current: pathname.startsWith("/dossiers"),
    },
    {
      name: "Pièces",
      href: "/pieces",
      icon: FolderOpen,
      current: pathname.startsWith("/pieces"),
    },
    {
      name: "Paramètres",
      href: "/settings",
      icon: Settings,
      current: pathname.startsWith("/settings"),
    },
  ];

  return (
    <div
      className={`bg-primary-50 border-r border-primary-300 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } flex flex-col h-full shadow-primary-lg`}
    >
      {/* Logo et bouton de collapse */}
      <div className="flex items-center justify-between p-4 border-b border-primary-300 bg-white">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-primary">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">DigiDoc</span>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-1.5 rounded-lg hover:bg-primary-200 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                item.current
                  ? "bg-primary-100 text-primary-700 border-r-3 border-primary-600 shadow-primary"
                  : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm"
              }`}
            >
              <Icon className={`w-5 h-5 ${collapsed ? "mx-auto" : ""}`} />
              {!collapsed && <span className="font-semibold">{item.name}</span>}
              {collapsed && (
                <div className="absolute left-16 ml-2 px-3 py-2 bg-primary-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-primary-lg">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer avec version */}
      {!collapsed && (
        <div className="p-4 border-t border-primary-300 bg-white">
          <div className="text-xs text-gray-600 text-center font-medium">
            DigiDoc Personnel v1.0
          </div>
        </div>
      )}
    </div>
  );
}

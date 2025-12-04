"use client";

import { useMemo } from "react";
import { useUser } from "./useUser";
import {
  Role,
  RolePermissions,
  ROLE_PERMISSIONS,
  hasPermission as checkPermission,
  canAccessRoute as checkRouteAccess,
  getRoleDisplayName,
  getRoleDescription,
} from "@/config/permissions";

/**
 * Hook personnalisé pour gérer les permissions utilisateur
 * @returns Objet contenant les fonctions et informations de permissions
 */
export function usePermissions() {
  const { user } = useUser();

  // Récupérer le rôle depuis user.roles.code (pour utilisateurs) ou user.role (pour agents legacy)
  const role = ((user?.roles?.code || user?.role) as Role) || "consultant";

  // Récupérer toutes les permissions de l'utilisateur
  const permissions = useMemo<RolePermissions | null>(() => {
    if (!user) return null;
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.consultant;
  }, [user, role]);

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  const hasPermission = useMemo(() => {
    return (
      resource: keyof RolePermissions,
      action: "create" | "read" | "update" | "delete" | "export" | "import"
    ) => {
      if (!user) return false;
      return checkPermission(role, resource, action);
    };
  }, [user, role]);

  /**
   * Vérifie si l'utilisateur peut accéder à une route
   */
  const canAccessRoute = useMemo(() => {
    return (route: string) => {
      if (!user) return false;
      return checkRouteAccess(role, route);
    };
  }, [user, role]);

  /**
   * Vérifie si l'utilisateur est admin (super_admin)
   */
  const isAdmin = useMemo(() => {
    return role === "super_admin";
  }, [role]);

  /**
   * Vérifie si l'utilisateur peut gérer d'autres utilisateurs
   */
  const canManageUsers = useMemo(() => {
    return role === "super_admin";
  }, [role]);

  /**
   * Vérifie si l'utilisateur peut supprimer des données
   */
  const canDelete = useMemo(() => {
    return role === "super_admin" || role === "admin_rh";
  }, [role]);

  /**
   * Vérifie si l'utilisateur peut modifier des agents
   */
  const canManageAgents = useMemo(() => {
    return ["super_admin", "admin_rh", "gestionnaire"].includes(role);
  }, [role]);

  /**
   * Vérifie si l'utilisateur est en lecture seule
   */
  const isReadOnly = useMemo(() => {
    return role === "consultant";
  }, [role]);

  /**
   * Obtient le nom d'affichage du rôle
   */
  const roleDisplayName = useMemo(() => {
    if (!user) return "";
    return getRoleDisplayName(role);
  }, [user, role]);

  /**
   * Obtient la description du rôle
   */
  const roleDescription = useMemo(() => {
    if (!user) return "";
    return getRoleDescription(role);
  }, [user, role]);

  return {
    // Informations utilisateur
    user,
    role,
    roleDisplayName,
    roleDescription,
    permissions,

    // Vérifications de permissions
    hasPermission,
    canAccessRoute,
    isAdmin,
    canManageUsers,
    canDelete,
    canManageAgents,
    isReadOnly,
  };
}

/**
 * Hook pour protéger des composants selon les permissions
 * Redirige vers /dashboard si l'utilisateur n'a pas la permission
 */
export function useRequirePermission(
  resource: keyof RolePermissions,
  action: "create" | "read" | "update" | "delete"
) {
  const { hasPermission, user } = usePermissions();

  const allowed = useMemo(() => {
    if (!user) return false;
    return hasPermission(resource, action);
  }, [user, hasPermission, resource, action]);

  return { allowed, loading: !user };
}

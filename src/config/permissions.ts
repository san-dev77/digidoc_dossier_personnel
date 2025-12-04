/**
 * Configuration des permissions par rôle
 * Définit ce que chaque rôle peut faire dans l'application
 */

export type Role = "super_admin" | "admin_rh" | "gestionnaire" | "consultant";

export interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export?: boolean;
  import?: boolean;
}

export interface RolePermissions {
  // Gestion des agents
  agents: Permission;
  // Gestion des rubriques
  rubriques: Permission;
  // Gestion des sous-dossiers
  sousDossiers: Permission;
  // Gestion des pièces
  pieces: Permission;
  // Gestion des métadonnées
  metadata: Permission;
  // Gestion des fichiers
  files: Permission;
  // Gestion des utilisateurs
  utilisateurs: Permission;
  // Gestion des rapports
  rapports: Permission;
  // Accès aux paramètres système
  settings: Permission;
  // Accès à l'audit
  audit: Permission;
}

/**
 * Permissions pour le rôle SUPER ADMIN
 * Accès complet à toutes les fonctionnalités
 */
const superAdminPermissions: RolePermissions = {
  agents: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: true,
  },
  rubriques: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: true,
  },
  sousDossiers: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: true,
  },
  pieces: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: true,
  },
  metadata: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: true,
  },
  files: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: true,
  },
  utilisateurs: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: false,
  },
  rapports: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: false,
  },
  settings: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: false,
    import: false,
  },
  audit: {
    create: false,
    read: true,
    update: false,
    delete: false,
    export: true,
    import: false,
  },
};

/**
 * Permissions pour le rôle ADMIN RH
 * Gestion complète des agents et dossiers, pas d'accès aux utilisateurs système
 */
const adminRHPermissions: RolePermissions = {
  agents: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: true,
  },
  rubriques: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: false,
  },
  sousDossiers: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: false,
  },
  pieces: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: true,
  },
  metadata: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: false,
  },
  files: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: true,
  },
  utilisateurs: {
    create: false,
    read: true,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
  rapports: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    import: false,
  },
  settings: {
    create: false,
    read: true,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
  audit: {
    create: false,
    read: true,
    update: false,
    delete: false,
    export: true,
    import: false,
  },
};

/**
 * Permissions pour le rôle GESTIONNAIRE
 * Création et modification limitée, pas de suppression
 */
const gestionnairePermissions: RolePermissions = {
  agents: {
    create: true,
    read: true,
    update: true,
    delete: false,
    export: true,
    import: false,
  },
  rubriques: {
    create: true,
    read: true,
    update: true,
    delete: false,
    export: true,
    import: false,
  },
  sousDossiers: {
    create: true,
    read: true,
    update: true,
    delete: false,
    export: true,
    import: false,
  },
  pieces: {
    create: true,
    read: true,
    update: true,
    delete: false,
    export: true,
    import: false,
  },
  metadata: {
    create: true,
    read: true,
    update: true,
    delete: false,
    export: true,
    import: false,
  },
  files: {
    create: true,
    read: true,
    update: true,
    delete: false,
    export: true,
    import: false,
  },
  utilisateurs: {
    create: false,
    read: false,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
  rapports: {
    create: true,
    read: true,
    update: false,
    delete: false,
    export: true,
    import: false,
  },
  settings: {
    create: false,
    read: true,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
  audit: {
    create: false,
    read: false,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
};

/**
 * Permissions pour le rôle CONSULTANT
 * Lecture seule, génération de rapports uniquement
 */
const consultantPermissions: RolePermissions = {
  agents: {
    create: false,
    read: true,
    update: false,
    delete: false,
    export: true,
    import: false,
  },
  rubriques: {
    create: false,
    read: true,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
  sousDossiers: {
    create: false,
    read: true,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
  pieces: {
    create: false,
    read: true,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
  metadata: {
    create: false,
    read: true,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
  files: {
    create: false,
    read: true,
    update: false,
    delete: false,
    export: true,
    import: false,
  },
  utilisateurs: {
    create: false,
    read: false,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
  rapports: {
    create: true,
    read: true,
    update: false,
    delete: false,
    export: true,
    import: false,
  },
  settings: {
    create: false,
    read: false,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
  audit: {
    create: false,
    read: false,
    update: false,
    delete: false,
    export: false,
    import: false,
  },
};

/**
 * Map des permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  super_admin: superAdminPermissions,
  admin_rh: adminRHPermissions,
  gestionnaire: gestionnairePermissions,
  consultant: consultantPermissions,
};

/**
 * Vérifie si un rôle a une permission spécifique
 */
export function hasPermission(
  role: Role,
  resource: keyof RolePermissions,
  action: keyof Permission
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions[action] === true;
}

/**
 * Vérifie si un utilisateur peut accéder à une route
 */
export function canAccessRoute(role: Role, route: string): boolean {
  // Routes accessibles par tous les rôles authentifiés
  const publicRoutes = ["/dashboard", "/profil"];
  if (publicRoutes.some((r) => route.startsWith(r))) return true;

  // Routes par rôle
  const routePermissions: Record<string, Role[]> = {
    "/utilisateurs": ["super_admin"],
    "/settings": ["super_admin", "admin_rh"],
    "/audit": ["super_admin", "admin_rh"],
    "/agents": ["super_admin", "admin_rh", "gestionnaire", "consultant"],
    "/dossiers": ["super_admin", "admin_rh", "gestionnaire", "consultant"],
    "/rubriques": ["super_admin", "admin_rh", "gestionnaire", "consultant"],
    "/rapports": ["super_admin", "admin_rh", "gestionnaire", "consultant"],
    "/import": ["super_admin", "admin_rh"],
  };

  for (const [routePrefix, allowedRoles] of Object.entries(routePermissions)) {
    if (route.startsWith(routePrefix)) {
      return allowedRoles.includes(role);
    }
  }

  return false;
}

/**
 * Obtient le nom d'affichage d'un rôle
 */
export function getRoleDisplayName(role: Role): string {
  const roleNames: Record<Role, string> = {
    super_admin: "Super Administrateur",
    admin_rh: "Administrateur RH",
    gestionnaire: "Gestionnaire",
    consultant: "Consultant",
  };
  return roleNames[role] || role;
}

/**
 * Obtient la description d'un rôle
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    super_admin: "Accès complet à toutes les fonctionnalités du système",
    admin_rh: "Gestion complète des agents et dossiers, accès aux rapports",
    gestionnaire:
      "Création et modification des dossiers, consultation des agents",
    consultant: "Consultation en lecture seule et génération de rapports",
  };
  return descriptions[role] || "";
}

/**
 * Liste de tous les rôles disponibles
 */
export const ALL_ROLES: Role[] = [
  "super_admin",
  "admin_rh",
  "gestionnaire",
  "consultant",
];

/**
 * Rôles qui peuvent gérer d'autres utilisateurs
 */
export const ADMIN_ROLES: Role[] = ["super_admin"];

/**
 * Rôles qui peuvent modifier les agents
 */
export const CAN_MANAGE_AGENTS_ROLES: Role[] = [
  "super_admin",
  "admin_rh",
  "gestionnaire",
];

/**
 * Rôles qui peuvent supprimer des données
 */
export const CAN_DELETE_ROLES: Role[] = ["super_admin", "admin_rh"];

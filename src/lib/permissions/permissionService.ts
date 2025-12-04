/**
 * Service de gestion des permissions
 * Gère la logique de vérification des permissions avec le système RBAC + overrides
 */

import { prisma } from "@/lib/prisma";

export interface UserPermissions {
  userId: number;
  roleId: number;
  roleName: string;
  permissions: string[]; // Liste des codes de permissions (ex: ["agents.create", "users.delete"])
}

/**
 * Récupère toutes les permissions effectives d'un utilisateur
 * (Permissions du rôle + overrides individuels)
 */
export async function getUserPermissions(
  userId: number
): Promise<UserPermissions | null> {
  // Récupérer l'utilisateur avec son rôle et permissions
  const user = await prisma.utilisateurs.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role_permissions: {
            include: {
              permissions: true,
            },
          },
        },
      },
      utilisateur_permissions: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!user) return null;

  // Permissions du rôle
  const rolePermissions = user.roles.role_permissions.map(
    (rp) => rp.permissions.code
  );

  // Permissions individuelles (overrides)
  const grants = user.utilisateur_permissions
    .filter((up) => up.type === "grant")
    .map((up) => up.permissions.code);

  const revokes = user.utilisateur_permissions
    .filter((up) => up.type === "revoke")
    .map((up) => up.permissions.code);

  // Calcul des permissions effectives :
  // Permissions du rôle + grants - revokes
  const effectivePermissions = [
    ...new Set([
      ...rolePermissions.filter((p: string) => !revokes.includes(p)), // Permissions du rôle sauf celles révoquées
      ...grants, // Ajout des permissions individuelles
    ]),
  ];

  return {
    userId: user.id,
    roleId: user.role_id,
    roleName: user.roles.nom,
    permissions: effectivePermissions,
  };
}

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export async function hasPermission(
  userId: number,
  permissionCode: string
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) return false;

  return userPerms.permissions.includes(permissionCode);
}

/**
 * Vérifie si un utilisateur a TOUTES les permissions données
 */
export async function hasAllPermissions(
  userId: number,
  permissionCodes: string[]
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) return false;

  return permissionCodes.every((code) => userPerms.permissions.includes(code));
}

/**
 * Vérifie si un utilisateur a AU MOINS UNE des permissions données
 */
export async function hasAnyPermission(
  userId: number,
  permissionCodes: string[]
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) return false;

  return permissionCodes.some((code) => userPerms.permissions.includes(code));
}

/**
 * Accorde une permission individuelle à un utilisateur
 */
export async function grantPermission(
  userId: number,
  permissionCode: string,
  grantedBy: number,
  reason?: string
): Promise<void> {
  const permission = await prisma.permissions.findUnique({
    where: { code: permissionCode },
  });

  if (!permission) {
    throw new Error(`Permission "${permissionCode}" n'existe pas`);
  }

  // Vérifier si un override existe déjà
  const existing = await prisma.utilisateur_permissions.findUnique({
    where: {
      utilisateur_id_permission_id: {
        utilisateur_id: userId,
        permission_id: permission.id,
      },
    },
  });

  if (existing) {
    // Mettre à jour le type si nécessaire
    if (existing.type !== "grant") {
      await prisma.utilisateur_permissions.update({
        where: { id: existing.id },
        data: {
          type: "grant",
          reason: reason || existing.reason,
          granted_by: grantedBy,
        },
      });
    }
  } else {
    // Créer un nouveau grant
    await prisma.utilisateur_permissions.create({
      data: {
        utilisateur_id: userId,
        permission_id: permission.id,
        type: "grant",
        reason,
        granted_by: grantedBy,
      },
    });
  }
}

/**
 * Révoque une permission individuelle à un utilisateur
 */
export async function revokePermission(
  userId: number,
  permissionCode: string,
  revokedBy: number,
  reason?: string
): Promise<void> {
  const permission = await prisma.permissions.findUnique({
    where: { code: permissionCode },
  });

  if (!permission) {
    throw new Error(`Permission "${permissionCode}" n'existe pas`);
  }

  // Vérifier si un override existe déjà
  const existing = await prisma.utilisateur_permissions.findUnique({
    where: {
      utilisateur_id_permission_id: {
        utilisateur_id: userId,
        permission_id: permission.id,
      },
    },
  });

  if (existing) {
    // Mettre à jour le type si nécessaire
    if (existing.type !== "revoke") {
      await prisma.utilisateur_permissions.update({
        where: { id: existing.id },
        data: {
          type: "revoke",
          reason: reason || existing.reason,
          granted_by: revokedBy,
        },
      });
    }
  } else {
    // Créer un nouveau revoke
    await prisma.utilisateur_permissions.create({
      data: {
        utilisateur_id: userId,
        permission_id: permission.id,
        type: "revoke",
        reason,
        granted_by: revokedBy,
      },
    });
  }
}

/**
 * Supprime un override de permission (remet aux permissions du rôle)
 */
export async function removePermissionOverride(
  userId: number,
  permissionCode: string
): Promise<void> {
  const permission = await prisma.permissions.findUnique({
    where: { code: permissionCode },
  });

  if (!permission) return;

  await prisma.utilisateur_permissions.deleteMany({
    where: {
      utilisateur_id: userId,
      permission_id: permission.id,
    },
  });
}

/**
 * Récupère tous les overrides d'un utilisateur
 */
export async function getUserOverrides(userId: number) {
  return await prisma.utilisateur_permissions.findMany({
    where: { utilisateur_id: userId },
    include: {
      permissions: true,
    },
  });
}

/**
 * Vérifie si un utilisateur est super admin
 */
export async function isSuperAdmin(userId: number): Promise<boolean> {
  const user = await prisma.utilisateurs.findUnique({
    where: { id: userId },
    include: {
      roles: true,
    },
  });

  return user?.roles.is_system === true;
}

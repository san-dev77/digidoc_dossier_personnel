import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions/permissionMiddleware";
import { UPLOADS_ROOT } from "@/config/storage";

export type CheckStatus = "ok" | "warning" | "error";

interface CheckResult {
  id: string;
  label: string;
  detail: string;
  status: CheckStatus;
}

async function checkDatabase(): Promise<CheckResult> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      id: "database",
      label: "Base de données accessible",
      detail: "Les requêtes répondent normalement",
      status: "ok",
    };
  } catch {
    return {
      id: "database",
      label: "Base de données inaccessible",
      detail: "La connexion à la base de données a échoué",
      status: "error",
    };
  }
}

async function checkOrphanFiles(): Promise<CheckResult> {
  const [pieceFiles, creditFiles] = await Promise.all([
    prisma.piece_file.findMany({ select: { file_path: true } }),
    prisma.credit_files.findMany({ select: { file_path: true } }),
  ]);

  const allPaths = [
    ...pieceFiles.map((f) => f.file_path),
    ...creditFiles.map((f) => f.file_path),
  ];

  const results = await Promise.allSettled(allPaths.map((p) => fs.access(p)));
  const missingCount = results.filter((r) => r.status === "rejected").length;

  if (missingCount === 0) {
    return {
      id: "orphans",
      label: "Aucun fichier orphelin",
      detail: `${allPaths.length} fichiers référencés, tous présents sur le disque`,
      status: "ok",
    };
  }

  return {
    id: "orphans",
    label: `${missingCount} fichier${missingCount > 1 ? "s" : ""} orphelin${
      missingCount > 1 ? "s" : ""
    } détecté${missingCount > 1 ? "s" : ""}`,
    detail: "Référencés en base mais introuvables sur le disque",
    status: "warning",
  };
}

async function checkDiskSpace(): Promise<CheckResult> {
  try {
    const uploadsDir = UPLOADS_ROOT;
    const stats = await fs.statfs(uploadsDir);
    const total = stats.blocks * stats.bsize;
    const free = stats.bavail * stats.bsize;
    const used = total - free;
    const percentUsed = total > 0 ? Math.round((used / total) * 100) : 0;

    if (percentUsed >= 90) {
      return {
        id: "disk",
        label: "Espace disque critique",
        detail: `${percentUsed}% de l'espace du disque de stockage est utilisé`,
        status: "error",
      };
    }
    if (percentUsed >= 75) {
      return {
        id: "disk",
        label: "Espace disque à surveiller",
        detail: `${percentUsed}% de l'espace du disque de stockage est utilisé`,
        status: "warning",
      };
    }
    return {
      id: "disk",
      label: "Espace disque suffisant",
      detail: `${percentUsed}% de l'espace du disque de stockage est utilisé`,
      status: "ok",
    };
  } catch {
    return {
      id: "disk",
      label: "Espace disque non vérifiable",
      detail: "Information indisponible sur cet environnement",
      status: "warning",
    };
  }
}

async function checkAdminAccount(): Promise<CheckResult> {
  const activeAdmins = await prisma.utilisateurs.count({
    where: { statut: "actif", roles: { is_system: true } },
  });

  if (activeAdmins === 0) {
    return {
      id: "admin",
      label: "Aucun administrateur actif",
      detail: "Plus aucun compte super-administrateur actif ne reste disponible",
      status: "error",
    };
  }

  return {
    id: "admin",
    label: "Compte administrateur disponible",
    detail: `${activeAdmins} compte${
      activeAdmins > 1 ? "s" : ""
    } super-administrateur actif${activeAdmins > 1 ? "s" : ""}`,
    status: "ok",
  };
}

/**
 * GET /api/audit/diagnostic
 * Lance une série de vérifications à la demande.
 */
export async function GET(req: NextRequest) {
  const authError = await requirePermission("utilisateurs.read")(req);
  if (authError) return authError;

  try {
    const checks = await Promise.all([
      checkDatabase(),
      checkDiskSpace(),
      checkOrphanFiles(),
      checkAdminAccount(),
    ]);

    return NextResponse.json({ ranAt: new Date().toISOString(), checks });
  } catch (error) {
    console.error("Erreur lors du diagnostic système:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

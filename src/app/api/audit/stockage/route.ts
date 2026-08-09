import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions/permissionMiddleware";

interface FileEntry {
  name: string;
  fullPath: string;
  agentName: string | null;
  sizeBytes: number;
}

/**
 * GET /api/audit/stockage
 * Volumétrie réelle des fichiers uploadés (lue sur le disque),
 * regroupée par agent (dossier auquel le fichier appartient).
 */
export async function GET(req: NextRequest) {
  const authError = await requirePermission("utilisateurs.read")(req);
  if (authError) return authError;

  try {
    const [pieceFiles, creditFiles] = await Promise.all([
      prisma.piece_file.findMany({
        select: {
          file_path: true,
          agent_dossiers: {
            select: { agents: { select: { nom_complet: true } } },
          },
        },
      }),
      prisma.credit_files.findMany({
        select: {
          original_name: true,
          file_path: true,
          file_size: true,
          agent_dossiers: {
            select: { agents: { select: { nom_complet: true } } },
          },
        },
      }),
    ]);

    const entries: FileEntry[] = [];
    let orphanCount = 0;

    // Fichiers "pièces" : la taille n'est pas stockée en base, on la lit sur le disque
    const statResults = await Promise.allSettled(
      pieceFiles.map(async (f) => {
        const stat = await fs.stat(f.file_path);
        return {
          name: path.basename(f.file_path),
          fullPath: f.file_path,
          agentName: f.agent_dossiers?.agents?.nom_complet ?? null,
          sizeBytes: stat.size,
        } satisfies FileEntry;
      })
    );

    for (const result of statResults) {
      if (result.status === "fulfilled") {
        entries.push(result.value);
      } else {
        orphanCount++;
      }
    }

    // Fichiers de crédit : la taille est déjà connue en base
    for (const f of creditFiles) {
      entries.push({
        name: f.original_name,
        fullPath: f.file_path,
        agentName: f.agent_dossiers?.agents?.nom_complet ?? null,
        sizeBytes: f.file_size,
      });
    }

    const totalSizeBytes = entries.reduce((acc, e) => acc + e.sizeBytes, 0);
    const fileCount = entries.length;

    const biggestFile = entries.reduce<FileEntry | null>(
      (max, e) => (!max || e.sizeBytes > max.sizeBytes ? e : max),
      null
    );

    const byAgent = new Map<string, number>();
    for (const e of entries) {
      const key = e.agentName || "Sans agent lié";
      byAgent.set(key, (byAgent.get(key) || 0) + e.sizeBytes);
    }
    const agentBreakdown = Array.from(byAgent.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([agentName, sizeBytes]) => ({ agentName, sizeBytes }));

    const topContributor = agentBreakdown[0] || null;
    const topAgents = agentBreakdown.slice(0, 5);

    const files = [...entries].sort((a, b) => b.sizeBytes - a.sizeBytes);

    return NextResponse.json({
      totalSizeBytes,
      fileCount,
      averageSizeBytes: fileCount > 0 ? Math.round(totalSizeBytes / fileCount) : 0,
      biggestFile,
      topContributor,
      topAgents,
      files,
      orphanCount,
    });
  } catch (error) {
    console.error("Erreur calcul de l'utilisation du stockage:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { verifyLogsSession } from "@/lib/logsAuth";

const LOGS_DIR = path.join(process.cwd(), "logs");

/**
 * GET /api/logs
 * Liste les fichiers de logs quotidiens disponibles.
 */
export async function GET(req: NextRequest) {
  if (!verifyLogsSession(req)) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
    const entries = await fs.readdir(LOGS_DIR, { withFileTypes: true });

    const files = await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.endsWith(".log"))
        .map(async (e) => {
          const stat = await fs.stat(path.join(LOGS_DIR, e.name));
          return {
            name: e.name,
            sizeBytes: stat.size,
            modifiedAt: stat.mtime.toISOString(),
          };
        })
    );

    files.sort((a, b) => b.name.localeCompare(a.name));

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Erreur lecture de la liste des logs:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

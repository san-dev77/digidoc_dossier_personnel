import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { verifyLogsSession } from "@/lib/logsAuth";
import type { LogEntry } from "@/lib/logger";

const LOGS_DIR = path.join(process.cwd(), "logs");
const FILE_NAME_PATTERN = /^\d{4}-\d{2}-\d{2}\.log$/;

/**
 * GET /api/logs/[file]
 * Renvoie les entrées d'un fichier de log quotidien (la plus récente en premier).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  if (!verifyLogsSession(req)) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const { file } = await params;

  // Empêcher toute évasion de dossier : seuls les noms au format YYYY-MM-DD.log sont acceptés
  if (!FILE_NAME_PATTERN.test(file)) {
    return NextResponse.json(
      { message: "Nom de fichier invalide" },
      { status: 400 }
    );
  }

  try {
    const raw = await fs.readFile(path.join(LOGS_DIR, file), "utf-8");
    const entries: LogEntry[] = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is LogEntry => entry !== null)
      .reverse();

    return NextResponse.json({ entries });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ entries: [] });
    }
    console.error("Erreur lecture du fichier de log:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

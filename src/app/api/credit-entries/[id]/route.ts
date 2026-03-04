import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";
import fs from "fs-extra";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { id } = await params;
    const entryId = parseInt(id);

    if (isNaN(entryId)) {
      return NextResponse.json({ success: false, message: "ID invalide" }, { status: 400 });
    }

    // 1. Récupérer l'entrée avec ses fichiers et metadata
    const entry = await (prisma as any).credit_dossier_entries.findUnique({
      where: { id: entryId },
      include: {
        credit_files: true,
        meta_credit_values: true,
      },
    });

    if (!entry) {
      return NextResponse.json({ success: false, message: "Entrée non trouvée" }, { status: 404 });
    }

    // 2. Supprimer les fichiers du disque
    for (const file of entry.credit_files) {
      try {
        if (file.file_path && await fs.pathExists(file.file_path)) {
          await fs.unlink(file.file_path);
        }
        // Supprimer le thumbnail s'il existe
        if (file.thumbnail_path && await fs.pathExists(file.thumbnail_path)) {
          await fs.unlink(file.thumbnail_path);
        }
      } catch (err) {
        console.warn(`Impossible de supprimer le fichier ${file.file_path}:`, err);
      }
    }

    // 3. Supprimer les fichiers de la DB
    await prisma.credit_files.deleteMany({
      where: { entry_id: entryId },
    });

    // 4. Supprimer les metadata values de la DB
    await prisma.meta_credit_values.deleteMany({
      where: { entry_id: entryId },
    });

    // 5. Supprimer l'entrée elle-même
    await (prisma as any).credit_dossier_entries.delete({
      where: { id: entryId },
    });

    return NextResponse.json({
      success: true,
      message: "Entrée supprimée avec succès",
      deletedFiles: entry.credit_files.length,
      deletedMetadata: entry.meta_credit_values.length,
    });
  } catch (error) {
    console.error("❌ Erreur suppression entrée crédit:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}

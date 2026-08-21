import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";
import fs from "fs";
import { resolveStoredPath } from "@/config/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const resolvedParams = await params;
    const fileId = parseInt(resolvedParams.id, 10);

    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: "ID de fichier invalide" },
        { status: 400 }
      );
    }

    const creditFile = await prisma.credit_files.findUnique({
      where: { id: fileId },
    });

    if (!creditFile) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    // Résoudre le chemin du fichier
    const filePath = resolveStoredPath(creditFile.file_path);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Fichier introuvable sur le disque" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const contentType = creditFile.mime_type || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(creditFile.original_name)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("❌ Erreur lecture fichier crédit:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const resolvedParams = await params;
    const fileId = parseInt(resolvedParams.id, 10);

    if (isNaN(fileId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const creditFile = await prisma.credit_files.findUnique({
      where: { id: fileId },
    });

    if (!creditFile) {
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
    }

    // Supprimer le fichier du disque
    try {
      const filePath = resolveStoredPath(creditFile.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      // Supprimer le thumbnail
      if (creditFile.thumbnail_path) {
        const thumbPath = resolveStoredPath(creditFile.thumbnail_path);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      }
    } catch (fsErr) {
      console.warn("⚠️ Erreur suppression fichier disque:", fsErr);
    }

    // Supprimer en DB
    await prisma.credit_files.delete({ where: { id: fileId } });

    return NextResponse.json({
      success: true,
      message: "Fichier supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur suppression fichier crédit:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";
import { createErrorResponse } from "@/lib/errors/safeError";
import { FileValidator } from "@/services/validation/FileValidator";
import { ThumbnailService } from "@/services/storage/ThumbnailService";
import {
  getReadableStoragePath,
  generateAgentFileName,
} from "@/config/storage";
import fs from "fs-extra";
import path from "path";

export async function POST(request: NextRequest) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const formData = await request.formData();

    // Récupérer les paramètres
    const agentId = formData.get("agentId") as string;
    const rubriqueId = formData.get("rubriqueId") as string;
    const sousDossierId = formData.get("sousDossierId") as string;
    const metadataValuesRaw = formData.get("metadataValues") as string;

    if (!agentId || !rubriqueId || !sousDossierId) {
      return NextResponse.json(
        { success: false, message: "Paramètres manquants (agentId, rubriqueId, sousDossierId)" },
        { status: 400 }
      );
    }

    // Parser les valeurs de metadata
    let metadataValues: Record<string, string> = {};
    if (metadataValuesRaw) {
      try {
        metadataValues = JSON.parse(metadataValuesRaw);
      } catch {
        return NextResponse.json(
          { success: false, message: "Format des metadataValues invalide" },
          { status: 400 }
        );
      }
    }

    // Récupérer tous les fichiers
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File) {
        files.push(value);
      }
    }

    // 1. Créer ou récupérer l'agent_dossier
    let agentDossier = await prisma.agent_dossiers.findUnique({
      where: {
        agent_id_rubrique_id_sous_dossier_id: {
          agent_id: parseInt(agentId),
          rubrique_id: parseInt(rubriqueId),
          sous_dossier_id: parseInt(sousDossierId),
        },
      },
    });

    if (!agentDossier) {
      agentDossier = await prisma.agent_dossiers.create({
        data: {
          agent_id: parseInt(agentId),
          rubrique_id: parseInt(rubriqueId),
          sous_dossier_id: parseInt(sousDossierId),
        },
      });
    }

    const agentDossierId = agentDossier.id;

    // 2. Récupérer les noms pour l'arborescence et le label
    const [rubrique, sousDossier, agent] = await Promise.all([
      prisma.rubriques.findUnique({
        where: { id: parseInt(rubriqueId) },
        select: { nom: true },
      }),
      prisma.sous_dossiers.findUnique({
        where: { id: parseInt(sousDossierId) },
        select: { titre: true },
      }),
      prisma.agents.findUnique({
        where: { id: parseInt(agentId) },
        select: { nom_complet: true },
      }),
    ]);

    if (!rubrique || !sousDossier || !agent) {
      return NextResponse.json(
        { success: false, message: "Agent, rubrique ou sous-dossier non trouvé" },
        { status: 404 }
      );
    }

    // 3. Créer l'entrée de dossier de crédit avec label auto (éviter les doublons)
    const existingEntries = await (prisma as any).credit_dossier_entries.findMany({
      where: { agent_dossier_id: agentDossierId },
      select: { label: true },
      orderBy: { id: 'desc' as const },
    });

    // Extraire le numéro le plus élevé des labels existants
    let maxNum = 0;
    for (const e of existingEntries) {
      const match = e.label?.match(/#(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const entryLabel = `${sousDossier.titre} #${maxNum + 1}`;

    const entry = await prisma.credit_dossier_entries.create({
      data: {
        agent_dossier_id: agentDossierId,
        label: entryLabel,
      },
    });

    const entryId = entry.id;

    // 4. Sauvegarder les valeurs de metadata liées à l'entrée
    const savedMetadata: Array<{ metadataId: string; valeur: string }> = [];
    for (const [metadataId, valeur] of Object.entries(metadataValues)) {
      if (valeur && valeur.trim()) {
        await prisma.meta_credit_values.create({
          data: {
            metadata_credit_id: parseInt(metadataId),
            agent_dossier_id: agentDossierId,
            entry_id: entryId,
            valeur: valeur.trim(),
          },
        });
        savedMetadata.push({ metadataId, valeur: valeur.trim() });
      }
    }

    // 5. Sauvegarder les fichiers liés à l'entrée
    const savedFiles: Array<{
      fileName: string;
      originalName: string;
      fileSize: number;
    }> = [];

    for (const file of files) {
      // Valider le fichier
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileObj = {
        originalname: file.name,
        mimetype: file.type,
        size: file.size,
        buffer: fileBuffer,
      };

      const validation = FileValidator.validateFile(fileObj);
      if (!validation.isValid) {
        console.warn(`⚠️ Fichier ignoré (invalide): ${file.name}`, validation.errors);
        continue;
      }

      // Créer le chemin de stockage
      const basePath = getReadableStoragePath(
        rubrique.nom,
        sousDossier.titre,
        "credit_files",
        agent.nom_complet
      );
      await fs.ensureDir(basePath);

      // Générer le nom du fichier
      const finalFileName = generateAgentFileName(file.name, agent.nom_complet);
      const filePath = path.join(basePath, finalFileName);

      // Écrire le fichier
      await fs.writeFile(filePath, fileBuffer);

      // Générer le thumbnail
      const thumbnailPath = path.join(basePath, `thumb_${finalFileName}`);
      const thumbnailResult = await ThumbnailService.generateThumbnailForFile(
        filePath,
        thumbnailPath,
        file.type
      );

      // Sauvegarder en DB dans credit_files avec entry_id
      await prisma.credit_files.create({
        data: {
          agent_dossier_id: agentDossierId,
          entry_id: entryId,
          file_path: filePath,
          file_name: finalFileName,
          original_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          thumbnail_path: thumbnailResult.success
            ? thumbnailResult.thumbnailPath
            : null,
        },
      });

      savedFiles.push({
        fileName: finalFileName,
        originalName: file.name,
        fileSize: file.size,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Dossier de crédit créé avec succès`,
      data: {
        agentDossierId,
        entryId,
        entryLabel,
        filesCount: savedFiles.length,
        metadataCount: savedMetadata.length,
        files: savedFiles,
        metadata: savedMetadata,
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'upload crédit:", error);
    return createErrorResponse(
      error,
      "Erreur lors de la création du dossier de crédit",
      500
    );
  }
}

// GET: Récupérer les entrées de crédit groupées (metadata + fichiers)
export async function GET(request: NextRequest) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const sousDossierId = searchParams.get("sous_dossier_id");
    const agentDossierId = searchParams.get("agent_dossier_id");

    if (!sousDossierId && !agentDossierId) {
      return NextResponse.json(
        { success: false, message: "sous_dossier_id ou agent_dossier_id requis" },
        { status: 400 }
      );
    }

    // Trouver les agent_dossiers correspondants
    let agentDossierIds: number[] = [];

    if (agentDossierId) {
      agentDossierIds = [parseInt(agentDossierId)];
    } else {
      const agentDossiers = await prisma.agent_dossiers.findMany({
        where: { sous_dossier_id: parseInt(sousDossierId!) },
        select: { id: true },
      });
      agentDossierIds = agentDossiers.map((ad) => ad.id);
    }

    if (agentDossierIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // Récupérer les entrées avec metadata et fichiers inclus
    const entries = await prisma.credit_dossier_entries.findMany({
      where: { agent_dossier_id: { in: agentDossierIds } },
      include: {
        meta_credit_values: {
          include: {
            metadata_credit: {
              select: { id: true, nom_meta: true, type_meta: true },
            },
          },
        },
        credit_files: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: entries,
      count: entries.length,
    });
  } catch (error) {
    console.error("❌ Erreur récupération entrées crédit:", error);
    return createErrorResponse(
      error,
      "Erreur lors de la récupération des données",
      500
    );
  }
}

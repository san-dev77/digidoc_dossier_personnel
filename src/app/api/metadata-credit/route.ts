import { NextRequest, NextResponse } from "next/server";
import { MetadataService } from "@/services/metadata";
import { protectRoute } from "@/lib/auth/routeProtection";
import { createErrorResponse } from "@/lib/errors/safeError";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const sousDossierId = searchParams.get("sous_dossier_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    switch (action) {
      case "by-sous-dossier":
        if (!sousDossierId) {
          return NextResponse.json(
            {
              success: false,
              message: "Paramètre sous_dossier_id requis",
            },
            { status: 400 }
          );
        }
        const result = await MetadataService.getMetadataBySousDossierServer(
          parseInt(sousDossierId)
        );
        return NextResponse.json(result);

      case "all":
        const allResult = await MetadataService.getAllMetadata(page, limit);
        return NextResponse.json(allResult);

      case "stats":
        const statsResult = await MetadataService.getMetadataStats();
        return NextResponse.json(statsResult);

      default:
        const defaultResult = await MetadataService.getAllMetadata(page, limit);
        return NextResponse.json(defaultResult);
    }
  } catch (error: unknown) {
    return createErrorResponse(error, "Erreur lors de la récupération des métadonnées", 500);
  }
}

export async function POST(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "create":
        const createResult = await MetadataService.createMetadataServer(data);
        return NextResponse.json(createResult);

      case "search":
        const searchTerm = data.searchTerm;
        if (!searchTerm) {
          return NextResponse.json(
            {
              success: false,
              message: "Terme de recherche requis",
            },
            { status: 400 }
          );
        }
        const searchResult = await MetadataService.searchMetadata(searchTerm);
        return NextResponse.json(searchResult);

      case "replicate": {
        // Répliquer la config de metadata d'un sous-dossier source vers
        // tous les autres sous-dossiers de crédit
        const { sourceSousDossierId } = data;
        if (!sourceSousDossierId) {
          return NextResponse.json(
            { success: false, message: "sourceSousDossierId requis" },
            { status: 400 }
          );
        }

        const sourceId = parseInt(sourceSousDossierId);

        // 1. Charger les metadata du sous-dossier source
        const sourceMetadata = await prisma.metadata_credit.findMany({
          where: { sous_dossier_id: sourceId },
        });

        if (sourceMetadata.length === 0) {
          return NextResponse.json(
            { success: false, message: "Aucune métadonnée à répliquer sur ce sous-dossier" },
            { status: 400 }
          );
        }

        // 2. Trouver toutes les rubriques de type "credit"
        const creditRubriques = await prisma.rubriques.findMany({
          where: { type: "credit" },
          select: { id: true },
        });
        const creditRubriqueIds = creditRubriques.map((r) => r.id);

        // 3. Trouver tous les sous-dossiers liés à ces rubriques
        //    via la table sous_dossiers → rubrique_id
        const allCreditSousDossiers = await prisma.sous_dossiers.findMany({
          where: { rubrique_id: { in: creditRubriqueIds } },
          select: { id: true },
        });

        // Exclure le source
        const targetIds = allCreditSousDossiers
          .map((sd) => sd.id)
          .filter((id) => id !== sourceId);

        if (targetIds.length === 0) {
          return NextResponse.json({
            success: true,
            message: "Aucun autre sous-dossier de crédit trouvé",
            data: { replicated: 0 },
          });
        }

        // 4. Pour chaque cible, créer les metadata manquantes (skip les doublons)
        let created = 0;
        await prisma.$transaction(async (tx) => {
          for (const targetSdId of targetIds) {
            // Charger les metadata existantes de la cible
            const existing = await tx.metadata_credit.findMany({
              where: { sous_dossier_id: targetSdId },
              select: { nom_meta: true, type_meta: true },
            });
            const existingKeys = new Set(
              existing.map((e) => `${e.nom_meta}::${e.type_meta}`)
            );

            // Créer celles qui n'existent pas
            for (const meta of sourceMetadata) {
              const key = `${meta.nom_meta}::${meta.type_meta}`;
              if (!existingKeys.has(key)) {
                await tx.metadata_credit.create({
                  data: {
                    sous_dossier_id: targetSdId,
                    nom_meta: meta.nom_meta,
                    type_meta: meta.type_meta,
                    obligatoire: meta.obligatoire,
                  },
                });
                created++;
              }
            }
          }
        });

        return NextResponse.json({
          success: true,
          message: `Configuration répliquée avec succès sur ${targetIds.length} sous-dossier(s). ${created} métadonnée(s) créée(s).`,
          data: { replicated: targetIds.length, created },
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            message: "Action non reconnue",
          },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    return createErrorResponse(error, "Erreur lors de la création/recherche de métadonnées", 500);
  }
}

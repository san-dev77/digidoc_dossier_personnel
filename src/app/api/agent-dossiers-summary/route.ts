/**
 * GET /api/agent-dossiers-summary
 *
 * Endpoint léger qui retourne les agents avec leurs rubriques et sous-dossiers,
 * mais SANS charger les pièces, fichiers, ni métadonnées.
 * Seuls les compteurs sont inclus pour l'affichage de la liste.
 *
 * Performances :
 * - Avant : 1000+ appels API en cascade, 50-200MB de RAM
 * - Après  : 1 seul appel, ~2-5MB de RAM
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

export async function GET(request: NextRequest) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    // 1. Récupérer tous les agent_dossiers avec relations et compteurs
    const agentDossiers = await prisma.agent_dossiers.findMany({
      include: {
        agents: true,
        rubriques: true,
        sous_dossiers: true,
        _count: {
          select: {
            piece_file: true,
            meta_values: true,
            credit_files: true,
          },
        },
      },
    });

    // 2. Récupérer les compteurs de pièces par sous-dossier (1 seule requête groupée)
    const sousDossierIds = [...new Set(agentDossiers.map((ad) => ad.sous_dossier_id))];
    const piecesCountMap = new Map<number, number>();

    if (sousDossierIds.length > 0) {
      const piecesCountResult = await prisma.pieces.groupBy({
        by: ["sous_dossier_id"],
        where: { sous_dossier_id: { in: sousDossierIds } },
        _count: { id: true },
      });
      piecesCountResult.forEach((row) => {
        piecesCountMap.set(row.sous_dossier_id, row._count.id);
      });
    }

    // 3. Grouper : agent → rubrique → sous-dossier (compteurs uniquement)
    const agentMap = new Map<number, {
      agent: typeof agentDossiers[0]["agents"];
      rubriques: Map<number, {
        rubrique: typeof agentDossiers[0]["rubriques"];
        sousDossiers: Array<{
          id: number;
          titre: string;
          description: string | null;
          created_at: string | null;
          updated_at: string | null;
          agentDossierId: number;
          piecesCount: number;
          filesCount: number;
          metadataCount: number;
        }>;
        totalPieces: number;
      }>;
    }>();

    for (const ad of agentDossiers) {
      if (!ad.agents || !ad.rubriques || !ad.sous_dossiers) continue;

      const agentId = ad.agent_id;

      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, {
          agent: ad.agents,
          rubriques: new Map(),
        });
      }

      const agentEntry = agentMap.get(agentId)!;
      const rubriqueId = ad.rubrique_id;

      if (!agentEntry.rubriques.has(rubriqueId)) {
        agentEntry.rubriques.set(rubriqueId, {
          rubrique: ad.rubriques,
          sousDossiers: [],
          totalPieces: 0,
        });
      }

      const rubEntry = agentEntry.rubriques.get(rubriqueId)!;
      const piecesCount = piecesCountMap.get(ad.sous_dossier_id) || 0;
      const filesCount = ad._count.piece_file + ad._count.credit_files;
      const metadataCount = ad._count.meta_values;

      rubEntry.sousDossiers.push({
        id: ad.sous_dossiers.id,
        titre: ad.sous_dossiers.titre,
        description: ad.sous_dossiers.description,
        created_at: ad.sous_dossiers.created_at?.toISOString() || null,
        updated_at: ad.sous_dossiers.updated_at?.toISOString() || null,
        agentDossierId: ad.id,
        piecesCount,
        filesCount,
        metadataCount,
      });

      rubEntry.totalPieces += piecesCount;
    }

    // 4. Sérialiser pour la réponse JSON
    const result = Array.from(agentMap.values())
      .map(({ agent, rubriques }) => ({
        agent: {
          id: agent.id,
          matricule: agent.matricule,
          nom_complet: agent.nom_complet,
          email: agent.email || "",
          fonction: agent.fonction || "",
          date_naissance: agent.date_naissance?.toISOString() || null,
          lieu_naissance: agent.lieu_naissance || null,
          sexe: agent.sexe || null,
          situation_matrimoniale: agent.situation_matrimoniale || null,
          adresse: agent.adresse || null,
          telephone: agent.telephone || null,
          statut: agent.statut || null,
          created_at: agent.created_at?.toISOString() || null,
          updated_at: agent.updated_at?.toISOString() || null,
        },
        rubriques: Array.from(rubriques.values()).map(({ rubrique, sousDossiers, totalPieces }) => ({
          rubrique: {
            id: rubrique.id,
            nom: rubrique.nom,
            description: rubrique.description,
            type: rubrique.type,
            created_at: (rubrique as any).created_at?.toISOString?.() || null,
          },
          sousDossiers,
          totalPieces,
          totalSousDossiers: sousDossiers.length,
        })),
      }))
      .filter((a) => a.rubriques.length > 0);

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    console.error("❌ Erreur agent-dossiers-summary:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions/permissionMiddleware";

/**
 * GET /api/stats
 * Récupère toutes les statistiques du système
 */
export async function GET(req: NextRequest) {
  const authError = await requirePermission("roles.read")(req);
  if (authError) return authError;

  try {
    // Rubriques
    const rubriques = await prisma.rubriques.findMany({
      include: {
        _count: {
          select: {
            sous_dossiers: true,
          },
        },
      },
    });

    // Sous-dossiers avec pièces
    const sousDossiers = await prisma.sous_dossiers.findMany({
      include: {
        rubriques: {
          select: { nom: true },
        },
        _count: {
          select: {
            pieces: true,
          },
        },
      },
    });

    // Agents avec pièces disponibles/indisponibles (avec détails via Prisma)
    // Logique : Un agent hérite de toutes les pièces de ses rubriques assignées
    const agentsAvecRubriques = await prisma.agents.findMany({
      where: {
        statut: "actif",
        agent_rubriques: {
          some: {}, // A au moins une rubrique assignée
        },
      },
      include: {
        agent_rubriques: {
          include: {
            rubriques: {
              include: {
                sous_dossiers: {
                  include: {
                    pieces: {
                      include: {
                        pieces_check: {
                          where: {
                            disponible: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transformer les données pour avoir le détail des pièces manquantes
    const agentsWithPieces = agentsAvecRubriques.map((agent) => {
      const piecesManquantes: Array<{
        id: number;
        nom: string;
        rubrique: string;
        sousDossier: string;
      }> = [];
      let totalPieces = 0;
      let piecesDisponibles = 0;

      agent.agent_rubriques.forEach((ar) => {
        ar.rubriques.sous_dossiers.forEach((sd) => {
          sd.pieces.forEach((piece) => {
            totalPieces++;
            const estDisponible = piece.pieces_check.some(
              (check) => check.agent_id === agent.id && check.disponible
            );

            if (estDisponible) {
              piecesDisponibles++;
            } else {
              // Pièce manquante
              piecesManquantes.push({
                id: piece.id,
                nom: piece.nom,
                rubrique: ar.rubriques.nom,
                sousDossier: sd.titre,
              });
            }
          });
        });
      });

      return {
        id: agent.id,
        nom_complet: agent.nom_complet,
        matricule: agent.matricule,
        total_pieces: totalPieces,
        pieces_disponibles: piecesDisponibles,
        pieces_indisponibles: piecesManquantes.length,
        piecesManquantesDetail: piecesManquantes,
      };
    }).filter((a) => a.total_pieces > 0);

    // Total fichiers uploadés
    const totalFichiers = await prisma.piece_file.count();

    return NextResponse.json({
      rubriques: rubriques.map((r) => ({
        id: r.id,
        nom: r.nom,
        nombreSousDossiers: r._count.sous_dossiers,
      })),
      sousDossiers: sousDossiers.map((sd) => ({
        id: sd.id,
        titre: sd.titre,
        rubrique: sd.rubriques.nom,
        nombrePieces: sd._count.pieces,
      })),
      agentsAvecPieces: {
        disponibles: (agentsWithPieces as any[]).filter((a) => a.pieces_disponibles > 0),
        indisponibles: (agentsWithPieces as any[]).filter((a) => a.pieces_indisponibles > 0),
      },
      totalFichiers,
      totalRubriques: rubriques.length,
      totalSousDossiers: sousDossiers.length,
      totalPieces: sousDossiers.reduce((sum, sd) => sum + sd._count.pieces, 0),
    });
  } catch (error) {
    console.error("Erreur stats:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}


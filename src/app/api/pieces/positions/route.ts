import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { protectRoute } from "@/lib/auth/routeProtection";

/**
 * GET /api/pieces/positions?sousDossierId=xxx
 * Récupère les positions des pièces pour un sous-dossier
 */
export async function GET(request: NextRequest) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const sousDossierId = searchParams.get("sousDossierId");

    if (!sousDossierId) {
      return NextResponse.json(
        { message: "sousDossierId est requis" },
        { status: 400 }
      );
    }

    const { rows } = await query(
      `SELECT 
        pp.id,
        pp.piece_id,
        pp.position,
        pp.sous_dossier_id,
        p.nom,
        p.description
      FROM piece_positions pp
      INNER JOIN pieces p ON p.id = pp.piece_id
      WHERE pp.sous_dossier_id = $1
      ORDER BY pp.position ASC, pp.piece_id ASC`,
      [sousDossierId]
    );

    return NextResponse.json({ positions: rows }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des positions:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pieces/positions
 * Met à jour les positions des pièces
 * Body: { sousDossierId: number, positions: [{ pieceId: number, position: number }] }
 */
export async function PUT(request: NextRequest) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { sousDossierId, positions } = body;

    if (!sousDossierId || !Array.isArray(positions)) {
      return NextResponse.json(
        { message: "sousDossierId et positions sont requis" },
        { status: 400 }
      );
    }

    // Utiliser une transaction pour garantir la cohérence
    await query("BEGIN");

    try {
      // Supprimer les anciennes positions pour ce sous-dossier
      await query(
        `DELETE FROM piece_positions WHERE sous_dossier_id = $1`,
        [sousDossierId]
      );

      // Insérer les nouvelles positions
      for (const pos of positions) {
        if (pos.pieceId && typeof pos.position === "number") {
          await query(
            `INSERT INTO piece_positions (sous_dossier_id, piece_id, position, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (piece_id) 
             DO UPDATE SET position = $3, updated_at = NOW()`,
            [sousDossierId, pos.pieceId, pos.position]
          );
        }
      }

      await query("COMMIT");

      return NextResponse.json(
        { message: "Positions mises à jour avec succès" },
        { status: 200 }
      );
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des positions:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { protectRoute } from "@/lib/auth/routeProtection";

/**
 * GET /api/sous-dossiers/positions?rubriqueId=xxx
 * Récupère les positions des sous-dossiers pour une rubrique
 */
export async function GET(request: NextRequest) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const rubriqueId = searchParams.get("rubriqueId");

    if (!rubriqueId) {
      return NextResponse.json(
        { message: "rubriqueId est requis" },
        { status: 400 }
      );
    }

    const { rows } = await query(
      `SELECT 
        sdp.id,
        sdp.sous_dossier_id,
        sdp.position,
        sdp.rubrique_id,
        sd.titre,
        sd.description
      FROM sous_dossier_positions sdp
      INNER JOIN sous_dossiers sd ON sd.id = sdp.sous_dossier_id
      WHERE sdp.rubrique_id = ?
      ORDER BY sdp.position ASC, sdp.sous_dossier_id ASC`,
      [rubriqueId]
    );

    return NextResponse.json({ positions: rows }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des positions:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/sous-dossiers/positions
 * Met à jour les positions des sous-dossiers
 * Body: { rubriqueId: number, positions: [{ sousDossierId: number, position: number }] }
 */
export async function PUT(request: NextRequest) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { rubriqueId, positions } = body;

    if (!rubriqueId || !Array.isArray(positions)) {
      return NextResponse.json(
        { message: "rubriqueId et positions sont requis" },
        { status: 400 }
      );
    }

    // Utiliser une transaction pour garantir la cohérence
    await query("BEGIN");

    try {
      // Supprimer les anciennes positions pour cette rubrique
      await query(`DELETE FROM sous_dossier_positions WHERE rubrique_id = ?`, [
        rubriqueId,
      ]);

      // Insérer les nouvelles positions
      for (const pos of positions) {
        if (pos.sousDossierId && typeof pos.position === "number") {
          await query(
            `INSERT INTO sous_dossier_positions (rubrique_id, sous_dossier_id, position, updated_at)
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE position = VALUES(position), updated_at = NOW()`,
            [rubriqueId, pos.sousDossierId, pos.position]
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
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

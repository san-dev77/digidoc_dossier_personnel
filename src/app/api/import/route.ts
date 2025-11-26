import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { protectRoute } from "@/lib/auth/routeProtection";
import * as XLSX from "xlsx";

// Fonction pour parser un fichier Excel ou CSV
async function parseFile(file: File): Promise<Record<string, string>[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Lire le fichier avec xlsx (supporte CSV, XLSX, XLS)
    const workbook = XLSX.read(data, { type: "array" });

    // Prendre la première feuille
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    console.log("📋 Nom de la feuille:", firstSheetName);

    // Convertir en JSON avec headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false, // Convertir tout en string
      defval: "", // Valeur par défaut pour cellules vides
    });

    console.log("📊 Nombre de lignes:", jsonData.length);
    if (jsonData.length > 0) {
      console.log("📝 Exemple de première ligne:", jsonData[0]);
    }

    return jsonData as Record<string, string>[];
  } catch (error) {
    console.error("❌ Erreur lors du parsing du fichier:", error);
    throw new Error("Impossible de lire le fichier");
  }
}

interface ImportDetail {
  success: boolean;
  message: string;
}

// Import des agents
async function importAgents(data: Record<string, string>[]) {
  let created = 0;
  let updated = 0;
  let errors = 0;
  const details: ImportDetail[] = [];

  for (const row of data) {
    try {
      // Gérer les deux formats : Nom+Prénom OU nom_complet
      // Support de différents noms de colonnes (avec ou sans accents, majuscules, etc.)
      const matricule =
        row["Matricule"] || row["matricule"] || row["MATRICULE"] || "";
      const nom = row["Nom"] || row["nom"] || row["NOM"] || "";
      const prenom =
        row["Prénom"] || row["Prenom"] || row["prenom"] || row["PRENOM"] || "";
      let nom_complet = row["nom_complet"] || row["Nom_complet"] || "";
      const fonction =
        row["Fonction"] || row["fonction"] || row["FONCTION"] || "";
      // const direction = row["Direction"] || row["direction"] || row["DIRECTION"] || ""; // Info non stockée
      const email = row["email"] || row["Email"] || row["EMAIL"] || "";
      const telephone =
        row["telephone"] || row["Telephone"] || row["Téléphone"] || "";
      const password = row["password"] || row["Password"] || "";

      // Si Nom et Prénom sont fournis, les combiner
      if (nom && prenom && !nom_complet) {
        nom_complet = `${prenom} ${nom}`.trim();
      }

      if (!matricule || !nom_complet) {
        errors++;
        details.push({
          success: false,
          message: `❌ Ligne ignorée : Matricule="${
            matricule || "vide"
          }", Nom="${nom || "vide"}", Prénom="${prenom || "vide"}"`,
        });
        continue;
      }

      // Normaliser le matricule
      const normalizedMatricule = matricule.trim().toUpperCase();

      // Vérifier si l'agent existe
      const existing = await prisma.agents.findFirst({
        where: { matricule: normalizedMatricule },
      });

      const agentData = {
        matricule: normalizedMatricule,
        nom_complet: nom_complet.trim(),
        fonction: fonction?.trim() || "Agent",
        email: email?.trim() || "",
        telephone: telephone?.trim() || "",
      };

      if (existing) {
        // Mettre à jour
        await prisma.agents.update({
          where: { id: existing.id },
          data: {
            ...agentData,
            updated_at: new Date(),
          },
        });
        updated++;
        details.push({
          success: true,
          message: `✅ Agent mis à jour : ${nom_complet} (${normalizedMatricule}) - ${
            fonction || "Agent"
          }`,
        });
      } else {
        // Créer
        const passwordToHash = password?.trim() || "password123";
        const hashedPassword = await hashPassword(passwordToHash);
        await prisma.agents.create({
          data: {
            ...agentData,
            password: hashedPassword,
          },
        });
        created++;
        details.push({
          success: true,
          message: `✅ Agent créé : ${nom_complet} (${normalizedMatricule}) - ${
            fonction || "Agent"
          }`,
        });
      }
    } catch (error) {
      errors++;
      details.push({
        success: false,
        message: `❌ Erreur : ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      });
    }
  }

  return { created, updated, errors, details };
}

// Import des documents du personnel
async function importDocuments(data: Record<string, string>[]) {
  let created = 0;
  let errors = 0;
  const details: ImportDetail[] = [];

  try {
    // 1. Trouver ou créer la rubrique "Documents du personnel"
    let rubrique = await prisma.rubriques.findFirst({
      where: { nom: "Documents du personnel" },
    });

    if (!rubrique) {
      rubrique = await prisma.rubriques.create({
        data: {
          nom: "Documents du personnel",
          description: "Gestion des documents administratifs du personnel",
        },
      });
      console.log("✅ Rubrique 'Documents du personnel' créée");
    }

    // 2. Grouper les pièces par sous-dossier
    const sousDossiersMap = new Map<string, string[]>();

    data.forEach((row) => {
      const sousDossierNom =
        row["Sous-dossier"] || row["sous-dossier"] || row["Sous dossier"] || "";
      const pieceNom =
        row["Nom de la pièce"] ||
        row["Nom de la piece"] ||
        row["piece"] ||
        row["Pièce"] ||
        "";

      if (sousDossierNom && pieceNom) {
        if (!sousDossiersMap.has(sousDossierNom)) {
          sousDossiersMap.set(sousDossierNom, []);
        }
        sousDossiersMap.get(sousDossierNom)!.push(pieceNom);
      }
    });

    console.log(`📁 ${sousDossiersMap.size} sous-dossier(s) détecté(s)`);

    // 3. Créer les sous-dossiers et leurs pièces
    for (const [sousDossierNom, pieces] of sousDossiersMap.entries()) {
      try {
        // Vérifier si le sous-dossier existe
        let sousDossier = await prisma.sous_dossiers.findFirst({
          where: {
            rubrique_id: rubrique.id,
            titre: sousDossierNom,
          },
        });

        if (!sousDossier) {
          // Créer le sous-dossier
          sousDossier = await prisma.sous_dossiers.create({
            data: {
              rubrique_id: rubrique.id,
              titre: sousDossierNom,
              description: `Sous-dossier pour ${sousDossierNom}`,
              statut: "ouvert",
            },
          });
          console.log(`✅ Sous-dossier créé : ${sousDossierNom}`);
        }

        // Créer les pièces pour ce sous-dossier
        for (const pieceNom of pieces) {
          try {
            // Vérifier si la pièce existe déjà
            const existingPiece = await prisma.pieces.findFirst({
              where: {
                sous_dossier_id: sousDossier.id,
                nom: pieceNom,
              },
            });

            if (!existingPiece) {
              await prisma.pieces.create({
                data: {
                  sous_dossier_id: sousDossier.id,
                  nom: pieceNom,
                  description: `Document : ${pieceNom}`,
                  has_meta: false,
                },
              });
              created++;
              details.push({
                success: true,
                message: `✅ Pièce créée : ${sousDossierNom} > ${pieceNom}`,
              });
            } else {
              details.push({
                success: true,
                message: `⏭️ Pièce ignorée (existe déjà) : ${sousDossierNom} > ${pieceNom}`,
              });
            }
          } catch (error) {
            errors++;
            details.push({
              success: false,
              message: `❌ Erreur pièce "${pieceNom}" : ${
                error instanceof Error ? error.message : "Erreur"
              }`,
            });
          }
        }
      } catch (error) {
        errors++;
        details.push({
          success: false,
          message: `❌ Erreur sous-dossier "${sousDossierNom}" : ${
            error instanceof Error ? error.message : "Erreur"
          }`,
        });
      }
    }

    return { created, updated: 0, errors, details };
  } catch (error) {
    console.error("❌ Erreur import documents:", error);
    return {
      created: 0,
      updated: 0,
      errors: 1,
      details: [
        {
          success: false,
          message: `❌ Erreur globale : ${
            error instanceof Error ? error.message : "Erreur inconnue"
          }`,
        },
      ],
    };
  }
}

// Import des dossiers de crédit (sous-dossiers)
async function importCredits(data: Record<string, string>[]) {
  let created = 0;
  let errors = 0;
  const details: ImportDetail[] = [];

  try {
    // 1. Trouver ou créer la rubrique "Dossier de crédit"
    let rubrique = await prisma.rubriques.findFirst({
      where: { nom: "Dossier de crédit" },
    });

    if (!rubrique) {
      rubrique = await prisma.rubriques.create({
        data: {
          nom: "Dossier de crédit",
          description: "Gestion des dossiers de demande de crédit",
        },
      });
      console.log("✅ Rubrique 'Dossier de crédit' créée");
    }

    // 2. Pour chaque ligne, créer un sous-dossier
    for (const row of data) {
      try {
        const sousDossierNom =
          row["Documents du dossier PRÊT"] ||
          row["Documents du dossier PRET"] ||
          row["Sous-dossier"] ||
          row["sous-dossier"] ||
          row["Nom"] ||
          "";

        if (!sousDossierNom || !sousDossierNom.trim()) {
          continue; // Ignorer les lignes vides
        }

        // Vérifier si le sous-dossier existe déjà
        const existing = await prisma.sous_dossiers.findFirst({
          where: {
            rubrique_id: rubrique.id,
            titre: sousDossierNom,
          },
        });

        if (!existing) {
          await prisma.sous_dossiers.create({
            data: {
              rubrique_id: rubrique.id,
              titre: sousDossierNom,
              description: `Sous-dossier : ${sousDossierNom}`,
              statut: "ouvert",
            },
          });
          created++;
          details.push({
            success: true,
            message: `✅ Sous-dossier créé : ${sousDossierNom}`,
          });
        } else {
          details.push({
            success: true,
            message: `⏭️ Sous-dossier ignoré (existe déjà) : ${sousDossierNom}`,
          });
        }
      } catch (error) {
        errors++;
        details.push({
          success: false,
          message: `❌ Erreur : ${
            error instanceof Error ? error.message : "Erreur"
          }`,
        });
      }
    }

    return { created, updated: 0, errors, details };
  } catch (error) {
    console.error("❌ Erreur import crédits:", error);
    return {
      created: 0,
      updated: 0,
      errors: 1,
      details: [
        {
          success: false,
          message: `❌ Erreur globale : ${
            error instanceof Error ? error.message : "Erreur inconnue"
          }`,
        },
      ],
    };
  }
}

export async function POST(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type) {
      return NextResponse.json(
        { message: "Fichier et type sont requis" },
        { status: 400 }
      );
    }

    // Parser le fichier (Excel ou CSV)
    const data = await parseFile(file);

    if (data.length === 0) {
      return NextResponse.json(
        { message: "Aucune donnée valide trouvée dans le fichier" },
        { status: 400 }
      );
    }

    console.log(`📊 Import de ${data.length} ligne(s) de type "${type}"`);

    // Traiter selon le type
    let results;
    switch (type) {
      case "agents":
        results = await importAgents(data);
        break;
      case "documents":
        results = await importDocuments(data);
        break;
      case "credits":
        results = await importCredits(data);
        break;
      default:
        return NextResponse.json(
          { message: "Type d'import invalide" },
          { status: 400 }
        );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("❌ Erreur lors de l'import:", error);
    return NextResponse.json(
      {
        message: "Erreur lors de l'import",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

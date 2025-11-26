import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du seed de la base de données...\n");

  // 1. Vérifier si des données existent déjà
  const existingRubriques = await prisma.rubriques.findMany();

  if (existingRubriques.length > 0) {
    console.log("ℹ️  Des rubriques existent déjà dans la base :");
    existingRubriques.forEach((r) => {
      console.log(`   - ${r.nom} (ID: ${r.id})`);
    });
    console.log("\n");
  }

  // 2. Créer les rubriques de base
  const rubriques = [
    {
      nom: "Documents du personnel",
      description:
        "Gestion des documents administratifs du personnel (état civil, contrats, etc.)",
    },
    {
      nom: "Dossier de crédit",
      description: "Gestion des dossiers de demande de crédit des agents",
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const rubrique of rubriques) {
    const existing = await prisma.rubriques.findFirst({
      where: { nom: rubrique.nom },
    });

    if (!existing) {
      const newRubrique = await prisma.rubriques.create({
        data: rubrique,
      });
      console.log(
        `✅ Rubrique créée : "${rubrique.nom}" (ID: ${newRubrique.id})`
      );
      created++;
    } else {
      console.log(
        `⏭️  Rubrique ignorée (déjà existante) : "${rubrique.nom}" (ID: ${existing.id})`
      );
      skipped++;
    }
  }

  console.log(`\n📊 Résumé du seed :`);
  console.log(`   ✅ ${created} rubrique(s) créée(s)`);
  console.log(`   ⏭️  ${skipped} rubrique(s) ignorée(s)`);
  console.log("\n🎉 Seed terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

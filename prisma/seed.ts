import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du seed de la base de données...\n");

  let created = 0;
  let skipped = 0;

  // ============================================
  // 1. CRÉATION DES RÔLES
  // ============================================
  console.log("📋 Création des rôles...");

  const rolesData = [
    {
      code: "super_admin",
      nom: "Super Administrateur",
      description: "Accès complet à toutes les fonctionnalités du système",
      couleur: "#EF4444",
      is_system: true,
    },
    {
      code: "admin_rh",
      nom: "Administrateur RH",
      description: "Gestion complète des agents et dossiers",
      couleur: "#F59E0B",
      is_system: false,
    },
    {
      code: "gestionnaire",
      nom: "Gestionnaire",
      description:
        "Création et modification des dossiers, consultation des agents",
      couleur: "#3B82F6",
      is_system: false,
    },
    {
      code: "consultant",
      nom: "Consultant",
      description: "Consultation en lecture seule et génération de rapports",
      couleur: "#10B981",
      is_system: false,
    },
  ];

  const rolesMap: Record<string, number> = {};

  for (const roleData of rolesData) {
    const existing = await prisma.roles?.findFirst({
      where: { nom: roleData.nom },
    });

    if (!existing) {
      const role = await prisma.roles?.create({
        data: roleData,
      });
      rolesMap[roleData.nom] = role.id;
      console.log(`✅ Rôle créé : "${roleData.nom}" (ID: ${role.id})`);
      created++;
    } else {
      rolesMap[roleData.nom] = existing.id;
      console.log(`⏭️  Rôle existant : "${roleData.nom}" (ID: ${existing.id})`);
      skipped++;
    }
  }

  // ============================================
  // 2. CRÉATION DES PERMISSIONS
  // ============================================
  console.log("\n🔐 Création des permissions...");

  const permissionsData = [
    // Agents
    {
      code: "agents.create",
      nom_affichage: "Créer des agents",
      description: "Peut créer de nouveaux agents",
      categorie: "agents",
    },
    {
      code: "agents.read",
      nom_affichage: "Consulter les agents",
      description: "Peut voir les agents",
      categorie: "agents",
    },
    {
      code: "agents.update",
      nom_affichage: "Modifier les agents",
      description: "Peut modifier les agents",
      categorie: "agents",
    },
    {
      code: "agents.delete",
      nom_affichage: "Supprimer les agents",
      description: "Peut supprimer les agents",
      categorie: "agents",
    },
    {
      code: "agents.export",
      nom_affichage: "Exporter les agents",
      description: "Peut exporter les agents",
      categorie: "agents",
    },
    {
      code: "agents.import",
      nom_affichage: "Importer les agents",
      description: "Peut importer les agents",
      categorie: "agents",
    },

    // Rubriques
    {
      code: "rubriques.create",
      nom_affichage: "Créer des rubriques",
      description: "Peut créer des rubriques",
      categorie: "rubriques",
    },
    {
      code: "rubriques.read",
      nom_affichage: "Consulter les rubriques",
      description: "Peut voir les rubriques",
      categorie: "rubriques",
    },
    {
      code: "rubriques.update",
      nom_affichage: "Modifier les rubriques",
      description: "Peut modifier les rubriques",
      categorie: "rubriques",
    },
    {
      code: "rubriques.delete",
      nom_affichage: "Supprimer les rubriques",
      description: "Peut supprimer les rubriques",
      categorie: "rubriques",
    },

    // Utilisateurs
    {
      code: "utilisateurs.create",
      nom_affichage: "Créer des utilisateurs",
      description: "Peut créer des utilisateurs",
      categorie: "utilisateurs",
    },
    {
      code: "utilisateurs.read",
      nom_affichage: "Consulter les utilisateurs",
      description: "Peut voir les utilisateurs",
      categorie: "utilisateurs",
    },
    {
      code: "utilisateurs.update",
      nom_affichage: "Modifier les utilisateurs",
      description: "Peut modifier les utilisateurs",
      categorie: "utilisateurs",
    },
    {
      code: "utilisateurs.delete",
      nom_affichage: "Supprimer les utilisateurs",
      description: "Peut supprimer les utilisateurs",
      categorie: "utilisateurs",
    },

    // Rôles
    {
      code: "roles.create",
      nom_affichage: "Créer des rôles",
      description: "Peut créer des rôles",
      categorie: "roles",
    },
    {
      code: "roles.read",
      nom_affichage: "Consulter les rôles",
      description: "Peut voir les rôles",
      categorie: "roles",
    },
    {
      code: "roles.update",
      nom_affichage: "Modifier les rôles",
      description: "Peut modifier les rôles",
      categorie: "roles",
    },
    {
      code: "roles.delete",
      nom_affichage: "Supprimer les rôles",
      description: "Peut supprimer les rôles",
      categorie: "roles",
    },
  ];

  const permissionsMap: Record<string, number> = {};

  for (const permData of permissionsData) {
    const existing = await prisma.permissions?.findFirst({
      where: { code: permData.code },
    });

    if (!existing) {
      const perm = await prisma.permissions?.create({
        data: permData,
      });
      permissionsMap[permData.code] = perm.id;
      console.log(`✅ Permission créée : "${permData.code}"`);
      created++;
    } else {
      permissionsMap[permData.code] = existing.id;
      skipped++;
    }
  }

  console.log(`📊 ${created} permissions créées, ${skipped} ignorées`);

  // ============================================
  // 3. ATTRIBUTION DES PERMISSIONS AU SUPER ADMIN
  // ============================================
  console.log("\n🔗 Attribution des permissions au Super Administrateur...");

  const superAdminRoleId = rolesMap["Super Administrateur"];

  if (superAdminRoleId) {
    for (const permCode of Object.keys(permissionsMap)) {
      const existing = await prisma.role_permissions?.findFirst({
        where: {
          role_id: superAdminRoleId,
          permission_id: permissionsMap[permCode],
        },
      });

      if (!existing) {
        await prisma.role_permissions?.create({
          data: {
            role_id: superAdminRoleId,
            permission_id: permissionsMap[permCode],
          },
        });
      }
    }
    console.log(`✅ Toutes les permissions attribuées au Super Administrateur`);
  }

  // ============================================
  // 4. CRÉATION DE L'AGENT "digidoc" (D'ABORD)
  // ============================================
  console.log("\n👤 Création de l'agent digidoc...");

  let agentDigidoc = await prisma.agents.findFirst({
    where: { matricule: "ADMIN001" },
  });

  if (!agentDigidoc) {
    agentDigidoc = await prisma.agents.create({
      data: {
        matricule: "ADMIN001",
        nom_complet: "DigiDoc Admin",
        email: "admin@digidoc.local",
        fonction: "Administrateur Système",
        statut: "actif",
      },
    });
    console.log(`✅ Agent créé : "DigiDoc Admin" (Matricule: ADMIN001)`);
  } else {
    console.log(`⏭️  Agent "ADMIN001" existe déjà`);
  }

  // ============================================
  // 5. CRÉATION DU SUPER ADMIN "digidoc" (ENSUITE)
  // ============================================
  console.log("\n🛡️  Création de l'utilisateur super admin...");

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.utilisateurs?.findFirst({
    where: { username: "digidoc" },
  });

  if (!existingUser) {
    // Hasher le mot de passe : "san_gamer77"
    const hashedPassword = await bcrypt.hash("san_gamer77", 10);

    const superAdminUser = await prisma.utilisateurs?.create({
      data: {
        username: "digidoc",
        email: "admin@digidoc.local",
        password: hashedPassword,
        nom_complet: "DigiDoc Admin",
        role_id: superAdminRoleId,
        agent_id: agentDigidoc.id, // ✅ LIEN VERS L'AGENT
        statut: "actif",
        departement: "Administration",
      },
    });

    console.log(`✅ Super Admin créé :`);
    console.log(`   👤 Username: digidoc`);
    console.log(`   🔑 Password: san_gamer77`);
    console.log(`   📧 Email: admin@digidoc.local`);
    console.log(`   🛡️  Rôle: Super Administrateur`);
    console.log(`   🔗 Agent lié: ADMIN001 (${agentDigidoc.nom_complet})`);
  } else {
    console.log(
      `⏭️  Utilisateur "digidoc" existe déjà (ID: ${existingUser.id})`
    );
  }

  // ============================================
  // 6. CRÉATION DES RUBRIQUES
  // ============================================
  console.log("\n📁 Création des rubriques...");

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

  let rubCreated = 0;
  let rubSkipped = 0;

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
      rubCreated++;
    } else {
      console.log(
        `⏭️  Rubrique ignorée (déjà existante) : "${rubrique.nom}" (ID: ${existing.id})`
      );
      rubSkipped++;
    }
  }

  // ============================================
  // RÉSUMÉ FINAL
  // ============================================
  console.log(`\n📊 Résumé du seed :`);
  console.log(`   ✅ Rôles : ${rolesData.length} créés/vérifiés`);
  console.log(`   ✅ Permissions : ${permissionsData.length} créées/vérifiées`);
  console.log(`   ✅ Super Admin : "digidoc" créé/vérifié`);
  console.log(`   ✅ Rubriques : ${rubCreated} créées, ${rubSkipped} ignorées`);
  console.log("\n🎉 Seed terminé avec succès !");
  console.log("\n🔐 Pour vous connecter :");
  console.log("   Username: digidoc");
  console.log("   Password: san_gamer77");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

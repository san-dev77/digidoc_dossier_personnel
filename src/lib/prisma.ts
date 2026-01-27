import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Log de configuration (masqué pour la sécurité)
const dbUrl = process.env.DATABASE_URL || "NON DÉFINI";
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
console.log(`[PRISMA] Initialisation avec DB: ${maskedUrl}`);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Petit test de connexion au démarrage
if (typeof window === "undefined") {
  prisma.$connect()
    .then(() => console.log("[PRISMA] ✅ Connexion réussie à la base de données"))
    .catch((err: any) => console.error("[PRISMA] ❌ Échec de connexion:", err));
}

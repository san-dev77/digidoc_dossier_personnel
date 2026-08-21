import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/password";
import { issueSessionForUser } from "@/lib/auth/completeLogin";
import {
  isLocked,
  registerFailedAttempt,
  resetFailedAttempts,
} from "@/lib/auth/lockout";
import { createMfaChallenge, maskPhone } from "@/lib/mfa/otp";
import { sendSmsOtp } from "@/lib/mfa/smsProvider";
import { authenticateAgainstLdap } from "@/lib/ldap/ldapClient";
import { withLogging } from "@/lib/apiLogger";
import { logger } from "@/lib/logger";

/**
 * POST /api/auth/login-unified
 * Connexion unifiée : détecte automatiquement si c'est un utilisateur ou un agent
 */
export const POST = withLogging("auth.login-unified", async (req: NextRequest) => {
  console.log("[LOGIN-UNIFIED] 📥 Requête de connexion reçue");

  try {
    console.log("[LOGIN-UNIFIED] 📥 Lecture du corps de la requête...");
    const body = await req.json();
    const { identifier, password } = body;
    console.log("[LOGIN-UNIFIED] 🔍 Identifiant reçu:", identifier);
    console.log("[LOGIN-UNIFIED] 🔍 Password reçu (longueur):", password?.length || 0);

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Champs manquants" },
        { status: 400 }
      );
    }

    // ============================================
    // TENTATIVE 1 : Chercher dans UTILISATEURS
    // ============================================
    console.log("[LOGIN-UNIFIED] 🔎 Recherche utilisateur dans la DB...");
    const utilisateur = await prisma.utilisateurs.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
      },
      include: {
        roles: true,
        agents: true, // Inclure l'agent lié si existe
      },
    });
    console.log("[LOGIN-UNIFIED] 🔎 Recherche utilisateur terminée. Trouvé:", !!utilisateur);

    if (utilisateur) {
      console.log("[LOGIN-UNIFIED] ✅ Trouvé en tant qu'UTILISATEUR");

      // Vérifier le statut
      if (utilisateur.statut !== "actif") {
        logger.warning(`Tentative de connexion sur un compte ${utilisateur.statut}`, {
          context: "auth.login-unified",
          meta: { identifier, statut: utilisateur.statut },
        });
        return NextResponse.json(
          { message: "Compte inactif ou suspendu" },
          { status: 403 }
        );
      }

      // Vérifier le verrouillage (échecs répétés)
      if (isLocked(utilisateur)) {
        logger.warning("Tentative de connexion sur un compte verrouillé", {
          context: "auth.lockout",
          meta: { identifier, userId: utilisateur.id, lockedUntil: utilisateur.locked_until },
        });
        return NextResponse.json(
          {
            message:
              "Compte temporairement verrouillé suite à plusieurs échecs. Réessayez plus tard.",
            lockedUntil: utilisateur.locked_until,
          },
          { status: 423 }
        );
      }

      // Vérifier les identifiants : compte local (bcrypt) ou LDAP selon
      // auth_source. LDAP reste désactivable globalement (app_settings) —
      // si désactivé alors qu'un compte y est rattaché, on refuse plutôt
      // que de basculer silencieusement sur le mot de passe local (jamais
      // valide pour un compte LDAP, qui n'en a pas de fiable en base).
      let credentialsValid = false;
      let ldapSync: Partial<{
        ldap_dn: string;
        nom_complet: string;
        email: string;
        telephone: string;
      }> = {};

      if (utilisateur.auth_source === "ldap") {
        console.log("[LOGIN-UNIFIED] 🔐 Authentification LDAP...");
        const ldapResult = await authenticateAgainstLdap(identifier, password);
        if (ldapResult.ok) {
          credentialsValid = true;
          ldapSync = {
            ldap_dn: ldapResult.user.dn,
            ...(ldapResult.user.displayName && {
              nom_complet: ldapResult.user.displayName,
            }),
            ...(ldapResult.user.mail && { email: ldapResult.user.mail }),
            ...(ldapResult.user.telephoneNumber && {
              telephone: ldapResult.user.telephoneNumber,
            }),
          };
        } else {
          logger.warning(`Échec d'authentification LDAP : ${ldapResult.reason}`, {
            context: "auth.ldap",
            meta: { identifier, reason: ldapResult.reason },
          });
        }
      } else {
        console.log("[LOGIN-UNIFIED] 🔐 Vérification du mot de passe local...");
        credentialsValid = await comparePassword(password, utilisateur.password);
      }
      console.log("[LOGIN-UNIFIED] 🔐 Résultat vérification:", credentialsValid);

      if (!credentialsValid) {
        const { locked, attemptsRemaining } = await registerFailedAttempt(
          utilisateur.id
        );
        if (locked) {
          logger.error("Compte verrouillé après trop d'échecs de connexion", {
            context: "auth.lockout",
            meta: { identifier, userId: utilisateur.id },
          });
        } else {
          logger.warning("Identifiants invalides", {
            context: "auth.login-unified",
            meta: { identifier, attemptsRemaining, authSource: utilisateur.auth_source },
          });
        }
        return NextResponse.json(
          locked
            ? {
                message:
                  "Compte verrouillé suite à plusieurs échecs. Réessayez plus tard.",
              }
            : { message: "Identifiants incorrects", attemptsRemaining },
          { status: locked ? 423 : 401 }
        );
      }

      // Réinitialiser le compteur d'échecs après une connexion réussie
      await resetFailedAttempts(utilisateur.id);

      // Synchronisation JIT des attributs depuis l'annuaire (nom, e-mail,
      // téléphone) — garde le compte local à jour sans intervention manuelle.
      if (Object.keys(ldapSync).length > 0) {
        await prisma.utilisateurs.update({
          where: { id: utilisateur.id },
          data: ldapSync,
        });
        Object.assign(utilisateur, ldapSync);
      }

      const { password: _, ...utilisateurSafe } = utilisateur;

      // Compte exempté de MFA (secours local, ex: digidoc) : connexion directe
      if (utilisateur.mfa_exempt) {
        console.log("[LOGIN-UNIFIED] 🎫 Compte exempté de MFA — création de la session...");
        const token = await issueSessionForUser(utilisateur, req);

        logger.success(`Connexion réussie (sans MFA) : ${utilisateur.username}`, {
          context: "auth.login-unified",
          meta: { userId: utilisateur.id, username: utilisateur.username },
        });

        return NextResponse.json({
          ...utilisateurSafe,
          token,
          accountType: "utilisateur",
          mustChangePassword: utilisateur.must_change_password,
        });
      }

      // Sinon : mot de passe validé, mais la session n'est émise qu'après
      // vérification du code MFA (voir /api/auth/mfa/verify).
      if (!utilisateur.telephone) {
        logger.error(
          "Connexion bloquée : aucun téléphone enregistré pour l'envoi du code MFA",
          { context: "auth.mfa", meta: { userId: utilisateur.id } }
        );
        return NextResponse.json(
          {
            message:
              "Aucun numéro de téléphone n'est enregistré sur ce compte pour l'authentification à deux facteurs. Contactez un administrateur.",
          },
          { status: 400 }
        );
      }

      const maskedDestination = maskPhone(utilisateur.telephone);
      const { challengeId, code } = await createMfaChallenge(
        utilisateur.id,
        "sms",
        maskedDestination
      );
      await sendSmsOtp(utilisateur.telephone, code);

      logger.success(`Code MFA envoyé par SMS : ${utilisateur.username}`, {
        context: "auth.mfa",
        meta: { userId: utilisateur.id, challengeId },
      });

      return NextResponse.json({
        mfaRequired: true,
        challengeId,
        maskedDestination,
        channel: "sms",
      });
    }

    // ============================================
    // TENTATIVE 2 : Chercher dans AGENTS (Legacy)
    // ============================================
    console.log("[LOGIN-UNIFIED] 🔎 Recherche AGENT (legacy) dans la DB...");
    const agent = await prisma.agents.findFirst({
      where: { matricule: identifier },
    });
    console.log("[LOGIN-UNIFIED] 🔎 Recherche AGENT terminée. Trouvé:", !!agent);

    if (agent) {
      console.log("[LOGIN-UNIFIED] ⚠️  Trouvé en tant qu'AGENT (legacy)");
      
      // Les agents n'ont plus de password dans le nouveau système
      return NextResponse.json(
        { 
          message: "Ce compte agent n'a pas accès à l'application. Contactez un administrateur pour créer un compte utilisateur.",
          hint: "Les agents doivent avoir un compte utilisateur pour se connecter"
        },
        { status: 403 }
      );
    }

    // ============================================
    // AUCUN COMPTE TROUVÉ
    // ============================================
    console.log("[LOGIN-UNIFIED] ❌ Aucun compte trouvé");
    return NextResponse.json(
      { message: "Identifiants incorrects" },
      { status: 401 }
    );

  } catch (e: any) {
    console.error("[LOGIN-UNIFIED] ❌ Erreur fatale:", e);
    logger.error(e?.message || "Erreur de connexion inconnue", {
      context: "auth.login-unified",
      meta: { stack: e?.stack },
    });
    return NextResponse.json(
      {
        message: "Erreur serveur interne",
        error: e?.message || "Erreur inconnue",
        stack: process.env.NODE_ENV === "development" ? e?.stack : undefined
      },
      { status: 500 }
    );
  }
});


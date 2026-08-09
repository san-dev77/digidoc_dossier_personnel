# Audit du projet Digi-Doc / Dossier Personnel

Date de l'audit : 2026-08-07
Périmètre : authentification & permissions, upload & stockage de fichiers, logique métier & isolation des données entre agents, dette technique générale.

Légende priorité : 🔴 Critique (à traiter avant toute mise en prod / exposition externe) · 🟠 Majeure (à planifier rapidement) · 🟡 Mineure (à traiter quand possible)

---

## 1. Authentification & JWT

| # | Problème | Fichier(s) | Priorité | Amélioration proposée |
|---|---|---|---|---|
| 1.1 | Secret JWT avec fallback par défaut codé en dur (`"changez-moi-en-production-urgence"`) si `JWT_SECRET` absent — permet de forger un token super_admin | `src/lib/auth/jwt.ts`, `src/lib/auth/jwt-edge.ts` | 🔴 Critique | Faire échouer le démarrage de l'app (`throw`) si `JWT_SECRET` n'est pas défini, jamais de fallback |
| 1.2 | `DATABASE_URL` avec identifiants par défaut `root:root` si variable d'env absente | `src/lib/db.ts` | 🔴 Critique | Même traitement que 1.1 : échec explicite au démarrage plutôt que credentials par défaut |
| 1.3 | Aucun rate-limit sur les 3 routes de login ; `rateLimitConfigs.login` défini mais jamais utilisé | `src/app/api/auth/login/route.ts`, `login-user/route.ts`, `login-unified/route.ts`, `src/lib/rateLimit.ts` | 🔴 Critique | Appliquer `checkRateLimit(req, rateLimitConfigs.login)` sur les 3 routes, comme déjà fait pour `register` |
| 1.4 | Rate-limiting contournable : `getClientIP()` fait confiance à `x-forwarded-for`/`x-real-ip` envoyés par le client, sans proxy de confiance vérifié | `src/lib/rateLimit.ts` | 🟠 Majeure | N'utiliser ces en-têtes que derrière un reverse-proxy configuré pour les écraser ; sinon IP socket réelle. Passer à un store partagé (Redis) en prod |
| 1.5 | Chemin d'authentification legacy en mot de passe clair (`agent.password === password`), comparaison non timing-safe | `src/app/api/auth/login/route.ts` | 🟠 Majeure | Migrer tous les comptes vers bcrypt, supprimer le chemin clair, comparaison constante en transition |
| 1.6 | Déconnexion purement côté client (`sessionStorage.removeItem`) — aucune révocation serveur, token valide 7 jours même après logout/désactivation de compte | `src/services/auth.ts` | 🟠 Majeure | Table de sessions ou `token_version` en base vérifié à chaque requête ; réduire la durée de vie du token |
| 1.7 | Token JWT complet loggé en clair dans la console navigateur | `src/app/login/page.tsx` | 🟠 Majeure | Supprimer ces `console.log` ou les conditionner à `NODE_ENV === "development"` |
| 1.8 | `/api/auth/register` : validation Zod existante mais jamais appliquée côté serveur | `src/app/api/auth/register/route.ts`, `src/lib/validation/schemas.ts` | 🟠 Majeure | Valider les schémas Zod dans la route elle-même, pas seulement côté formulaire front |
| 1.9 | `SALT_ROUNDS = 10` pour bcrypt, sous la recommandation actuelle (12) | `src/lib/auth/password.ts` | 🟡 Mineure | Passer à 12 |
| 1.10 | Logging verbeux en production (matricule, longueur mdp, résultat de vérification) | `middleware.ts`, `jwt.ts`, `jwt-edge.ts`, routes de login | 🟡 Mineure | Conditionner par `NODE_ENV` ou retirer |

---

## 2. Contrôle d'accès (RBAC / autorisations)

| # | Problème | Fichier(s) | Priorité | Amélioration proposée |
|---|---|---|---|---|
| 2.1 | `/api/agent-rubriques` totalement public (lecture + écriture), listé par erreur dans `publicRoutes` à deux endroits | `middleware.ts`, `src/lib/auth/middleware.ts` (`requireAuth`) | 🔴 Critique | Retirer `/api/agent-rubriques` des deux listes `publicRoutes` |
| 2.2 | ~40 routes API sur 48 ne vérifient qu'un « token valide », jamais le rôle/la permission (`requirePermission` utilisé sur 7 routes seulement) | Ex. `src/app/api/agents/[id]/route.ts` (PUT sans aucune vérif), et la majorité de `src/app/api/**` | 🔴 Critique | Appliquer systématiquement `requirePermission("<ressource>.<action>")` sur toutes les routes de mutation, sur le modèle déjà utilisé pour `utilisateurs`/`roles` |
| 2.3 | IDOR sur les fichiers : `GET`/`DELETE /api/files/[id]` ne vérifient jamais que l'appelant a le droit d'accéder à ce document précis | `src/app/api/files/[id]/route.ts` | 🔴 Critique | Vérifier l'appartenance du fichier au contexte de l'utilisateur (rôle RH/admin ou agent propriétaire) avant lecture/suppression |
| 2.4 | `file-explorer` expose l'arborescence complète de `uploads/` (noms complets d'agents inclus) à tout utilisateur authentifié | `src/app/api/file-explorer/route.ts` | 🟠 Majeure | Restreindre aux rôles admin/RH |
| 2.5 | Élévation de privilèges possible via modification de `role_id` sur soi-même ou vers un rôle système, avec la seule permission générique `utilisateurs.update` | `src/app/api/utilisateurs/[id]/route.ts` | 🟠 Majeure | Interdire l'auto-modification de son propre `role_id` ; permission dédiée pour attribuer un rôle `is_system` |
| 2.6 | Deux systèmes de RBAC parallèles non synchronisés : config statique 4 rôles vs table dynamique `roles`/`permissions` en base | `src/config/permissions.ts` vs `prisma/schema.prisma` (`roles`, `permissions`, `role_permissions`) | 🟠 Majeure | Choisir un seul système source de vérité (recommandé : la table dynamique) et supprimer l'autre |
| 2.7 | `getUserFromRequest.ts` lit des en-têtes `x-user-*` posés sur la mauvaise cible par le middleware (réponse au lieu de la requête) — code mort mais trompeur pour un futur développeur | `src/lib/auth/getUserFromRequest.ts`, `middleware.ts` | 🟡 Mineure | Supprimer le fichier, ou corriger la pose des en-têtes et purger tout `x-user-*` entrant côté client |
| 2.8 | Aucune contrainte de robustesse de mot de passe côté serveur en appel API direct (seulement côté formulaire) | `src/app/api/utilisateurs/route.ts` | 🟡 Mineure | Appliquer `passwordSchema` (Zod) côté serveur |
| 2.9 | `validateAccess()` : stub non implémenté (« on accepte tout »), jamais appelé mais laisse un faux sentiment de sécurité | `src/services/validation/FileValidator.ts` | 🟡 Mineure | Implémenter ou supprimer la fonction |

---

## 3. Upload & stockage de fichiers

| # | Problème | Fichier(s) | Priorité | Amélioration proposée |
|---|---|---|---|---|
| 3.1 | Path traversal potentiel : le chemin est construit via `path.join` sans vérifier que le résultat reste sous `uploads/` | `src/app/api/files/[...path]/route.ts` | 🔴 Critique | `path.resolve` + vérification du préfixe (`startsWith(baseDir)`) et rejet de tout segment `..` avant `path.join` |
| 3.2 | `EncryptionService` jamais appelé — tous les documents (pièces d'identité, dossiers de crédit) sont stockés en clair sur disque malgré l'infrastructure existante | `src/services/storage/EncryptionService.ts`, `src/app/api/upload/route.ts`, `pieces/[id]/upload/route.ts`, `credit-upload/route.ts` | 🔴 Critique | Brancher réellement le chiffrement dans le pipeline d'upload/lecture ; clé hors du repo (variable d'env dédiée / KMS) |
| 3.3 | Si utilisé un jour, `EncryptionService` repose sur `crypto.createCipher`/`createDecipher` (API dépréciée, dérivation de clé faible) | `src/services/storage/EncryptionService.ts` | 🟠 Majeure | Remplacer par `createCipheriv`/`createDecipheriv` avec IV explicite |
| 3.4 | Validation de type de fichier basée uniquement sur MIME/extension fournis par le client ; `validateMagicBytes` existe mais n'est jamais appelée | `src/services/validation/FileValidator.ts` | 🟠 Majeure | Appeler `validateMagicBytes` dans `validateFile` et rejeter en cas de mismatch signature/extension |
| 3.5 | Extension de fichier non re-validée au point d'écriture final (dépend uniquement du contrôle en amont) | `src/config/storage.ts` (`generateAgentFileName`) | 🟡 Mineure | Whitelister l'extension aussi à ce niveau, en filet de sécurité |
| 3.6 | Nom de fichier « sécurisé » basé sur un hash résolu à la milliseconde — collision possible en cas d'upload concurrent | `src/services/storage/FileManager.ts` (`generateSecureFileName`, actuellement non utilisé par les routes actives) | 🟡 Mineure | Utiliser `crypto.randomUUID()` |
| 3.7 | `containsSuspiciousContent` ne génère qu'un avertissement, jamais un blocage (ex. `shell.php.pdf` passe sans alerte) | `src/services/validation/FileValidator.ts` | 🟡 Mineure | Étendre la détection aux extensions doubles et bloquer, pas seulement avertir |

---

## 4. Isolation des données entre agents (mélange de données)

> Contexte : un bug de ce type a déjà été corrigé une fois (commit `08b09c9`, filtre par `sous_dossier_id` au lieu de `agent_dossier_id`). Le pattern existe encore ailleurs.

| # | Problème | Fichier(s) | Priorité | Amélioration proposée |
|---|---|---|---|---|
| 4.1 | `GET /api/pieces` retourne les métadonnées/fichiers de **tous** les agents si `agentDossierId` n'est pas fourni — appelée sans ce paramètre depuis 2 endroits actifs | `src/app/api/pieces/route.ts`, `src/app/rubriques/[id]/parametres/page.tsx`, `src/components/dossiers/QuickCreateDossierModal.tsx` | 🔴 Critique | Rendre `agentDossierId` obligatoire, retourner `[]` sinon (comme dans `pieces/[id]/files/route.ts`) |
| 4.2 | `GET /api/pieces/[id]/metadata` ne rend pas `agentDossierId` obligatoire, contrairement à sa route sœur déjà corrigée | `src/app/api/pieces/[id]/metadata/route.ts` | 🔴 Critique | Appliquer le même garde-fou que `pieces/[id]/files/route.ts` |
| 4.3 | `GET /api/credit-upload` conserve un fallback `sous_dossier_id` seul qui remonte les entrées de tous les agents du sous-dossier | `src/app/api/credit-upload/route.ts` | 🔴 Critique | Supprimer le fallback, exiger `agent_dossier_id` systématiquement |
| 4.4 | `GET/PUT/DELETE /api/meta-credit-values` jamais filtré par agent — fuite + IDOR sur modification/suppression | `src/app/api/meta-credit-values/route.ts` | 🔴 Critique | Ajouter `agent_dossier_id` obligatoire au filtre GET ; vérifier la propriété avant PUT/DELETE |
| 4.5 | 4 fichiers de service dupliqués et morts contenant encore l'ancien pattern non filtré (risque de réintroduction future du bug) | `src/services/dossiers-fast.ts`, `dossiers-ultra-fast.ts`, `dossiers.tsx` (vide), `src/components/AgentDataViewer.tsx`, `src/components/SousDossierCard.tsx` (racine) | 🟠 Majeure | Supprimer ces fichiers après confirmation qu'ils ne sont plus référencés |
| 4.6 | Page de paramétrage de rubrique appelle `getPiecesWithMetadata` sans `agentDossierId` — à clarifier si affichage générique voulu ou fuite | `src/app/rubriques/[id]/parametres/page.tsx` | 🟠 Majeure | Documenter l'intention ou corriger comme 4.1 |
| 4.7 | Casts `(prisma as any).credit_dossier_entries` incohérents (parfois castés, parfois non dans le même fichier) — trace d'une désynchronisation schéma/client jamais nettoyée | `src/app/api/credit-entries/[id]/route.ts`, `src/app/api/credit-upload/route.ts` | 🟡 Mineure | Régénérer le client Prisma, retirer les casts `as any` |

---

## 5. Intégrité des données & transactions

| # | Problème | Fichier(s) | Priorité | Amélioration proposée |
|---|---|---|---|---|
| 5.1 | Transactions SQL non atomiques : chaque `query()` prend/relâche une connexion différente du pool, donc `BEGIN`/`INSERT`/`COMMIT`/`ROLLBACK` ne s'exécutent pas sur la même connexion → positions corrompues en cas d'échec partiel | `src/app/api/pieces/positions/route.ts`, `src/app/api/sous-dossiers/positions/route.ts`, `src/lib/db.ts` | 🟠 Majeure | Réutiliser une seule connexion (`db.getConnection()`) pour toute la séquence, ou migrer vers `prisma.$transaction` |
| 5.2 | Fichiers physiques orphelins à la suppression d'un `agent_dossiers` — les lignes DB sont supprimées en cascade mais pas les fichiers sur disque | `src/app/api/agent-dossiers/[id]/route.ts` | 🟠 Majeure | Supprimer les fichiers physiques référencés avant le `delete`, sur le modèle de `credit-entries/[id]/route.ts` |
| 5.3 | Suppression d'une entrée de crédit sans transaction Prisma explicite (fichiers, `deleteMany`, `delete` en séquence) | `src/app/api/credit-entries/[id]/route.ts` | 🟡 Mineure | Envelopper les étapes dans `prisma.$transaction` |

---

## 6. Dette technique & qualité générale

| # | Problème | Fichier(s) / Portée | Priorité | Amélioration proposée |
|---|---|---|---|---|
| 6.1 | Documents personnels réels (pièces d'identité, noms complets d'agents) committés dans l'historique Git — 159 fichiers au total, dossier `uploads/` absent de `.gitignore` | `.gitignore`, historique Git | 🔴 Critique | Ajouter `uploads/` à `.gitignore` immédiatement ; nettoyer l'historique (`git filter-repo`) en coordination avec toute personne ayant un clone |
| 6.2 | Aucun test automatisé dans tout le projet | Ensemble du repo | 🟠 Majeure | Introduire des tests a minima sur les routes API sensibles (auth, permissions, filtrage par agent) pour éviter la réapparition de bugs déjà corrigés |
| 6.3 | Documentation éclatée en 14 fichiers `.md` à la racine, risque de divergence avec le code réel | `README.md`, `AUTHENTIFICATION.md`, `MIGRATION_GUIDE.md`, `DEPLOIEMENT-COMPLET.md`, etc. | 🟡 Mineure | Consolider en un dossier `docs/` structuré, supprimer les doublons (ex. `MIGRATION_GUIDE.md` vs `MIGRATION_MYSQL.md` vs `RESUME_MIGRATION.md`) |
| 6.4 | Fichiers `build_output*.txt` committés à la racine (artefacts de debug) | `build_output.txt`, `build_output_2.txt`, `build_output_3.txt` | 🟡 Mineure | Supprimer et ajouter au `.gitignore` |

---

## Plan d'action recommandé (ordre de traitement)

1. **Immédiat** : 6.1 (retirer `uploads/` du suivi Git + `.gitignore`), 1.1, 1.2 (fallbacks de secrets), 2.1 (route publique par erreur), 3.1 (path traversal).
2. **Cette semaine** : 2.2, 2.3 (autorisations manquantes / IDOR), 4.1 à 4.4 (fuites de données entre agents), 1.3 (rate-limit login).
3. **Ce mois-ci** : 3.2/3.4 (chiffrement et validation de fichiers), 5.1/5.2 (intégrité transactionnelle), 2.6 (unifier le RBAC), 4.5 (nettoyage code mort).
4. **En continu** : points mineurs (logs, salt rounds, documentation, tests).

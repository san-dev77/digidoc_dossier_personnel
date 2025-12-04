# 🛡️ Guide du Système Utilisateurs

## 🚀 Installation Rapide

### Avec le Script Automatique (Recommandé)

```powershell
.\scripts\init-users-system.ps1
```

### Manuel

```bash
# 1. Générer Prisma
npm run db:generate

# 2. Créer les tables
npm run db:push

# 3. Seed (rôles, permissions, super admin)
npm run db:seed
```

---

## 👤 Premier Utilisateur Créé Automatiquement

Lors du seed, un super admin est créé :

```
👤 Username : digidoc
🔑 Password : Digidoc2025!
📧 Email    : admin@digidoc.local
🛡️  Rôle     : Super Administrateur
```

---

## 🔐 Connexion

### Pour les Utilisateurs (Nouveau Système)

**Route** : `/api/auth/login-user`

```typescript
POST /api/auth/login-user
{
  "username": "digidoc",  // ou email
  "password": "Digidoc2025!"
}
```

### Pour les Agents (Ancien Système)

**Route** : `/api/auth/login`

```typescript
POST /api/auth/login
{
  "matricule": "...",
  "password": "..."
}
```

---

## 🗄️ Architecture Base de Données

```
utilisateurs (Comptes de connexion)
├── username, email, password
├── role_id → roles
└── utilisateur_permissions (overrides)

roles (Rôles personnalisables)
├── nom (modifiable)
├── description
├── couleur (UI)
└── is_system (non supprimable)

permissions (43 permissions fixes)
├── code (ex: "agents.create")
├── nom_affichage
├── categorie
└── description

role_permissions
├── role_id
└── permission_id

utilisateur_permissions (Overrides)
├── utilisateur_id
├── permission_id
├── type (grant/revoke)
└── reason

agents (Personnel géré)
├── matricule
├── nom_complet
└── ... (pas de password!)
```

---

## 🎯 4 Rôles Par Défaut

### 🔴 Super Administrateur
- ✅ Toutes les permissions
- ✅ Gestion des utilisateurs
- ✅ Gestion des rôles
- ✅ Non supprimable

### 🟠 Administrateur RH
- ✅ Gestion complète agents/dossiers
- ✅ Consultation utilisateurs
- ❌ Pas de gestion utilisateurs
- ❌ Pas de modification rôles

### 🔵 Gestionnaire
- ✅ Création/modification agents
- ✅ Création/modification dossiers
- ❌ Pas de suppression
- ❌ Pas de gestion utilisateurs

### 🟢 Consultant
- ✅ Lecture seule
- ✅ Export rapports
- ❌ Aucune modification
- ❌ Pas de gestion utilisateurs

---

## 📋 Permissions Disponibles

### Agents (6)
- `agents.create`, `agents.read`, `agents.update`
- `agents.delete`, `agents.export`, `agents.import`

### Rubriques (4)
- `rubriques.create`, `rubriques.read`
- `rubriques.update`, `rubriques.delete`

### Utilisateurs (4)
- `utilisateurs.create`, `utilisateurs.read`
- `utilisateurs.update`, `utilisateurs.delete`

### Rôles (4)
- `roles.create`, `roles.read`
- `roles.update`, `roles.delete`

---

## 🔧 Utilisation du Système

### Backend : Protéger une Route API

```typescript
import { requirePermission } from "@/lib/permissions/permissionMiddleware";

export async function DELETE(req: NextRequest) {
  // Vérifier la permission
  const authError = await requirePermission('agents.delete')(req);
  if (authError) return authError;
  
  // Code de suppression...
}
```

### Frontend : Vérifier les Permissions

```typescript
import { usePermissions } from "@/hooks/usePermissions";

function MonComposant() {
  const { hasPermission, canDelete, isAdmin } = usePermissions();
  
  return (
    <>
      {hasPermission('agents', 'create') && (
        <button>Créer Agent</button>
      )}
      
      {canDelete && (
        <button>Supprimer</button>
      )}
    </>
  );
}
```

---

## 🎯 Permissions Individuelles (Overrides)

### Accorder une Permission

```typescript
import { grantPermission } from "@/lib/permissions/permissionService";

// Donner la permission de supprimer à un utilisateur spécifique
await grantPermission(
  userId,
  'agents.delete',
  adminId,
  'Besoin temporaire pour nettoyer les données'
);
```

### Révoquer une Permission

```typescript
import { revokePermission } from "@/lib/permissions/permissionService";

// Retirer une permission même si le rôle la possède
await revokePermission(
  userId,
  'users.delete',
  adminId,
  'Restriction temporaire'
);
```

---

## 📊 Audit et Traçabilité

Toutes les actions importantes sont loggées dans `audit_logs` :

```sql
SELECT 
  u.nom_complet,
  a.action,
  a.entity_type,
  a.description,
  a.created_at
FROM audit_logs a
JOIN utilisateurs u ON a.utilisateur_id = u.id
ORDER BY a.created_at DESC
LIMIT 50;
```

---

## ✅ Checklist de Démarrage

- [ ] `npm run db:generate` exécuté
- [ ] `npm run db:push` exécuté
- [ ] `npm run db:seed` exécuté
- [ ] Utilisateur "digidoc" créé
- [ ] Connexion testée
- [ ] Page `/utilisateurs` accessible
- [ ] Permissions testées

---

## 🔄 Migration des Agents Existants

Si vous avez des agents qui doivent devenir utilisateurs :

```sql
-- Créer un utilisateur à partir d'un agent
INSERT INTO utilisateurs (username, email, password, nom_complet, role_id, statut)
SELECT 
  matricule,
  email,
  password,
  nom_complet,
  3, -- Gestionnaire par défaut
  'actif'
FROM agents
WHERE email IS NOT NULL AND password IS NOT NULL;
```

---

## 🎉 Système Opérationnel !

Vous disposez maintenant de :
- ✅ Système RBAC complet
- ✅ Permissions granulaires
- ✅ Overrides individuels
- ✅ Audit trail
- ✅ Interface de gestion

**Pour démarrer : `.\scripts\init-users-system.ps1`** 🚀


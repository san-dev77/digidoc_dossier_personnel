# 🛡️ Système de Rate Limiting

## ✅ Implémentation

Le rate limiting a été implémenté pour protéger l'application contre les attaques brute force et DoS.

## 📊 Configuration

### Routes de Login (`/api/auth/login`)

- **Limite** : 5 tentatives par IP
- **Fenêtre** : 15 minutes
- **Message** : "Trop de tentatives de connexion. Réessayez dans quelques minutes."

### Routes de Register (`/api/auth/register`)

- **Limite** : 3 tentatives par IP
- **Fenêtre** : 1 heure
- **Message** : "Trop de tentatives d'inscription. Réessayez dans une heure."

### Routes API générales

- **Limite** : 100 requêtes par IP
- **Fenêtre** : 1 minute
- **Message** : "Trop de requêtes. Réessayez dans quelques secondes."

## 🔧 Fonctionnement

### Détection de l'IP

Le système détecte l'IP réelle du client en vérifiant plusieurs headers :

1. `x-forwarded-for` (pour les proxies/load balancers)
2. `x-real-ip` (pour Nginx)
3. `cf-connecting-ip` (pour Cloudflare)
4. `request.ip` (fallback)

### Stockage

- **Développement** : Stockage en mémoire (Map)
- **Production recommandé** : Redis ou base de données pour la persistance entre redémarrages

### Nettoyage automatique

Les entrées expirées sont automatiquement nettoyées pour éviter les fuites mémoire.

## 📝 Headers de réponse

Chaque réponse inclut des headers informatifs :

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 2024-01-15T10:30:00.000Z
```

En cas de dépassement :

```
HTTP 429 Too Many Requests
Retry-After: 900
```

## 🚫 Comportement en cas de dépassement

Quand la limite est dépassée :

1. La requête est bloquée immédiatement
2. Un code HTTP 429 est retourné
3. Un message d'erreur clair est fourni
4. Le header `Retry-After` indique le temps d'attente en secondes

## ⚠️ Notes importantes

### Utilisateurs légitimes

- Les utilisateurs légitimes ne sont **PAS** bloqués
- Le rate limiting fonctionne par **IP**, pas par utilisateur
- Un utilisateur qui se reconnecte après une déconnexion n'est pas affecté

### Production

Pour la production, considérez :

- Utiliser Redis pour le stockage distribué
- Ajuster les limites selon votre trafic
- Monitorer les IPs bloquées
- Implémenter un système de whitelist pour les IPs de confiance

## 🔄 Exemple d'utilisation

```typescript
// Dans une route API
import { checkRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Vérifier le rate limiting
  const rateLimitResult = checkRateLimit(req, rateLimitConfigs.login);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  // Traiter la requête normalement
  // ...
}
```

## 📈 Statistiques

Le système enregistre :

- Nombre de tentatives par IP
- Temps de réinitialisation
- État de blocage

Ces informations peuvent être utilisées pour le monitoring et l'analyse des attaques.

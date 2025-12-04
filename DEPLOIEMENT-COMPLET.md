# Guide de déploiement complet - Digi-Doc

Guide complet pour déployer Digi-Doc sur Red Hat avec HTTPS.

## 📦 Prérequis sur le serveur

- Red Hat / CentOS / Rocky Linux 8+
- Node.js 18+ installé
- PostgreSQL installé et configuré
- Accès root (sudo)

## 🚀 Déploiement en 5 étapes

### 1. Transférer les fichiers sur le serveur

```bash
# Option A : Via Git (recommandé)
ssh votre-serveur
cd /opt
git clone votre-repo dossier_personnel
cd dossier_personnel

# Option B : Via SCP
scp -r dossier_personnel/ user@serveur:/opt/dossier_personnel
```

### 2. Installer les dépendances

```bash
cd /opt/dossier_personnel

# Installer les dépendances Node.js
npm install

# Générer Prisma Client
npm run db:generate

# Construire l'application
npm run build
```

### 3. Configurer la base de données

```bash
# Créer le fichier .env
cat > .env << 'EOF'
DATABASE_URL=postgres://postgres:VOTRE_PASSWORD@localhost:5432/digidoc_personnel
JWT_SECRET=VOTRE_SECRET_JWT_TRES_LONG_ET_SECURISE
NODE_ENV=production
EOF

# Appliquer le schéma de base de données
npm run db:push

# Optionnel : Seed initial
npm run db:seed
```

### 4. Installer HTTPS (SSL auto-signé)

```bash
# Installation automatique en une commande
sudo bash scripts/setup-ssl-auto.sh
```

### 5. Démarrer l'application en production

```bash
# Option A : Simple (pour tester)
npm run start

# Option B : Avec PM2 (recommandé pour production)
npm install -g pm2
pm2 start npm --name digidoc -- start
pm2 save
pm2 startup
```

## ✅ Vérification

```bash
# L'application doit être accessible via HTTPS
curl -k https://localhost

# Ou depuis un navigateur
# https://VOTRE_IP_SERVEUR
```

## 🔒 Sécurité supplémentaire (optionnel)

### Limiter l'accès SSH

```bash
# Modifier /etc/ssh/sshd_config
sudo nano /etc/ssh/sshd_config

# Changer le port SSH (exemple: 2222)
# Port 2222
# PermitRootLogin no
# PasswordAuthentication no (après avoir configuré les clés SSH)

sudo systemctl restart sshd
```

### Configurer un pare-feu restrictif

```bash
# Autoriser uniquement les ports nécessaires
sudo firewall-cmd --permanent --remove-service=cockpit
sudo firewall-cmd --permanent --remove-service=dhcpv6-client
sudo firewall-cmd --reload
```

## 📊 Monitoring

### Logs en temps réel

```bash
# Logs de l'application
pm2 logs digidoc

# Logs Nginx
sudo tail -f /var/log/nginx/digidoc_error.log
sudo tail -f /var/log/nginx/digidoc_access.log

# Logs système
sudo journalctl -u nginx -f
```

### Surveillance des ressources

```bash
# Installer htop
sudo dnf install -y htop

# Surveiller les ressources
htop

# Ou avec PM2
pm2 monit
```

## 🔄 Mises à jour

### Mettre à jour l'application

```bash
cd /opt/dossier_personnel

# Via Git
git pull origin main

# Réinstaller les dépendances si nécessaire
npm install

# Rebuild
npm run build

# Relancer l'application
pm2 restart digidoc

# Ou si pas de PM2
# Ctrl+C puis npm run start
```

### Mettre à jour le certificat SSL (après 365 jours)

```bash
sudo bash scripts/setup-ssl-auto.sh
```

## 🔧 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
pm2 logs digidoc --lines 100

# Vérifier la connexion à la base de données
psql -U postgres -d digidoc_personnel -c "SELECT 1;"

# Vérifier les variables d'environnement
cat .env
```

### Nginx ne démarre pas

```bash
# Vérifier la configuration
sudo nginx -t

# Voir les erreurs
sudo journalctl -u nginx --no-pager -n 50

# Vérifier que le port 3000 est utilisé
sudo netstat -tlnp | grep 3000
```

### Problèmes de connexion HTTPS

```bash
# Vérifier que le port 443 est ouvert
sudo firewall-cmd --list-all

# Vérifier que Nginx écoute sur le port 443
sudo netstat -tlnp | grep 443

# Vérifier les certificats
ls -la /etc/nginx/ssl/

# Tester la connexion SSL
openssl s_client -connect localhost:443
```

## 📈 Optimisations de performance

### Configuration PM2 avancée

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'digidoc',
    script: 'npm',
    args: 'start',
    instances: 2,  // 2 instances pour load balancing
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

Démarrer avec : `pm2 start ecosystem.config.js`

### Cache Nginx (optionnel)

Ajouter dans `/etc/nginx/conf.d/digidoc.conf` :

```nginx
# Cache pour les assets statiques
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=digidoc_cache:10m max_size=1g inactive=60m;

location /_next/static/ {
    proxy_cache digidoc_cache;
    proxy_cache_valid 200 60m;
    # ... reste de la config
}
```

## 📞 Support

En cas de problème persistant :
1. Vérifier les logs : `pm2 logs` et `sudo tail -f /var/log/nginx/digidoc_error.log`
2. Vérifier la connexion DB : `.env` et PostgreSQL
3. Réexécuter le setup SSL : `sudo bash scripts/setup-ssl-auto.sh`

## 🎯 Checklist de déploiement

- [ ] Serveur Red Hat configuré
- [ ] Node.js installé
- [ ] PostgreSQL installé et configuré
- [ ] Fichiers transférés sur le serveur
- [ ] `npm install` exécuté
- [ ] `.env` configuré avec les bonnes valeurs
- [ ] `npm run build` exécuté
- [ ] Base de données migrée (`npm run db:push`)
- [ ] SSL installé (`sudo bash scripts/setup-ssl-auto.sh`)
- [ ] Application démarrée avec PM2
- [ ] Accessible via `https://IP_SERVEUR`
- [ ] PM2 configuré pour le démarrage automatique

**Votre application est maintenant en production !** 🚀


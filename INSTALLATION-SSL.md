# Installation SSL pour Digi-Doc (Red Hat)

Guide d'installation du certificat SSL auto-signé et configuration Nginx pour Red Hat / CentOS / Rocky Linux.

## 📋 Prérequis

- Red Hat / CentOS / Rocky Linux
- Accès root ou sudo
- Application Next.js fonctionnant sur le port 3000

## 🚀 Installation

### Étape 1 : Installer Nginx et OpenSSL

```bash
# Mettre à jour les paquets
sudo dnf update -y

# Installer Nginx et OpenSSL
sudo dnf install -y nginx openssl

# Activer Nginx au démarrage
sudo systemctl enable nginx
```

### Étape 2 : Générer le certificat SSL auto-signé

```bash
# Rendre le script exécutable
chmod +x scripts/generate-ssl-cert.sh

# Exécuter le script
sudo ./scripts/generate-ssl-cert.sh
```

Le certificat sera généré dans `/etc/nginx/ssl/` :
- **Certificat** : `/etc/nginx/ssl/digidoc.crt`
- **Clé privée** : `/etc/nginx/ssl/digidoc.key`
- **Validité** : 365 jours

### Étape 3 : Configurer Nginx

```bash
# Copier la configuration Nginx
sudo cp nginx/digidoc.conf /etc/nginx/conf.d/digidoc.conf

# Vérifier la configuration Nginx
sudo nginx -t

# Si la configuration est OK, redémarrer Nginx
sudo systemctl restart nginx
```

### Étape 4 : Configurer le pare-feu (firewalld)

```bash
# Autoriser HTTPS (port 443)
sudo firewall-cmd --permanent --add-service=https

# Autoriser HTTP (port 80) pour la redirection
sudo firewall-cmd --permanent --add-service=http

# Recharger le pare-feu
sudo firewall-cmd --reload

# Vérifier les règles
sudo firewall-cmd --list-all
```

### Étape 5 : Configurer SELinux (si activé)

```bash
# Vérifier si SELinux est activé
getenforce

# Si SELinux est activé, autoriser Nginx à se connecter au réseau
sudo setsebool -P httpd_can_network_connect 1

# Autoriser Nginx à lire les certificats SSL
sudo chcon -R -t httpd_sys_content_t /etc/nginx/ssl/
```

### Étape 6 : Démarrer l'application Next.js

```bash
# Construire l'application en production
npm run build

# Démarrer l'application (port 3000)
npm run start

# OU utiliser PM2 pour gérer l'application en arrière-plan
npm install -g pm2
pm2 start npm --name "digidoc" -- start
pm2 save
pm2 startup
```

## ✅ Vérification

### Vérifier que tout fonctionne

```bash
# Vérifier que Nginx est actif
sudo systemctl status nginx

# Vérifier que l'application Next.js répond sur le port 3000
curl http://localhost:3000

# Vérifier que HTTPS fonctionne (ignorera l'avertissement SSL)
curl -k https://VOTRE_IP_SERVEUR
```

### Tester depuis un navigateur

1. Ouvrir : `https://VOTRE_IP_SERVEUR`
2. Vous verrez un avertissement de sécurité (normal pour un certificat auto-signé)
3. Cliquer sur "Avancé" puis "Accepter le risque et continuer"
4. L'application devrait s'afficher en HTTPS

## 🔧 Gestion

### Redémarrer les services

```bash
# Redémarrer Nginx
sudo systemctl restart nginx

# Redémarrer l'application Next.js (si vous utilisez PM2)
pm2 restart digidoc
```

### Voir les logs

```bash
# Logs Nginx
sudo tail -f /var/log/nginx/digidoc_access.log
sudo tail -f /var/log/nginx/digidoc_error.log

# Logs application (PM2)
pm2 logs digidoc
```

### Renouveler le certificat (après 365 jours)

```bash
# Régénérer simplement le certificat
sudo ./scripts/generate-ssl-cert.sh

# Redémarrer Nginx
sudo systemctl restart nginx
```

## ⚠️ Important - Certificat auto-signé

**Avertissements de sécurité :**
- Les navigateurs afficheront un avertissement "Votre connexion n'est pas privée"
- Les utilisateurs devront accepter manuellement le certificat
- C'est normal pour un certificat auto-signé

**Pour éviter les avertissements :**
- Les utilisateurs peuvent ajouter une exception permanente dans leur navigateur
- L'administrateur réseau peut distribuer le certificat via GPO (Group Policy)
- Ou importer le certificat dans les certificats racine de confiance de l'entreprise

**Distribution du certificat en entreprise :**

1. **Récupérer le certificat :**
```bash
sudo cp /etc/nginx/ssl/digidoc.crt ~/digidoc-certificate.crt
```

2. **Distribuer via GPO (Windows Active Directory) :**
   - Group Policy Management → Computer Configuration
   - → Policies → Windows Settings → Security Settings
   → Public Key Policies → Trusted Root Certification Authorities
   - Importer `digidoc-certificate.crt`

3. **Import manuel (Windows) :**
   - Double-cliquer sur `digidoc-certificate.crt`
   - "Installer le certificat" → "Ordinateur local"
   - "Placer tous les certificats dans le magasin suivant"
   - Sélectionner "Autorités de certification racines de confiance"

## 📞 Support

En cas de problème, vérifier :
1. Nginx est démarré : `sudo systemctl status nginx`
2. Application Next.js fonctionne : `curl http://localhost:3000`
3. Pare-feu autorise le port 443 : `sudo firewall-cmd --list-all`
4. SELinux ne bloque pas : `sudo ausearch -m avc -ts recent`
5. Logs Nginx : `sudo tail -f /var/log/nginx/digidoc_error.log`

## 🔄 Mise en production avec PM2 (optionnel)

Pour une meilleure gestion en production :

```bash
# Installer PM2 globalement
npm install -g pm2

# Créer un fichier de configuration PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'digidoc',
    script: 'npm',
    args: 'start',
    cwd: '/chemin/vers/dossier_personnel',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Démarrer avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la configuration
pm2 save

# Configurer le démarrage automatique
pm2 startup
```


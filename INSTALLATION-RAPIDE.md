# Installation HTTPS en 2 minutes ⚡

Installation ultra-rapide du certificat SSL auto-signé pour Digi-Doc sur Red Hat.

## 🚀 Installation en UNE seule commande

Sur votre serveur Red Hat, dans le répertoire du projet :

```bash
sudo bash scripts/setup-ssl-auto.sh
```

**C'est tout !** 🎉

Le script fait automatiquement :
- ✅ Installation de Nginx et OpenSSL
- ✅ Génération du certificat SSL (365 jours)
- ✅ Configuration du reverse proxy
- ✅ Configuration du pare-feu (ports 80 et 443)
- ✅ Configuration de SELinux
- ✅ Démarrage de Nginx

## 📝 Avant l'installation

Assurez-vous que :
1. L'application Next.js est construite : `npm run build`
2. L'application tourne sur le port 3000 : `npm run start`

## 🌐 Après l'installation

Accédez à votre application via HTTPS :
```
https://VOTRE_IP_SERVEUR
```

**Avertissement de sécurité :**
- Cliquez sur "Avancé"
- Puis "Accepter le risque et continuer"
- C'est normal pour un certificat auto-signé

## 🔄 Démarrage automatique de l'application

Pour que l'application démarre automatiquement :

```bash
# Installer PM2
npm install -g pm2

# Démarrer l'application
cd /chemin/vers/dossier_personnel
pm2 start npm --name digidoc -- start

# Sauvegarder et configurer le démarrage auto
pm2 save
pm2 startup
```

## 🛠️ Dépannage

Si ça ne fonctionne pas :

```bash
# Vérifier Nginx
systemctl status nginx

# Vérifier l'application
curl http://localhost:3000

# Voir les logs
tail -f /var/log/nginx/digidoc_error.log
```

## 📞 Support

En cas de problème, réexécutez le script :
```bash
sudo bash scripts/setup-ssl-auto.sh
```

---

**Simple, rapide, efficace !** 🚀


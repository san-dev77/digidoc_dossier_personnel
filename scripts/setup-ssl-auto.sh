#!/bin/bash

# 🚀 Installation SSL automatique pour Digi-Doc
# Exécuter avec : sudo bash scripts/setup-ssl-auto.sh

echo "🔐 Installation SSL automatique pour Digi-Doc"
echo "=============================================="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ ERREUR : Droits root requis"
    echo "   → Exécutez : sudo bash scripts/setup-ssl-auto.sh"
    exit 1
fi

# Obtenir le répertoire du projet
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "📁 Répertoire du projet : $PROJECT_DIR"
echo ""

# Variable pour suivre les erreurs
HAS_ERRORS=0

# 1. Installation de Nginx et OpenSSL
echo "📦 [1/6] Installation de Nginx et OpenSSL..."
if dnf install -y nginx openssl 2>&1 | grep -q "Complete\|Nothing to do"; then
    systemctl enable nginx >/dev/null 2>&1
    echo "✅ Nginx et OpenSSL installés"
else
    echo "❌ ERREUR : Échec de l'installation de Nginx/OpenSSL"
    echo "   → Vérifiez votre connexion internet"
    echo "   → Essayez : sudo dnf clean all && sudo dnf install -y nginx openssl"
    HAS_ERRORS=1
fi
echo ""

# 2. Génération du certificat SSL
echo "🔑 [2/6] Génération du certificat SSL..."
mkdir -p /etc/nginx/ssl
if openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/digidoc.key \
  -out /etc/nginx/ssl/digidoc.crt \
  -subj "/C=MA/ST=Casablanca/L=Casablanca/O=Banque/OU=IT/CN=Digi-Doc" 2>&1; then
    chmod 600 /etc/nginx/ssl/digidoc.key
    chmod 644 /etc/nginx/ssl/digidoc.crt
    echo "✅ Certificat SSL généré (valide 365 jours)"
else
    echo "❌ ERREUR : Échec de génération du certificat"
    echo "   → Vérifiez qu'OpenSSL est installé : openssl version"
    HAS_ERRORS=1
fi
echo ""

# 3. Configuration Nginx
echo "⚙️  [3/6] Configuration de Nginx..."
if [ ! -f "$PROJECT_DIR/nginx/digidoc.conf" ]; then
    echo "❌ ERREUR : Fichier digidoc.conf introuvable"
    echo "   → Chemin attendu : $PROJECT_DIR/nginx/digidoc.conf"
    HAS_ERRORS=1
else
    cp "$PROJECT_DIR/nginx/digidoc.conf" /etc/nginx/conf.d/digidoc.conf
    echo "   Vérification de la configuration Nginx..."
    if nginx -t 2>&1 | tee /tmp/nginx-test.log | grep -q "successful"; then
        if systemctl restart nginx 2>&1; then
            echo "✅ Nginx configuré et redémarré"
        else
            echo "❌ ERREUR : Échec du redémarrage de Nginx"
            echo "   → Vérifiez les logs : sudo journalctl -u nginx -n 20"
            HAS_ERRORS=1
        fi
    else
        echo "❌ ERREUR : Configuration Nginx invalide"
        cat /tmp/nginx-test.log
        echo "   → Vérifiez la syntaxe : sudo nginx -t"
        HAS_ERRORS=1
    fi
fi
echo ""

# 4. Configuration du pare-feu
echo "🔥 [4/6] Configuration du pare-feu..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=https 2>&1
    firewall-cmd --permanent --add-service=http 2>&1
    if firewall-cmd --reload 2>&1; then
        echo "✅ Pare-feu configuré (ports 80 et 443 ouverts)"
    else
        echo "⚠️  Avertissement : Échec de configuration du pare-feu"
        echo "   → Ouvrez manuellement les ports : sudo firewall-cmd --permanent --add-port={80,443}/tcp"
    fi
else
    echo "⚠️  Firewalld non installé (peut-être pas nécessaire)"
fi
echo ""

# 5. Configuration SELinux
echo "🔒 [5/6] Configuration de SELinux..."
if command -v getenforce &> /dev/null && [ "$(getenforce)" != "Disabled" ]; then
    echo "   SELinux actif : $(getenforce)"
    if setsebool -P httpd_can_network_connect 1 2>&1; then
        chcon -R -t httpd_sys_content_t /etc/nginx/ssl/ 2>&1
        echo "✅ SELinux configuré"
    else
        echo "⚠️  Avertissement : Impossible de configurer SELinux"
        echo "   → Si Nginx ne fonctionne pas, essayez : sudo setenforce 0"
    fi
else
    echo "ℹ️  SELinux désactivé ou non installé"
fi
echo ""

# 6. Vérifier si l'application tourne sur le port 3000
echo "🔍 [6/6] Vérification de l'application Next.js..."
if curl -s --connect-timeout 3 http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Application Next.js détectée sur le port 3000"
elif netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "⚠️  Port 3000 utilisé mais ne répond pas"
    echo "   → Vérifiez l'app : curl http://localhost:3000"
else
    echo "❌ ERREUR : Application Next.js non démarrée"
    echo "   → Démarrez-la : cd $PROJECT_DIR && npm run build && npm run start"
    echo "   → Ou avec PM2 : pm2 start npm --name digidoc -- start"
    HAS_ERRORS=1
fi
echo ""

# Afficher le résumé
echo ""
echo "=============================================="
if [ $HAS_ERRORS -eq 0 ]; then
    echo "✨ Installation terminée avec succès !"
    echo "=============================================="
    echo ""
    echo "📋 Résumé de la configuration :"
    echo "   • Certificat SSL : /etc/nginx/ssl/digidoc.crt"
    echo "   • Clé privée     : /etc/nginx/ssl/digidoc.key"
    echo "   • Validité       : 365 jours"
    echo "   • Port HTTP      : 80 (redirige vers HTTPS)"
    echo "   • Port HTTPS     : 443"
    echo ""
    echo "🌐 Accès à l'application :"
    echo "   https://$(hostname -I | awk '{print $1}')"
    echo ""
    echo "⚠️  Note : Les navigateurs afficheront un avertissement"
    echo "   de sécurité (normal pour un certificat auto-signé)."
    echo "   Cliquer sur 'Avancé' puis 'Accepter le risque'."
    echo ""
    echo "📊 Commandes utiles :"
    echo "   • Statut Nginx  : systemctl status nginx"
    echo "   • Logs Nginx    : tail -f /var/log/nginx/digidoc_error.log"
    echo "   • Redémarrer    : systemctl restart nginx"
else
    echo "⚠️  Installation terminée avec des erreurs"
    echo "=============================================="
    echo ""
    echo "🔍 Diagnostic rapide :"
    echo ""
    echo "Vérifier Nginx :"
    echo "   sudo systemctl status nginx"
    echo "   sudo nginx -t"
    echo ""
    echo "Vérifier l'application :"
    echo "   curl http://localhost:3000"
    echo "   sudo netstat -tlnp | grep 3000"
    echo ""
    echo "Vérifier les ports :"
    echo "   sudo netstat -tlnp | grep -E '80|443'"
    echo "   sudo firewall-cmd --list-all"
    echo ""
    echo "Voir les logs :"
    echo "   sudo tail -f /var/log/nginx/digidoc_error.log"
    echo "   sudo journalctl -u nginx -n 50"
fi
echo ""

exit $HAS_ERRORS


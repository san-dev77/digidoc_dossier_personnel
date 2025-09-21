interface NotificationData {
  id: string;
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: "login" | "system" | "security" | "update";
}

class NotificationService {
  private notifications: NotificationData[] = [];
  private listeners: ((notifications: NotificationData[]) => void)[] = [];

  // Vérifier si les notifications desktop sont supportées
  isDesktopNotificationSupported(): boolean {
    return "Notification" in window;
  }

  // Demander la permission pour les notifications desktop
  async requestPermission(): Promise<boolean> {
    if (!this.isDesktopNotificationSupported()) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  // Vérifier si les notifications desktop sont activées
  isDesktopNotificationEnabled(): boolean {
    return (
      this.isDesktopNotificationSupported() &&
      Notification.permission === "granted"
    );
  }

  // Envoyer une notification desktop
  sendDesktopNotification(title: string, options?: NotificationOptions): void {
    if (this.isDesktopNotificationEnabled()) {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "digidoc-notification",
        ...options,
      });

      // Fermer automatiquement après 5 secondes
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
  }

  // Ajouter une notification
  addNotification(
    notification: Omit<NotificationData, "id" | "timestamp" | "read">
  ): string {
    const id = `notification_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const newNotification: NotificationData = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification); // Ajouter au début
    this.notifyListeners();

    // Envoyer une notification desktop si activée
    if (this.isDesktopNotificationEnabled()) {
      this.sendDesktopNotification(newNotification.title, {
        body: newNotification.message,
        tag: newNotification.category,
      });
    }

    return id;
  }

  // Notification de connexion
  sendLoginNotification(userName: string): string {
    return this.addNotification({
      type: "success",
      title: "Connexion réussie",
      message: `Bienvenue ${userName} ! Vous êtes maintenant connecté au système.`,
      category: "login",
    });
  }

  // Notification de déconnexion
  sendLogoutNotification(userName: string): string {
    return this.addNotification({
      type: "info",
      title: "Déconnexion",
      message: `${userName} s'est déconnecté du système.`,
      category: "login",
    });
  }

  // Notification système
  sendSystemNotification(
    title: string,
    message: string,
    type: "success" | "warning" | "info" | "error" = "info"
  ): string {
    return this.addNotification({
      type,
      title,
      message,
      category: "system",
    });
  }

  // Notification de sécurité
  sendSecurityNotification(
    title: string,
    message: string,
    type: "warning" | "error" = "warning"
  ): string {
    return this.addNotification({
      type,
      title,
      message,
      category: "security",
    });
  }

  // Notification de mise à jour
  sendUpdateNotification(title: string, message: string): string {
    return this.addNotification({
      type: "info",
      title,
      message,
      category: "update",
    });
  }

  // Marquer une notification comme lue
  markAsRead(id: string): void {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Marquer toutes les notifications comme lues
  markAllAsRead(): void {
    this.notifications.forEach((notification) => {
      notification.read = true;
    });
    this.notifyListeners();
  }

  // Supprimer une notification
  deleteNotification(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notifyListeners();
  }

  // Supprimer toutes les notifications
  clearAllNotifications(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  // Obtenir toutes les notifications
  getNotifications(): NotificationData[] {
    return [...this.notifications];
  }

  // Obtenir les notifications non lues
  getUnreadNotifications(): NotificationData[] {
    return this.notifications.filter((n) => !n.read);
  }

  // Obtenir le nombre de notifications non lues
  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  // Filtrer les notifications par catégorie
  getNotificationsByCategory(category: string): NotificationData[] {
    return this.notifications.filter((n) => n.category === category);
  }

  // S'abonner aux changements de notifications
  subscribe(listener: (notifications: NotificationData[]) => void): () => void {
    this.listeners.push(listener);

    // Retourner une fonction de désabonnement
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Notifier tous les listeners
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener([...this.notifications]);
    });
  }

  // Sauvegarder les notifications dans le localStorage
  saveToLocalStorage(): void {
    try {
      localStorage.setItem(
        "digidoc_notifications",
        JSON.stringify(this.notifications)
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des notifications:", error);
    }
  }

  // Charger les notifications depuis le localStorage
  loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem("digidoc_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        this.notifyListeners();
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    }
  }

  // Initialiser le service
  initialize(): void {
    this.loadFromLocalStorage();

    // Sauvegarder automatiquement à chaque changement
    this.subscribe(() => {
      this.saveToLocalStorage();
    });
  }
}

// Instance singleton
export const notificationService = new NotificationService();

// Initialiser automatiquement
if (typeof window !== "undefined") {
  notificationService.initialize();
}

export type { NotificationData };

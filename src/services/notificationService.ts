// Service de notifications simplifié pour DigiDoc

interface NotificationOptions {
  duration?: number;
}

class NotificationService {
  private showToast(
    message: string,
    type: "success" | "error" | "warning" | "info",
    duration: number = 3000
  ) {
    // Créer un toast simple avec CSS
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 max-w-sm p-4 rounded-xl shadow-lg border transform transition-all duration-300 translate-x-full opacity-0 pointer-events-none`;

    // Styles selon le type
    switch (type) {
      case "success":
        toast.className += " bg-emerald-50 border-emerald-200 text-emerald-800";
        break;
      case "error":
        toast.className += " bg-red-50 border-red-200 text-red-800";
        break;
      case "warning":
        toast.className += " bg-amber-50 border-amber-200 text-amber-800";
        break;
      default:
        toast.className += " bg-blue-50 border-blue-200 text-blue-800";
    }

    const icon =
      type === "success"
        ? "✅"
        : type === "error"
        ? "❌"
        : type === "warning"
        ? "⚠️"
        : "ℹ️";

    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-lg">${icon}</span>
        <span class="font-medium text-sm">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Animation d'entrée
    setTimeout(() => {
      toast.className = toast.className.replace(
        "translate-x-full opacity-0",
        "translate-x-0 opacity-100"
      );
    }, 100);

    // Animation de sortie
    setTimeout(() => {
      toast.className = toast.className.replace(
        "translate-x-0 opacity-100",
        "translate-x-full opacity-0"
      );
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  success(message: string, options: NotificationOptions = {}) {
    this.showToast(message, "success", options.duration);
  }

  error(message: string, options: NotificationOptions = {}) {
    this.showToast(message, "error", options.duration);
  }

  warning(message: string, options: NotificationOptions = {}) {
    this.showToast(message, "warning", options.duration);
  }

  info(message: string, options: NotificationOptions = {}) {
    this.showToast(message, "info", options.duration);
  }

  // Notifications spécifiques pour les pièces
  pieceCreated(pieceName: string) {
    return this.success(`Document "${pieceName}" ajouté`, { duration: 2500 });
  }

  pieceDeleted(pieceName: string) {
    return this.success(`Document "${pieceName}" supprimé`, { duration: 2500 });
  }

  pieceUpdated(pieceName: string) {
    return this.success(`Document "${pieceName}" mis à jour`, {
      duration: 2500,
    });
  }

  pieceError(message: string) {
    return this.error(message);
  }
}

export const notificationService = new NotificationService();

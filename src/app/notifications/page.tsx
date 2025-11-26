"use client";

import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Settings,
  Trash2,
  Eye,
  Clock,
  User,
  Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationContext";

interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: "login" | "system" | "security" | "update";
}

export default function NotificationsPage() {
  const { appUser } = useAuth();
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    isDesktopNotificationEnabled,
    requestPermission,
    sendTestNotification,
  } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread" | "login" | "system">(
    "all"
  );
  const [showSettings, setShowSettings] = useState(false);

  // Ajouter une notification de démonstration au chargement
  useEffect(() => {
    if (appUser && notifications.length === 0) {
      // Ajouter quelques notifications de démonstration
      addNotification({
        type: "success",
        title: "Connexion réussie",
        message: `Bienvenue ${appUser.prenom} ! Vous êtes maintenant connecté au système.`,
        category: "login",
      });
      addNotification({
        type: "info",
        title: "Mise à jour du système",
        message: "Une nouvelle version de l'application est disponible.",
        category: "system",
      });
    }
  }, [appUser, notifications.length, addNotification]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-emerald-50 border-emerald-200";
      case "warning":
        return "bg-orange-50 border-orange-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "login":
        return <User className="w-4 h-4" />;
      case "system":
        return <Settings className="w-4 h-4" />;
      case "security":
        return <Shield className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.read;
    if (filter === "login") return notif.category === "login";
    if (filter === "system") return notif.category === "system";
    return true;
  });

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header Card Sublime */}
        <div className="mb-8">
          <div className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>

            {/* Motifs décoratifs */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-1">Notifications</h1>
                    <p className="text-primary-100 text-lg font-medium">
                      Centre de notifications et alertes
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                    <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
                    <span className="text-white font-medium">
                      {unreadCount} non lues
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                    <Bell className="w-4 h-4 text-white" />
                    <span className="text-white font-medium">
                      {notifications.length} total
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="relative">
                  <div className="w-28 h-28 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-xl">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
                      <Bell className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  {/* Badge de notifications non lues */}
                  {unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-xs font-bold text-white">
                        {unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contrôles et filtres */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Filtres */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "Toutes", count: notifications.length },
                  { key: "unread", label: "Non lues", count: unreadCount },
                  {
                    key: "login",
                    label: "Connexions",
                    count: notifications.filter((n) => n.category === "login")
                      .length,
                  },
                  {
                    key: "system",
                    label: "Système",
                    count: notifications.filter((n) => n.category === "system")
                      .length,
                  },
                ].map((filterOption) => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key as "all" | "unread" | "login" | "system")}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      filter === filterOption.key
                        ? "bg-primary-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {filterOption.label}
                    <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                      {filterOption.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Tout marquer comme lu
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors"
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Paramètres
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Tout supprimer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Paramètres de notifications */}
        {showSettings && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Paramètres des notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Notifications desktop
                    </h4>
                    <p className="text-sm text-gray-600">
                      Recevoir des notifications sur votre bureau
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isDesktopNotificationEnabled ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        Activé
                      </span>
                    ) : (
                      <button
                        onClick={requestPermission}
                        className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                      >
                        Activer
                      </button>
                    )}
                  </div>
                </div>

                {isDesktopNotificationEnabled && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Test de notification
                      </h4>
                      <p className="text-sm text-gray-600">
                        Envoyer une notification de test
                      </p>
                    </div>
                    <button
                      onClick={sendTestNotification}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Tester
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Liste des notifications */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-lg text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Aucune notification
              </h3>
              <p className="text-gray-600">
                {filter === "all"
                  ? "Vous n'avez aucune notification pour le moment."
                  : `Aucune notification ${
                      filter === "unread" ? "non lue" : filter
                    } trouvée.`}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`group relative bg-white rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 ${
                  notification.read
                    ? "border-gray-200"
                    : "border-primary-300 bg-primary-50/30"
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icône de type */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getNotificationBgColor(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3
                            className={`font-bold text-lg ${
                              notification.read
                                ? "text-gray-900"
                                : "text-primary-900"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                          )}
                        </div>

                        <p className="text-gray-700 mb-3">
                          {notification.message}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            {getCategoryIcon(notification.category)}
                            <span className="capitalize">
                              {notification.category}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {notification.timestamp.toLocaleString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors"
                            title="Marquer comme lu"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                          title="Supprimer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  notificationService,
  NotificationData,
} from "@/services/notifications";

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  addNotification: (
    notification: Omit<NotificationData, "id" | "timestamp" | "read">
  ) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  sendLoginNotification: (userName: string) => string;
  sendSystemNotification: (
    title: string,
    message: string,
    type?: "success" | "warning" | "info" | "error"
  ) => string;
  isDesktopNotificationEnabled: boolean;
  requestPermission: () => Promise<boolean>;
  sendTestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isDesktopNotificationEnabled, setIsDesktopNotificationEnabled] =
    useState(false);

  useEffect(() => {
    // Charger les notifications initiales
    setNotifications(notificationService.getNotifications());
    setIsDesktopNotificationEnabled(
      notificationService.isDesktopNotificationEnabled()
    );

    // S'abonner aux changements
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, []);

  const addNotification = (
    notification: Omit<NotificationData, "id" | "timestamp" | "read">
  ) => {
    return notificationService.addNotification(notification);
  };

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const deleteNotification = (id: string) => {
    notificationService.deleteNotification(id);
  };

  const clearAllNotifications = () => {
    notificationService.clearAllNotifications();
  };

  const sendLoginNotification = (userName: string) => {
    return notificationService.sendLoginNotification(userName);
  };

  const sendSystemNotification = (
    title: string,
    message: string,
    type: "success" | "warning" | "info" | "error" = "info"
  ) => {
    return notificationService.sendSystemNotification(title, message, type);
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setIsDesktopNotificationEnabled(granted);
    return granted;
  };

  const sendTestNotification = () => {
    if (isDesktopNotificationEnabled) {
      notificationService.sendDesktopNotification(
        "DigiDoc - Test de notification",
        {
          body: "Ceci est une notification de test pour vérifier le bon fonctionnement.",
          tag: "test-notification",
        }
      );
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendLoginNotification,
    sendSystemNotification,
    isDesktopNotificationEnabled,
    requestPermission,
    sendTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

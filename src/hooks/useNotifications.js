/**
 * useNotifications.js - Hook para notificações
 */

import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    setNotifications,
  } = useContext(UserContext);

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const getNotificationsByType = (type) => {
    return notifications.filter((n) => n.type === type);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    getNotificationsByType,
  };
}
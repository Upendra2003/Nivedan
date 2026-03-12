/**
 * NotificationContext
 * Provides unread count, full notification list, and refresh/markRead helpers.
 * Consumed by: home screen bell badge, notification drawer, in-app banner.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState } from "react-native";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

export interface AppNotification {
  _id: string;
  complaint_id: string | null;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.authedGet<AppNotification[]>("/notifications/mine?all=1");
      setNotifications(data);
    } catch (e) {
      if (__DEV__) console.warn("[notifications] refresh failed:", e);
    }
  }, [user]);

  // Refresh on mount + whenever user changes
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Poll every 8s, but only while app is in the foreground.
  // Also refresh immediately when the app comes back from background.
  useEffect(() => {
    if (!user) return;

    const id = setInterval(() => {
      if (AppState.currentState === "active") refreshNotifications();
    }, 8_000);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshNotifications();
    });

    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [user, refreshNotifications]);

  const markRead = useCallback(async (id: string) => {
    try {
      await api.authedPost(`/notifications/read/${id}`, {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.authedPost("/notifications/read/all", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, refreshNotifications, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}

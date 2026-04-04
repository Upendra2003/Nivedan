/**
 * notifications.ts
 * Push notification helpers — safe to import in Expo Go.
 *
 * expo-notifications removed Android push support from Expo Go in SDK 53.
 * Importing the package at module level crashes the entire bundle.
 * Solution: lazy dynamic import, guarded by Expo Go detection.
 * Polling fallback in the chat screen covers the demo case.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";
import { api } from "./api";

// True when running inside the Expo Go client
const IS_EXPO_GO = Constants.appOwnership === "expo";

export type ForegroundNotification = {
  title: string;
  body: string;
  data: Record<string, any>;
};

// Lazy-loaded module reference (avoids top-level import that crashes Expo Go)
let _Notifications: typeof import("expo-notifications") | null = null;

async function loadNotifications() {
  if (IS_EXPO_GO || Platform.OS === "web") return null;
  if (_Notifications) return _Notifications;
  try {
    const mod = await import("expo-notifications");
    // Configure how foreground notifications are presented
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false, // We show our own InAppBanner
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: false,
        shouldShowList: true,
      }),
    });
    _Notifications = mod;
    return mod;
  } catch {
    return null;
  }
}

/**
 * Request push permissions, get Expo push token, register with backend.
 * No-op in Expo Go or on web.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;

    // Fire-and-forget — don't block app startup
    api.authedPost("/users/push_token", { token }).catch(() => {});
    return token;
  } catch {
    return null;
  }
}

/**
 * Subscribe to foreground notifications (app open).
 * Returns a cleanup function for useEffect.
 * No-op in Expo Go (polling fallback covers the demo).
 */
export function addForegroundListener(
  callback: (notif: ForegroundNotification) => void
): () => void {
  if (IS_EXPO_GO || Platform.OS === "web") return () => {};

  let cancelled = false;
  let removeFn: (() => void) | null = null;

  loadNotifications().then((Notifications) => {
    if (cancelled || !Notifications) return;
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      callback({
        title: title ?? "Nivedan",
        body: body ?? "",
        data: (data ?? {}) as Record<string, any>,
      });
    });
    removeFn = () => sub.remove();
  });

  return () => {
    cancelled = true;
    removeFn?.();
  };
}

/**
 * Subscribe to notification taps (app backgrounded / killed).
 * Returns a cleanup function.
 * No-op in Expo Go.
 */
export function addResponseListener(
  callback: (data: Record<string, any>) => void
): () => void {
  if (IS_EXPO_GO || Platform.OS === "web") return () => {};

  let cancelled = false;
  let removeFn: (() => void) | null = null;

  loadNotifications().then((Notifications) => {
    if (cancelled || !Notifications) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data ?? {}) as Record<string, any>;
      callback(data);
    });
    removeFn = () => sub.remove();
  });

  return () => {
    cancelled = true;
    removeFn?.();
  };
}

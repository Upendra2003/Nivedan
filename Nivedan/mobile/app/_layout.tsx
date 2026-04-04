import React, { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Font from "expo-font";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { NotificationProvider, useNotifications, type AppNotification } from "../context/NotificationContext";
import {
  registerForPushNotifications,
  addForegroundListener,
  addResponseListener,
  type ForegroundNotification,
} from "../services/notifications";
import InAppBanner, { type BannerData } from "../components/InAppBanner";
import { loadPersistedTheme, useTheme } from "../constants/theme";
import { loadPersistedLanguage } from "../constants/i18n";
import { loadSecure } from "../utils/storage";

// ── Google Sans Flex — global font ────────────────────────────────────────────
// Download: https://fonts.google.com/specimen/Google+Sans+Flex
// Place the TTF at: mobile/assets/fonts/GoogleSansFlex.ttf
// Once the file is present, update this flag to true:
const ENABLE_GOOGLE_SANS = false;

async function loadAppFonts() {
  if (!ENABLE_GOOGLE_SANS) return;
  try {
    await Font.loadAsync({
      "GoogleSansFlex":         require("../assets/fonts/GoogleSansFlex.ttf"),
      "GoogleSansFlex-Medium":  require("../assets/fonts/GoogleSansFlex.ttf"),
      "GoogleSansFlex-Bold":    require("../assets/fonts/GoogleSansFlex.ttf"),
    });
    // Apply as default font to every Text in the app
    // @ts-ignore
    const prev = Text.defaultProps?.style ?? {};
    // @ts-ignore
    Text.defaultProps = { ...(Text.defaultProps ?? {}), style: [{ fontFamily: "GoogleSansFlex" }, prev] };
  } catch {
    // Font file missing or failed — app continues with system font
  }
}

// ── Auth guard + push setup ───────────────────────────────────────────────────

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const { notifications, refreshNotifications } = useNotifications();
  const segments = useSegments();
  const router   = useRouter();
  const [banner, setBanner] = useState<BannerData | null>(null);
  const seenIdsRef          = useRef<Set<string>>(new Set());
  const initialLoadDoneRef  = useRef(false);

  // Onboarding check
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasOnboarded,      setHasOnboarded]      = useState(false);

  useEffect(() => {
    loadSecure("hasSeenOnboarding").then((val) => {
      setHasOnboarded(val === "true");
      setOnboardingChecked(true);
    });
  }, []);

  useEffect(() => {
    if (user) registerForPushNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const removeFg = addForegroundListener((notif: ForegroundNotification) => {
      refreshNotifications();
      setBanner({
        title: notif.title,
        body: notif.body,
        onPress: () => router.push("/(tabs)/dashboard" as any),
      });
    });
    return removeFg;
  }, [user, refreshNotifications]);

  useEffect(() => {
    if (!user) return;
    const removeResp = addResponseListener((data) => {
      if (data.type === "status_update") router.push("/(tabs)/dashboard" as any);
    });
    return removeResp;
  }, [user]);

  useEffect(() => {
    if (!user || notifications.length === 0) return;
    const unread = notifications.filter((n: AppNotification) => !n.read);
    if (!initialLoadDoneRef.current) {
      unread.forEach((n) => seenIdsRef.current.add(n._id));
      initialLoadDoneRef.current = true;
      return;
    }
    const newest = unread.find((n) => !seenIdsRef.current.has(n._id));
    if (newest) {
      seenIdsRef.current.add(newest._id);
      setBanner({
        title: "Nivedan Update",
        body: newest.message,
        onPress: () => router.push("/(tabs)/dashboard" as any),
      });
    }
  }, [notifications, user]);

  useEffect(() => {
    if (loading || !onboardingChecked) return;
    const inAuthGroup = segments[0] === "auth";
    if (!user && !inAuthGroup) {
      if (hasOnboarded) {
        router.replace("/auth/login");
      } else {
        router.replace("/auth/onboarding");
      }
    } else if (user && inAuthGroup && segments[1] !== "onboarding") {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments, onboardingChecked, hasOnboarded]);

  const bg = "#F5F6FF";

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: bg }}>
        <ActivityIndicator size="large" color="#E8891A" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <InAppBanner banner={banner} onDismiss={() => setBanner(null)} />
    </View>
  );
}

// ── Root layout ───────────────────────────────────────────────────────────────

export default function RootLayout() {
  useEffect(() => {
    loadPersistedTheme();
    loadPersistedLanguage();
    loadAppFonts();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <RootLayoutNav />
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

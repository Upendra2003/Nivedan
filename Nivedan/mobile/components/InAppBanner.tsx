/**
 * InAppBanner
 * Slides down from the top for 4s, then auto-dismisses.
 * Design: Nivedan / Sovereign Ledger — navy + saffron palette.
 */
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../constants/theme";

export interface BannerData {
  title: string;
  body: string;
  onPress?: () => void;
}

interface Props {
  banner: BannerData | null;
  onDismiss: () => void;
}

export default function InAppBanner({ banner, onDismiss }: Props) {
  const theme    = useTheme();
  const insets   = useSafeAreaInsets();
  const slideY   = useRef(new Animated.Value(-120)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!banner) return;

    slideY.stopAnimation();
    if (timerRef.current) clearTimeout(timerRef.current);

    Animated.spring(slideY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();

    timerRef.current = setTimeout(dismiss, 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [banner]);

  const dismiss = () => {
    Animated.timing(slideY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  if (!banner) return null;

  return (
    <Animated.View
      style={[
        s.container,
        {
          backgroundColor: theme.primary,
          top: insets.top + (Platform.OS === "android" ? 8 : 4),
          transform: [{ translateY: slideY }],
        },
      ]}
    >
      {/* Saffron left strip */}
      <View style={[s.strip, { backgroundColor: theme.secondary }]} />

      <TouchableOpacity
        style={s.inner}
        activeOpacity={0.85}
        onPress={() => {
          dismiss();
          banner.onPress?.();
        }}
      >
        <View style={[s.iconWrap, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Ionicons name="notifications" size={18} color="#fff" />
        </View>
        <View style={s.textCol}>
          <Text style={s.title} numberOfLines={1}>{banner.title}</Text>
          <Text style={s.body} numberOfLines={2}>{banner.body}</Text>
        </View>
        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
  },
  strip: { width: 4 },
  inner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  textCol:  { flex: 1 },
  title:    { fontSize: 13, fontWeight: "700", color: "#fff" },
  body:     { fontSize: 12, marginTop: 2, lineHeight: 17, color: "rgba(255,255,255,0.75)" },
});

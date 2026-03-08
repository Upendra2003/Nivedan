import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

const LANG_LABELS: Record<string, string> = {
  en: "English",
  hi: "हिंदी",
  ta: "தமிழ்",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const c = dark ? colors.dark : colors.light;

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ]);
  };

  if (!user) return null;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Avatar placeholder */}
      <View style={[styles.avatar, { backgroundColor: c.accent }]}>
        <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
      </View>

      <Text style={[styles.name, { color: c.text }]}>{user.name}</Text>
      <Text style={[styles.email, { color: c.muted }]}>{user.email}</Text>

      {/* Info card */}
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Row label="Language" value={LANG_LABELS[user.preferred_language] ?? user.preferred_language} c={c} />
        <Row label="Account ID" value={user.id.slice(-8).toUpperCase()} c={c} last />
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: c.error }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={[styles.logoutText, { color: c.error }]}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

function Row({
  label,
  value,
  c,
  last = false,
}: {
  label: string;
  value: string;
  c: typeof colors.dark;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
      <Text style={[styles.rowLabel, { color: c.muted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const colors = {
  dark: {
    bg: "#0d0d0d", card: "#1a1a1a", border: "#2a2a2a",
    text: "#f5f5f5", muted: "#888888",
    accent: "#7c3aed", error: "#f87171",
  },
  light: {
    bg: "#f8fafc", card: "#ffffff", border: "#e2e8f0",
    text: "#0f172a", muted: "#64748b",
    accent: "#7c3aed", error: "#dc2626",
  },
};

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", paddingTop: 64, paddingHorizontal: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: { fontSize: 30, fontWeight: "700", color: "#fff" },
  name: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 32 },
  card: {
    width: "100%", borderRadius: 14, borderWidth: 1,
    overflow: "hidden", marginBottom: 24,
  },
  row: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: "600" },
  logoutBtn: {
    width: "100%", borderRadius: 12, borderWidth: 1,
    paddingVertical: 14, alignItems: "center",
  },
  logoutText: { fontSize: 15, fontWeight: "700" },
});

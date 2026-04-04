import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useTheme, useThemeMode } from "../../constants/theme";
import {
  useTranslation,
  setLanguage,
  LANG_NAMES,
  ALL_LANGS,
  type LangCode,
} from "../../constants/i18n";
import { api } from "../../services/api";
import { removeSecure } from "../../utils/storage";
import { useRouter } from "expo-router";

const LOGO = require("../../assets/images/LOGO.png");

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();
  const router = useRouter();
  const { t, lang } = useTranslation();

  const [langChanging, setLangChanging] = useState(false);

  const handleLangSelect = async (code: LangCode) => {
    if (code === lang || langChanging) return;
    setLangChanging(true);
    setLanguage(code);           // instant UI update everywhere
    try {
      await api.authedPatch("/auth/me", { preferred_language: code });
    } catch {
      // Non-critical — UI already updated; Sarvam chat syncs on next session
    } finally {
      setLangChanging(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t("signOutTitle"), t("signOutConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("signOutBtn"), style: "destructive", onPress: logout },
    ]);
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero card ─────────────────────────────────────────────────── */}
        <LinearGradient
          colors={["#5B4EC9", "#9B72E8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.heroCard}
        >
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.heroName}>{user.name}</Text>
          <Text style={s.heroEmail}>{user.email}</Text>
          <View style={s.heroLogo}>
            <Text style={s.heroLogoText}>TEAM NIVEDAN</Text>
          </View>
        </LinearGradient>

        {/* ── Language picker (inline, always visible) ──────────────────── */}
        <Text style={[s.sectionLabel, { color: theme.subtext }]}>{t("selectLanguage")}</Text>
        <View style={[s.infoCard, { backgroundColor: theme.surface, paddingVertical: 16, paddingHorizontal: 16 }]}>
          <View style={s.langGrid}>
            {ALL_LANGS.map((code) => {
              const selected = code === lang;
              return (
                <TouchableOpacity
                  key={code}
                  style={[
                    s.langChip,
                    {
                      backgroundColor: selected ? theme.primary : theme.surfaceContainerLow,
                      borderColor:     selected ? theme.primary : theme.outlineVariant,
                    },
                  ]}
                  onPress={() => handleLangSelect(code)}
                  activeOpacity={0.75}
                  disabled={langChanging}
                >
                  <Text style={[s.langChipText, { color: selected ? "#fff" : theme.text }]}>
                    {LANG_NAMES[code]}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={14} color="#fff" style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Account Info ──────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: theme.subtext }]}>{t("accountInfo")}</Text>
        <View style={[s.infoCard, { backgroundColor: theme.surface }]}>
          <InfoRow
            icon="language-outline"
            label={t("languageLabel")}
            value={LANG_NAMES[lang]}
            theme={theme}
          />
          <View style={[s.divider, { backgroundColor: theme.surfaceContainerHigh }]} />
          <InfoRow
            icon="finger-print-outline"
            label={t("accountId")}
            value={user.id.slice(-8).toUpperCase()}
            theme={theme}
            last
          />
        </View>

        {/* ── App section ───────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: theme.subtext }]}>{t("appSection")}</Text>
        <View style={[s.infoCard, { backgroundColor: theme.surface }]}>
          {/* Theme toggle */}
          <View style={s.infoRow}>
            <View style={[s.infoIconWrap, { backgroundColor: theme.primaryContainer }]}>
              <Ionicons
                name={mode === "dark" ? "moon-outline" : "sunny-outline"}
                size={16}
                color={theme.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.infoLabel, { color: theme.subtext }]}>{t("appearance")}</Text>
              <Text style={[s.infoValue, { color: theme.primary }]}>
                {mode === "dark" ? t("darkMode") : t("lightMode")}
              </Text>
            </View>
            <Switch
              value={mode === "dark"}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.outlineVariant, true: theme.primary + "80" }}
              thumbColor={mode === "dark" ? theme.primary : theme.surface}
            />
          </View>

          <View style={[s.divider, { backgroundColor: theme.surfaceContainerHigh }]} />
          <InfoRow icon="shield-checkmark-outline" label={t("versionLabel")} value="2.1" theme={theme} />
          <View style={[s.divider, { backgroundColor: theme.surfaceContainerHigh }]} />
          <InfoRow icon="document-text-outline" label={t("aboutLabel")} value={t("aboutValue")} theme={theme} />
          <View style={[s.divider, { backgroundColor: theme.surfaceContainerHigh }]} />
          {/* View intro — replay onboarding carousel */}
          <TouchableOpacity
            style={s.infoRow}
            activeOpacity={0.7}
            onPress={async () => {
              try { await removeSecure("hasSeenOnboarding"); } catch {}
              router.push("/auth/onboarding" as any);
            }}
          >
            <View style={[s.infoIconWrap, { backgroundColor: theme.primaryContainer }]}>
              <Ionicons name="play-circle-outline" size={16} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.infoLabel, { color: theme.subtext }]}>{t("viewIntro")}</Text>
              <Text style={[s.infoValue, { color: theme.primary }]}>Replay onboarding</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.outlineVariant} />
          </TouchableOpacity>
        </View>

        {/* ── Sign out ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[s.logoutBtn, { borderColor: theme.error + "60", backgroundColor: theme.errorContainer }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.error} />
          <Text style={[s.logoutText, { color: theme.error }]}>{t("signOutBtn")}</Text>
        </TouchableOpacity>

        <Text style={[s.copyright, { color: theme.outline }]}>{t("copyright")}</Text>
      </ScrollView>

    </SafeAreaView>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  theme,
  last = false,
}: {
  icon: any;
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
  last?: boolean;
}) {
  return (
    <View style={s.infoRow}>
      <View style={[s.infoIconWrap, { backgroundColor: theme.primaryContainer }]}>
        <Ionicons name={icon} size={16} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.infoLabel, { color: theme.subtext }]}>{label}</Text>
        <Text style={[s.infoValue, { color: theme.primary }]}>{value}</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingBottom: 40 },

  // Hero card
  heroCard: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  avatarText:   { fontSize: 26, fontWeight: "800", color: "#fff" },
  heroName:     { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 4 },
  heroEmail:    { fontSize: 13, color: "rgba(255,255,255,0.72)" },
  heroLogo: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
  },
  heroLogoImg:  { width: 18, height: 18 },
  heroLogoText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 1.2 },

  // Sections
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#1B2A4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  infoIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel:    { fontSize: 11, fontWeight: "600", letterSpacing: 0.3, marginBottom: 2 },
  infoValue:    { fontSize: 14, fontWeight: "600" },
  divider:      { height: 1, marginHorizontal: 16 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 24,
  },
  logoutText: { fontSize: 15, fontWeight: "700" },

  copyright: { textAlign: "center", fontSize: 11, paddingBottom: 8 },

  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 8,
  },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  langChipText: { fontSize: 15, fontWeight: "700" },
});

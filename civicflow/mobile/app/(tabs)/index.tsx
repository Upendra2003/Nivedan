import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { CATEGORIES, type Category, type Subcategory } from "../../constants/categories";
import { useTheme, STATUS_COLORS } from "../../constants/theme";
import { useTranslation, type Strings } from "../../constants/i18n";
import { api } from "../../services/api";
import NotificationDrawer from "../../components/NotificationDrawer";

// ── Category icon config ───────────────────────────────────────────────────────

const CAT_CONFIG: Record<string, { icon: any; iconColor: string; bgColor: string }> = {
  labor_issues:      { icon: "briefcase-outline",        iconColor: "#6366F1", bgColor: "#EEF2FF" },
  police_criminal:   { icon: "shield-checkmark-outline", iconColor: "#F59E0B", bgColor: "#FEF3C7" },
  consumer_complaint:{ icon: "cart-outline",             iconColor: "#22C55E", bgColor: "#DCFCE7" },
  cyber_fraud:       { icon: "lock-closed-outline",      iconColor: "#EF4444", bgColor: "#FEE2E2" },
};
const DEFAULT_CAT = { icon: "document-text-outline", iconColor: "#6366F1", bgColor: "#EEF2FF" };

// ── Types ─────────────────────────────────────────────────────────────────────

interface Complaint {
  _id: string;
  category: string;
  subcategory: string;
  status: string;
  created_at: string;
  portal_ref?: string;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const theme  = useTheme();
  const { t }  = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [activeCategory,  setActiveCategory]  = useState<Category | null>(null);
  const [sheetVisible,    setSheetVisible]    = useState(false);
  const [fabSheetVisible, setFabSheetVisible] = useState(false);
  const [drawerVisible,   setDrawerVisible]   = useState(false);
  const [menuVisible,     setMenuVisible]     = useState(false);
  const [recentCases,     setRecentCases]     = useState<Complaint[]>([]);

  const sheetAnim    = useRef(new Animated.Value(0)).current;
  const fabSheetAnim = useRef(new Animated.Value(0)).current;
  const menuAnim     = useRef(new Animated.Value(0)).current;

  const loadRecentCases = useCallback(async () => {
    try {
      const data = await api.authedGet<Complaint[]>("/complaints/");
      setRecentCases(data.slice(0, 5));
    } catch {}
  }, []);

  // Reload every time this tab comes into focus
  useFocusEffect(useCallback(() => { loadRecentCases(); }, [loadRecentCases]));

  // ── FAB category picker ──────────────────────────────────────────────────
  const openFabSheet = useCallback(() => {
    setFabSheetVisible(true);
    Animated.spring(fabSheetAnim, { toValue: 1, useNativeDriver: true, bounciness: 4 }).start();
  }, [fabSheetAnim]);

  const closeFabSheet = useCallback(() => {
    Animated.timing(fabSheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setFabSheetVisible(false);
    });
  }, [fabSheetAnim]);

  const fabSheetTranslate = fabSheetAnim.interpolate({
    inputRange: [0, 1], outputRange: [500, 0],
  });

  // ── Sheet ────────────────────────────────────────────────────────────────
  const openSheet = useCallback((cat: Category) => {
    setActiveCategory(cat);
    setSheetVisible(true);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, bounciness: 4 }).start();
  }, [sheetAnim]);

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSheetVisible(false);
      setActiveCategory(null);
    });
  }, [sheetAnim]);

  const handleSubcategoryTap = useCallback((sub: Subcategory) => {
    closeSheet();
    setTimeout(() => router.push(`/chat/${sub.id}` as any), 220);
  }, [closeSheet, router]);

  const sheetTranslate = sheetAnim.interpolate({
    inputRange: [0, 1], outputRange: [500, 0],
  });

  // ── Hamburger menu ───────────────────────────────────────────────────────
  const openMenu = useCallback(() => {
    loadRecentCases(); // always fetch fresh data when opening the drawer
    setMenuVisible(true);
    Animated.timing(menuAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [menuAnim, loadRecentCases]);

  const closeMenu = useCallback(() => {
    Animated.timing(menuAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setMenuVisible(false);
    });
  }, [menuAnim]);

  const menuTranslate = menuAnim.interpolate({
    inputRange: [0, 1], outputRange: [-320, 0],
  });
  const overlayOpacity = menuAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 0.5],
  });

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={s.headerIcon}
          onPress={openMenu}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="menu" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[s.brandName, { color: theme.primary }]}>Nivedan</Text>

        <TouchableOpacity
          style={s.headerIcon}
          onPress={() => setDrawerVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
          {unreadCount > 0 && (
            <View style={[s.badge, { backgroundColor: theme.error }]}>
              <Text style={s.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Greeting ───────────────────────────────────────────────── */}
        <View style={s.greeting}>
          <View style={s.greetRow}>
            <Text style={[s.greetName, { color: theme.text }]}>{t("greeting", { name: firstName })}</Text>
          </View>
          <Text style={[s.greetSub, { color: theme.subtext }]}>{t("tagline")}</Text>
        </View>

        {/* ── AI Banner ──────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[s.aiBanner, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
          onPress={openFabSheet}
        >
          <View style={s.aiBannerText}>
            <Text style={s.aiBannerSmall}>{t("newToFiling")}</Text>
            <Text style={s.aiBannerTitle}>{t("letAiGuide")}</Text>
            <Text style={s.aiBannerLink}>{t("startComplaint")}</Text>
          </View>
          <View style={[s.aiBannerIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Ionicons name="hardware-chip-outline" size={42} color="rgba(255,255,255,0.9)" />
          </View>
        </TouchableOpacity>

        {/* ── Categories ─────────────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: theme.text }]}>{t("categories")}</Text>
          <TouchableOpacity onPress={openFabSheet}>
            <Text style={[s.viewAll, { color: theme.primary }]}>{t("viewAll")}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.grid}>
          {CATEGORIES.map((cat) => {
            const cfg = CAT_CONFIG[cat.id] ?? DEFAULT_CAT;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[s.catCard, { backgroundColor: theme.surface }]}
                onPress={() => openSheet(cat)}
                activeOpacity={0.75}
              >
                <View style={[s.catIconWrap, { backgroundColor: cfg.bgColor }]}>
                  <Ionicons name={cfg.icon} size={28} color={cfg.iconColor} />
                </View>
                <Text style={[s.catLabel, { color: theme.text }]}>
                  {t(`cat_${cat.id}` as keyof Strings) || cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── FAB ──────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: theme.primary }]}
        onPress={openFabSheet}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Notification Drawer ──────────────────────────────────────── */}
      <NotificationDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />

      {/* ── Hamburger Menu Drawer ─────────────────────────────────────── */}
      {menuVisible && (
        <>
          {/* Dimmed overlay */}
          <Animated.View
            style={[s.menuOverlay, { opacity: overlayOpacity }]}
            pointerEvents="auto"
          >
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeMenu} />
          </Animated.View>

          {/* Slide-in panel */}
          <Animated.View
            style={[
              s.menuPanel,
              { backgroundColor: theme.surface, transform: [{ translateX: menuTranslate }] },
            ]}
          >
            {/* Panel header */}
            <View style={[s.menuHeader, { borderBottomColor: theme.outlineVariant }]}>
              <View style={[s.menuAvatar, { backgroundColor: theme.primary }]}>
                <Text style={s.menuAvatarText}>
                  {(user?.name ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.menuName, { color: theme.text }]}>{user?.name ?? ""}</Text>
                <Text style={[s.menuEmail, { color: theme.subtext }]} numberOfLines={1}>
                  {user?.email ?? ""}
                </Text>
              </View>
              <TouchableOpacity onPress={closeMenu} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            {/* Recent Cases */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={s.menuSection}>
                <Text style={[s.menuSectionTitle, { color: theme.subtext }]}>{t("recentCasesTitle")}</Text>

                {recentCases.length === 0 ? (
                  <View style={[s.menuEmpty, { backgroundColor: theme.surfaceContainerLow }]}>
                    <Ionicons name="folder-open-outline" size={28} color={theme.subtext} />
                    <Text style={[s.menuEmptyText, { color: theme.subtext }]}>{t("noCasesYet")}</Text>
                  </View>
                ) : (
                  recentCases.map((item) => {
                    const statusColor = STATUS_COLORS[item.status] ?? "#9CA3AF";
                    const statusLabel = t(`status${item.status.charAt(0).toUpperCase() + item.status.replace(/_([a-z])/g, (_, c) => c.toUpperCase()).slice(1)}` as keyof Strings) || item.status;
                    const subLabel = item.subcategory
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());
                    const refNum = item.portal_ref
                      ? `#${item.portal_ref}`
                      : `#NIV-${item._id.slice(-6).toUpperCase()}`;

                    return (
                      <TouchableOpacity
                        key={item._id}
                        style={[s.menuCaseCard, { backgroundColor: theme.surfaceContainerLow }]}
                        onPress={() => {
                          closeMenu();
                          setTimeout(() => router.push("/(tabs)/dashboard" as any), 230);
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={s.menuCaseTop}>
                          <Text style={[s.menuCaseRef, { color: theme.subtext }]}>{refNum}</Text>
                          <View style={[s.menuStatusChip, { backgroundColor: statusColor + "20" }]}>
                            <Text style={[s.menuStatusText, { color: statusColor }]}>
                              {statusLabel}
                            </Text>
                          </View>
                        </View>
                        <Text style={[s.menuCaseTitle, { color: theme.text }]}>{subLabel}</Text>
                      </TouchableOpacity>
                    );
                  })
                )}

                <TouchableOpacity
                  style={[s.menuSeeAll, { borderColor: theme.primary + "40", backgroundColor: theme.primaryContainer }]}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => router.push("/(tabs)/dashboard" as any), 230);
                  }}
                >
                  <Text style={[s.menuSeeAllText, { color: theme.primary }]}>{t("seeAllCases")}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </>
      )}

      {/* ── FAB Category Picker ──────────────────────────────────────── */}
      {fabSheetVisible && (
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={closeFabSheet}>
          <Animated.View
            style={[s.sheet, { backgroundColor: theme.surface, transform: [{ translateY: fabSheetTranslate }] }]}
            // @ts-ignore
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e: any) => e.stopPropagation?.()}
          >
            <View style={[s.sheetHandle, { backgroundColor: theme.outlineVariant }]} />
            <View style={[s.sheetTitleRow, { marginBottom: 8 }]}>
              <View style={[s.sheetIconWrap, { backgroundColor: theme.primaryContainer }]}>
                <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
              </View>
              <View>
                <Text style={[s.sheetTitle, { color: theme.text }]}>{t("newComplaint")}</Text>
                <Text style={[s.sheetSub, { color: theme.subtext }]}>{t("selectCategory")}</Text>
              </View>
            </View>
            {CATEGORIES.map((cat) => {
              const cfg = CAT_CONFIG[cat.id] ?? DEFAULT_CAT;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.subItem, { borderBottomColor: theme.surfaceContainerHigh }]}
                  onPress={() => {
                    closeFabSheet();
                    setTimeout(() => openSheet(cat), 220);
                  }}
                >
                  <View style={[s.catIconWrap, { backgroundColor: cfg.bgColor, width: 40, height: 40, borderRadius: 12 }]}>
                    <Ionicons name={cfg.icon} size={20} color={cfg.iconColor} />
                  </View>
                  <Text style={[s.subItemLabel, { color: theme.text, flex: 1, marginLeft: 12 }]}>
                    {t(`cat_${cat.id}` as keyof Strings) || cat.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.primary} />
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* ── Subcategory Bottom Sheet ─────────────────────────────────── */}
      {sheetVisible && (
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={closeSheet}>
          <Animated.View
            style={[s.sheet, { backgroundColor: theme.surface, transform: [{ translateY: sheetTranslate }] }]}
            // @ts-ignore
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e: any) => e.stopPropagation?.()}
          >
            <View style={[s.sheetHandle, { backgroundColor: theme.outlineVariant }]} />

            {(() => {
              const cfg = activeCategory ? (CAT_CONFIG[activeCategory.id] ?? DEFAULT_CAT) : DEFAULT_CAT;
              return (
                <View style={s.sheetTitleRow}>
                  <View style={[s.sheetIconWrap, { backgroundColor: cfg.bgColor }]}>
                    <Ionicons name={cfg.icon} size={22} color={cfg.iconColor} />
                  </View>
                  <View>
                    <Text style={[s.sheetTitle, { color: theme.text }]}>
                      {activeCategory ? t(`cat_${activeCategory.id}` as keyof Strings) || activeCategory.label : ""}
                    </Text>
                    <Text style={[s.sheetSub, { color: theme.subtext }]}>Select issue type</Text>
                  </View>
                </View>
              );
            })()}

            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {activeCategory?.subcategories.map((sub, idx) => {
                const subLabel = t(`sub_${sub.id}` as keyof Strings) || sub.label;
                const subDesc  = sub.id === "salary_not_paid"
                  ? t("subdesc_salary_not_paid")
                  : sub.description;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      s.subItem,
                      { borderBottomColor: theme.surfaceContainerHigh },
                      idx === 0 && { borderTopWidth: 1, borderTopColor: theme.surfaceContainerHigh },
                    ]}
                    onPress={() => handleSubcategoryTap(sub)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[s.subItemLabel, { color: theme.text }]}>{subLabel}</Text>
                      {subDesc && (
                        <Text style={[s.subItemDesc, { color: theme.subtext }]}>{subDesc}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.primary} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 12 : 8,
    paddingBottom: 4,
  },
  headerIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  brandName:  { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  badge: {
    position: "absolute",
    top: 2, right: 2,
    minWidth: 15, height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 8, fontWeight: "800" },

  scroll: { paddingHorizontal: 20, paddingBottom: 32 },

  // Greeting
  greeting: { paddingTop: 20, marginBottom: 24 },
  greetRow: { flexDirection: "row", alignItems: "center" },
  greetName: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  greetSub:  { fontSize: 14, marginTop: 4, lineHeight: 20 },

  // AI Banner
  aiBanner: {
    borderRadius: 20,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
    overflow: "hidden",
  },
  aiBannerText:  { flex: 1 },
  aiBannerSmall: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginBottom: 4 },
  aiBannerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 8, letterSpacing: -0.3 },
  aiBannerLink:  { color: "#fff", fontSize: 13, textDecorationLine: "underline" },
  aiBannerIcon:  {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
    marginLeft: 16,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  viewAll:      { fontSize: 14, fontWeight: "600" },

  // Category grid — 2x2
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 32,
  },
  catCard: {
    width: "47%",
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  catIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: { fontSize: 14, fontWeight: "700", lineHeight: 20 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },

  // Hamburger menu drawer
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 100,
  },
  menuPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    zIndex: 101,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 48 : 56,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  menuAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  menuAvatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  menuName:       { fontSize: 15, fontWeight: "700" },
  menuEmail:      { fontSize: 12, marginTop: 2 },

  menuSection: { padding: 20 },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  menuEmpty: {
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  menuEmptyText: { fontSize: 13 },

  menuCaseCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  menuCaseTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  menuCaseRef: { fontSize: 11, fontWeight: "600" },
  menuCaseTitle: { fontSize: 14, fontWeight: "700" },
  menuStatusChip: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  menuStatusText: { fontSize: 11, fontWeight: "700" },

  menuSeeAll: {
    borderRadius: 100,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  menuSeeAllText: { fontSize: 14, fontWeight: "700" },

  // Overlay + sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
    maxHeight: "72%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: "center", marginTop: 12, marginBottom: 20,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sheetIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sheetTitle:    { fontSize: 17, fontWeight: "700" },
  sheetSub:      { fontSize: 12, marginTop: 2 },
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  subItemLabel: { fontSize: 15, fontWeight: "600" },
  subItemDesc:  { fontSize: 12, marginTop: 2 },
});

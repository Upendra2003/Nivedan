import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { CATEGORIES, type Category, type Subcategory } from "../../constants/categories";
import { useTheme } from "../../constants/theme";
import { api } from "../../services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Complaint {
  _id: string;
  category: string;
  subcategory: string;
  status: string;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "#64748b",
  submitted: "#1a56db",
  filed: "#1a56db",
  acknowledged: "#f59e0b",
  under_review: "#a855f7",
  next_step: "#22c55e",
  resolved: "#16a34a",
  failed: "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  submitted: "Submitted",
  filed: "Filed",
  acknowledged: "Acknowledged",
  under_review: "Under Review",
  next_step: "In Progress",
  resolved: "Resolved",
  failed: "Failed",
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentCases, setRecentCases] = useState<Complaint[]>([]);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // Load notifications badge + recent cases
  useEffect(() => {
    (async () => {
      try {
        const notes = await api.authedGet<any[]>("/notifications/mine");
        setUnreadCount(notes.length);
      } catch {}
    })();
    (async () => {
      try {
        const data = await api.authedGet<Complaint[]>("/complaints/");
        setRecentCases(data.slice(0, 3));
      } catch {}
    })();
  }, []);

  // Open bottom sheet for category
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
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={[s.logo, { color: theme.primary }]}>CivicFlow</Text>
          <TouchableOpacity
            style={[s.bellWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => {}}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.bellIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={[s.badge, { backgroundColor: "#ef4444" }]}>
                <Text style={s.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Greeting ───────────────────────────────────────────────────── */}
        <View style={s.greeting}>
          <Text style={[s.greetSub, { color: theme.subtext }]}>Good day,</Text>
          <Text style={[s.greetName, { color: theme.text }]}>Hello, {firstName} 👋</Text>
        </View>

        {/* ── Search bar ─────────────────────────────────────────────────── */}
        <View style={[s.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[s.searchIcon, { color: theme.subtext }]}>🔍</Text>
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            placeholder="Describe your issue..."
            placeholderTextColor={theme.subtext}
            editable={false}
            onPressIn={() => {}}
          />
        </View>

        {/* ── Category grid (2 columns) ───────────────────────────────────── */}
        <Text style={[s.sectionTitle, { color: theme.text }]}>Categories</Text>
        <View style={s.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[s.categoryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => openSheet(cat)}
              activeOpacity={0.75}
            >
              <Text style={s.catIcon}>{cat.icon}</Text>
              <Text style={[s.catLabel, { color: theme.text }]}>{cat.label}</Text>
              <Text style={[s.catCount, { color: theme.subtext }]}>
                {cat.subcategories.length} types
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent Cases ───────────────────────────────────────────────── */}
        {recentCases.length > 0 && (
          <>
            <View style={s.recentHeader}>
              <Text style={[s.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                Recent Cases
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard" as any)}>
                <Text style={[s.seeAll, { color: theme.primary }]}>See all →</Text>
              </TouchableOpacity>
            </View>
            {recentCases.map((item) => {
              const statusColor = STATUS_COLOR[item.status] ?? "#64748b";
              const statusLabel = STATUS_LABEL[item.status] ?? item.status;
              const subLabel = item.subcategory
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());
              const date = (() => {
                try {
                  return new Date(item.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short",
                  });
                } catch { return ""; }
              })();

              return (
                <View
                  key={item._id}
                  style={[s.caseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={s.caseTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.caseCategory, { color: theme.text }]}>{item.category}</Text>
                      <Text style={[s.caseSub, { color: theme.subtext }]}>{subLabel}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: statusColor + "22" }]}>
                      <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                  {date ? (
                    <Text style={[s.caseDate, { color: theme.subtext }]}>Filed {date}</Text>
                  ) : null}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* ── Subcategory Bottom Sheet ────────────────────────────────────── */}
      {sheetVisible && (
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={closeSheet}>
          <Animated.View
            style={[
              s.sheet,
              { backgroundColor: theme.surface, transform: [{ translateY: sheetTranslate }] },
            ]}
            // Stop propagation so tapping the sheet doesn't close it
            // @ts-ignore
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e: any) => e.stopPropagation?.()}
          >
            {/* Sheet handle */}
            <View style={[s.sheetHandle, { backgroundColor: theme.border }]} />

            <Text style={[s.sheetTitle, { color: theme.text }]}>
              {activeCategory?.icon}  {activeCategory?.label}
            </Text>
            <Text style={[s.sheetSub, { color: theme.subtext }]}>
              Select the type of issue
            </Text>

            <ScrollView style={s.sheetList} bounces={false}>
              {activeCategory?.subcategories.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[s.subItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleSubcategoryTap(sub)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.subItemLabel, { color: theme.text }]}>{sub.label}</Text>
                    {sub.description && (
                      <Text style={[s.subItemDesc, { color: theme.subtext }]}>
                        {sub.description}
                      </Text>
                    )}
                  </View>
                  <Text style={[s.subArrow, { color: theme.primary }]}>›</Text>
                </TouchableOpacity>
              ))}
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
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 16 : 8,
    marginBottom: 20,
  },
  logo: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  bellWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bellIcon: { fontSize: 18 },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  // Greeting
  greeting: { marginBottom: 20 },
  greetSub: { fontSize: 13 },
  greetName: { fontSize: 24, fontWeight: "700", marginTop: 2 },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 28,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15 },

  // Section title
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },

  // Category grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  categoryCard: {
    width: "47.5%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  catIcon: { fontSize: 28 },
  catLabel: { fontSize: 14, fontWeight: "700" },
  catCount: { fontSize: 12 },

  // Recent cases
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  seeAll: { fontSize: 13, fontWeight: "600" },
  caseCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  caseTop: { flexDirection: "row", alignItems: "flex-start" },
  caseCategory: { fontSize: 14, fontWeight: "600" },
  caseSub: { fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: "700" },
  caseDate: { fontSize: 11, marginTop: 8 },

  // Overlay + bottom sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: "70%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", paddingHorizontal: 20, marginBottom: 4 },
  sheetSub: { fontSize: 13, paddingHorizontal: 20, marginBottom: 12 },
  sheetList: {},
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  subItemLabel: { fontSize: 15, fontWeight: "600" },
  subItemDesc: { fontSize: 12, marginTop: 2 },
  subArrow: { fontSize: 22, fontWeight: "300" },
});

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../../services/api";
import { useTheme, STATUS_COLORS, trustStripColor } from "../../constants/theme";
import { useTranslation, type Strings } from "../../constants/i18n";
import { useNotifications } from "../../context/NotificationContext";

interface Complaint {
  _id: string;
  category: string;
  subcategory: string;
  status: string;
  portal_ref: string | null;
  created_at: string;
  agent_state: string;
}

function statusKey(s: string): keyof Strings {
  return ("status" +
    s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")) as keyof Strings;
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { notifications } = useNotifications();
  const router = useRouter();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  // silent=true: update list without showing any spinner (used for background polls)
  const load = useCallback(async (isRefresh = false, silent = false) => {
    if (!silent) {
      if (isRefresh) setRefreshing(true);
      else           setLoading(true);
      setError(null);
    }
    try {
      const data = await api.authedGet<Complaint[]>("/complaints/");
      setComplaints(data);
    } catch (e: any) {
      if (!silent) {
        let msg = t("couldNotLoad");
        try { msg = JSON.parse(e.message).error; } catch {}
        setError(msg);
      }
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [t]);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // ── Auto-poll every 8s while the tab is focused ────────────────────────────
  // Only poll when at least one complaint is in an active (non-terminal) state
  const ACTIVE_STATUSES = new Set(["pending", "filed", "acknowledged", "under_review", "next_step"]);
  useFocusEffect(
    useCallback(() => {
      const poll = setInterval(() => {
        const hasActive = complaints.some((c) => ACTIVE_STATUSES.has(c.status));
        if (AppState.currentState === "active" && hasActive) load(false, true);
      }, 8_000);
      return () => clearInterval(poll);
    }, [load, complaints])
  );

  // ── Immediately refresh when a new notification arrives ────────────────────
  const prevNotifCountRef    = useRef(0);
  const notifInitializedRef  = useRef(false);

  useEffect(() => {
    if (!notifInitializedRef.current) {
      notifInitializedRef.current = true;
      prevNotifCountRef.current   = notifications.length;
      return;
    }
    if (notifications.length > prevNotifCountRef.current) {
      prevNotifCountRef.current = notifications.length;
      load(false, true); // new notification arrived — silent refresh
    } else {
      prevNotifCountRef.current = notifications.length;
    }
  }, [notifications, load]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteComplaint = useCallback((id: string) => {
    Alert.alert(
      t("deleteComplaintTitle"),
      t("deleteConfirm"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("deleteBtn"),
          style: "destructive",
          onPress: async () => {
            try {
              await api.authedDelete(`/complaints/${id}`);
              setComplaints((prev) => prev.filter((c) => c._id !== id));
            } catch (e: any) {
              let msg = t("couldNotDelete");
              try {
                const parsed = JSON.parse(e.message);
                msg = parsed.error ?? e.message;
              } catch {
                msg = e.message ?? t("couldNotDelete");
              }
              Alert.alert(t("errorTitle"), msg);
            }
          },
        },
      ]
    );
  }, [t]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      });
    } catch { return iso; }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[s.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.secondary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: theme.surface }]}>
        <Text style={[s.title, { color: theme.primary }]}>{t("myCasesHeader")}</Text>
        {complaints.length > 0 && (
          <View style={[s.countChip, { backgroundColor: theme.primaryContainer }]}>
            <Text style={[s.countText, { color: theme.primary }]}>{complaints.length}</Text>
          </View>
        )}
      </View>

      {/* Error */}
      {error && (
        <View style={[s.errorBox, { backgroundColor: theme.errorContainer, margin: 16 }]}>
          <Ionicons name="alert-circle-outline" size={18} color={theme.error} />
          <Text style={[s.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity onPress={() => load()}>
            <Text style={[s.retryText, { color: theme.secondary }]}>{t("retry")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {!error && complaints.length === 0 && (
        <View style={s.center}>
          <View style={[s.emptyIcon, { backgroundColor: theme.primaryContainer }]}>
            <Ionicons name="briefcase-outline" size={36} color={theme.primary} />
          </View>
          <Text style={[s.emptyTitle, { color: theme.primary }]}>{t("noCasesYet")}</Text>
          <Text style={[s.emptySub, { color: theme.subtext }]}>{t("fileFromHome")}</Text>
        </View>
      )}

      <FlatList
        data={complaints}
        keyExtractor={(c) => c._id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={theme.secondary}
            colors={[theme.secondary]}
          />
        }
        renderItem={({ item }) => {
          const statusColor = STATUS_COLORS[item.status] ?? "#75777F";
          const statusLabel = t(statusKey(item.status)) || item.status;
          const strip       = trustStripColor(item.status);
          const subLabel    = item.subcategory
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push({ pathname: `/chat/${item.subcategory}` as any, params: { complaint_id: item._id } })}
            >
            <View style={[s.card, { backgroundColor: theme.surface }]}>
              <View style={[s.trustStrip, { backgroundColor: strip }]} />
              <View style={s.cardContent}>
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardCategory, { color: theme.primary }]}>
                      {item.category}
                    </Text>
                    <Text style={[s.cardSub, { color: theme.subtext }]}>{subLabel}</Text>
                  </View>
                  <View style={[s.statusChip, { backgroundColor: statusColor + "18" }]}>
                    <Text style={[s.statusChipText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                <View style={[s.cardDivider, { backgroundColor: theme.surfaceContainerHigh }]} />

                <View style={s.cardBottom}>
                  <View style={s.metaRow}>
                    <Ionicons name="calendar-outline" size={12} color={theme.subtext} />
                    <Text style={[s.cardMeta, { color: theme.subtext }]}>
                      {formatDate(item.created_at)}
                    </Text>
                  </View>
                  <View style={s.metaRow}>
                    {item.portal_ref && (
                      <>
                        <Ionicons name="receipt-outline" size={12} color={theme.secondary} />
                        <Text style={[s.cardRef, { color: theme.secondary }]}>
                          Ref: {item.portal_ref}
                        </Text>
                      </>
                    )}
                    {item.status === "pending" && (
                      <TouchableOpacity
                        style={[s.deleteBtn, { backgroundColor: theme.errorContainer }]}
                        onPress={() => deleteComplaint(item._id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="trash-outline" size={13} color={theme.error} />
                        <Text style={[s.deleteBtnText, { color: theme.error }]}>{t("deleteBtn")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: "#1B2A4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title:     { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  countChip: { borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4 },
  countText: { fontSize: 13, fontWeight: "700" },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: "500" },
  retryText: { fontSize: 13, fontWeight: "700" },

  emptyIcon:  { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySub:   { fontSize: 14, textAlign: "center" },

  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 12 },

  card: {
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#1B2A4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  trustStrip:   { width: 4 },
  cardContent:  { flex: 1, padding: 14 },
  cardTop:      { flexDirection: "row", alignItems: "flex-start" },
  cardCategory: { fontSize: 15, fontWeight: "700" },
  cardSub:      { fontSize: 13, marginTop: 2 },
  statusChip:   {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
    alignSelf: "flex-start",
  },
  statusChipText: { fontSize: 11, fontWeight: "700" },

  cardDivider: { height: 1, marginVertical: 12 },
  cardBottom:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaRow:     { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMeta:    { fontSize: 12 },
  cardRef:     { fontSize: 12, fontWeight: "600" },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deleteBtnText: { fontSize: 12, fontWeight: "700" },
});

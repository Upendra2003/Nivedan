import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../services/api";

const PURPLE = "#7c3aed";

interface Complaint {
  _id: string;
  category: string;
  subcategory: string;
  status: string;
  portal_ref: string | null;
  created_at: string;
  agent_state: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "#64748b",
  submitted: "#3b82f6",
  next_step: "#22c55e",
  resolved: "#16a34a",
  failed: "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  submitted: "Submitted",
  next_step: "In Progress",
  resolved: "Resolved",
  failed: "Failed",
};

export default function DashboardScreen() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const bg = dark ? "#0d0d0d" : "#f8fafc";
  const card = dark ? "#1a1a1a" : "#ffffff";
  const textColor = dark ? "#f1f5f9" : "#1e293b";
  const subColor = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "#2a2a2a" : "#e2e8f0";

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await api.authedGet<Complaint[]>("/complaints/");
      setComplaints(data);
    } catch (e: any) {
      let msg = "Could not load cases.";
      try { msg = JSON.parse(e.message).error; } catch {}
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch { return iso; }
  };

  if (loading) {
    return (
      <SafeAreaView style={[s.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: bg }]}>
      <Text style={[s.title, { color: textColor }]}>My Cases</Text>

      {error && (
        <View style={[s.errorBox, { backgroundColor: "#fee2e2" }]}>
          <Text style={{ color: "#dc2626" }}>{error}</Text>
          <TouchableOpacity onPress={() => load()}>
            <Text style={{ color: PURPLE, marginTop: 8 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!error && complaints.length === 0 && (
        <View style={s.center}>
          <Text style={{ color: subColor, fontSize: 16 }}>No cases yet.</Text>
          <Text style={{ color: subColor, fontSize: 14, marginTop: 6 }}>
            File a complaint from the Home tab.
          </Text>
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
            tintColor={PURPLE}
          />
        }
        renderItem={({ item }) => {
          const statusColor = STATUS_COLOR[item.status] ?? "#64748b";
          const statusLabel = STATUS_LABEL[item.status] ?? item.status;
          const subLabel = item.subcategory.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <View style={[s.card, { backgroundColor: card, borderColor: border }]}>
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cardCategory, { color: textColor }]}>
                    {item.category}
                  </Text>
                  <Text style={[s.cardSub, { color: subColor }]}>{subLabel}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: statusColor + "22" }]}>
                  <Text style={[s.badgeText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>

              <View style={[s.divider, { backgroundColor: border }]} />

              <View style={s.cardBottom}>
                <Text style={[s.cardMeta, { color: subColor }]}>
                  Filed {formatDate(item.created_at)}
                </Text>
                {item.portal_ref && (
                  <Text style={[s.cardRef, { color: PURPLE }]}>Ref: {item.portal_ref}</Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "700", paddingHorizontal: 20, paddingTop: 20, marginBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  cardCategory: { fontSize: 15, fontWeight: "600" },
  cardSub: { fontSize: 13, marginTop: 2 },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 1, marginVertical: 10 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardMeta: { fontSize: 12 },
  cardRef: { fontSize: 12, fontWeight: "600" },

  errorBox: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});

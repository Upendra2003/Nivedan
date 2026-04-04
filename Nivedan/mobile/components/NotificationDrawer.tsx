/**
 * NotificationDrawer
 * Slides in from the right. Shows all notifications with unread highlighting.
 * Design: Nivedan / Sovereign Ledger — navy + saffron palette.
 */
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../constants/theme";
import { useNotifications, type AppNotification } from "../context/NotificationContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.88, 360);

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ visible, onClose }: Props) {
  const theme  = useTheme();
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead, refreshNotifications } =
    useNotifications();
  const slideX = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      refreshNotifications();
      Animated.spring(slideX, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 220,
      }).start();
    } else {
      Animated.timing(slideX, {
        toValue: DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleTap = async (notif: AppNotification) => {
    if (!notif.read) await markRead(notif._id);
    onClose();
    if (notif.complaint_id) {
      setTimeout(() => router.push("/(tabs)/dashboard" as any), 200);
    }
  };

  const typeIcon = (type: string): any => {
    switch (type) {
      case "filed":        return "document-text-outline";
      case "acknowledged": return "eye-outline";
      case "under_review": return "search-outline";
      case "next_step":    return "checkmark-circle-outline";
      case "resolved":     return "trophy-outline";
      case "failed":       return "close-circle-outline";
      default:             return "notifications-outline";
    }
  };

  const typeColor = (type: string): string => {
    if (type === "resolved" || type === "next_step") return "#22C55E";
    if (type === "failed")    return "#BA1A1A";
    if (type === "filed")     return theme.primary;
    return theme.secondary;
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableOpacity
        style={s.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Drawer */}
      <Animated.View
        style={[
          s.drawer,
          { backgroundColor: theme.surface, transform: [{ translateX: slideX }] },
        ]}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          {/* Header */}
          <View style={[s.header, { backgroundColor: theme.primary }]}>
            <View>
              <Text style={s.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={s.headerSub}>{unreadCount} unread</Text>
              )}
            </View>
            <View style={s.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={() => markAllRead()}>
                  <Text style={[s.markAllText, { color: theme.secondary }]}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* List */}
          {notifications.length === 0 ? (
            <View style={s.empty}>
              <View style={[s.emptyIconWrap, { backgroundColor: theme.primaryContainer }]}>
                <Ionicons name="notifications-off-outline" size={32} color={theme.primary} />
              </View>
              <Text style={[s.emptyTitle, { color: theme.primary }]}>All caught up</Text>
              <Text style={[s.emptyText, { color: theme.subtext }]}>No notifications yet</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(n) => n._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const ic    = typeIcon(item.type);
                const color = typeColor(item.type);
                return (
                  <TouchableOpacity
                    onPress={() => handleTap(item)}
                    style={[
                      s.item,
                      {
                        backgroundColor: item.read
                          ? "transparent"
                          : theme.primary + "08",
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={[s.itemIconWrap, { backgroundColor: color + "18" }]}>
                      <Ionicons name={ic} size={18} color={color} />
                    </View>
                    <View style={s.itemBody}>
                      <Text
                        style={[
                          s.itemMessage,
                          { color: theme.text, fontWeight: item.read ? "400" : "600" },
                        ]}
                        numberOfLines={3}
                      >
                        {item.message}
                      </Text>
                      <Text style={[s.itemTime, { color: theme.subtext }]}>
                        {timeAgo(item.created_at)}
                      </Text>
                    </View>
                    {!item.read && (
                      <View style={[s.unreadDot, { backgroundColor: theme.secondary }]} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => (
                <View style={[s.separator, { backgroundColor: theme.surfaceContainerHigh }]} />
              )}
            />
          )}
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

function timeAgo(isoString: string): string {
  try {
    const diff  = Date.now() - new Date(isoString).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins < 1)   return "just now";
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  } catch { return ""; }
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,18,32,0.5)",
  },
  drawer: {
    position: "absolute",
    right: 0, top: 0, bottom: 0,
    width: DRAWER_WIDTH,
    shadowColor: "#000",
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  headerTitle:   { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub:     { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  markAllText:   { fontSize: 12, fontWeight: "700" },

  empty:         { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  emptyTitle:    { fontSize: 16, fontWeight: "700" },
  emptyText:     { fontSize: 13 },

  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  itemIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", marginTop: 1 },
  itemBody:     { flex: 1, gap: 4 },
  itemMessage:  { fontSize: 13, lineHeight: 19 },
  itemTime:     { fontSize: 11 },
  unreadDot:    { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  separator:    { height: 1, marginHorizontal: 16 },
});

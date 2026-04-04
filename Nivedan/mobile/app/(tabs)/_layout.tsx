import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "../../constants/i18n";

export default function TabsLayout() {
  const insets   = useSafeAreaInsets();
  const { t }    = useTranslation();
  const bg       = "#FFFFFF";
  const border   = "#E5E7EB";
  const active   = "#6366F1";
  const inactive = "#9CA3AF";

  const bottomPad = Math.max(insets.bottom, Platform.OS === "ios" ? 8 : 6);
  const barHeight = 52 + bottomPad;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          borderTopWidth: 1,
          paddingBottom: bottomPad,
          paddingTop: 8,
          height: barHeight,
        },
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabHome"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tabMyCases"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "folder" : "folder-outline"} size={22} color={color} />
          ),
        }}
      />
      {/* Assistant tab hidden from nav bar — still accessible via /chat routes */}
      <Tabs.Screen
        name="assistant"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabProfile"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

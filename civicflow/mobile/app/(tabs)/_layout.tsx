import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

export default function TabsLayout() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: dark ? "#1a1a1a" : "#ffffff",
          borderTopColor: dark ? "#2a2a2a" : "#e2e8f0",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#7c3aed",
        tabBarInactiveTintColor: dark ? "#555555" : "#94a3b8",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home" }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{ title: "My Cases" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />
    </Tabs>
  );
}

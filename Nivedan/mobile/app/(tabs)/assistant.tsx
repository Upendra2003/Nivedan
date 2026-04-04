import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../constants/theme";

export default function AssistantScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
      <View style={s.center}>
        <View style={[s.iconWrap, { backgroundColor: theme.primaryContainer }]}>
          <Ionicons name="hardware-chip-outline" size={48} color={theme.primary} />
        </View>
        <Text style={[s.title, { color: theme.text }]}>AI Assistant</Text>
        <Text style={[s.sub, { color: theme.subtext }]}>
          Start a complaint from the Home tab to chat with the AI assistant.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  center:  { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  iconWrap: {
    width: 96, height: 96, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  sub:   { fontSize: 14, textAlign: "center", lineHeight: 22 },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  text: string;
}

export default function AgentMessage({ text }: Props) {
  return (
    <View style={styles.bubble}>
      <Text style={styles.label}>CivicFlow</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
    maxWidth: "80%",
  },
  label: { fontSize: 11, color: "#64748b", marginBottom: 2 },
  text: { fontSize: 14, color: "#0f172a" },
});

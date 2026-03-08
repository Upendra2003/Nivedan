import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../constants/theme";

interface Props {
  filename: string;
  pageCount?: number;
  onView: () => void;
  onApproveSubmit: () => void;
}

export default function PdfCard({ filename, pageCount, onView, onApproveSubmit }: Props) {
  const theme = useTheme();

  return (
    <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={s.fileRow}>
        <View style={[s.iconBox, { backgroundColor: theme.primary + "22" }]}>
          <Text style={s.iconText}>📄</Text>
        </View>
        <View style={s.fileInfo}>
          <Text style={[s.filename, { color: theme.text }]} numberOfLines={1}>
            {filename}
          </Text>
          {pageCount != null && (
            <Text style={[s.meta, { color: theme.subtext }]}>
              {pageCount} {pageCount === 1 ? "page" : "pages"}
            </Text>
          )}
        </View>
      </View>

      <View style={[s.divider, { backgroundColor: theme.border }]} />

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.viewBtn, { borderColor: theme.border }]}
          onPress={onView}
        >
          <Text style={[s.viewText, { color: theme.primary }]}>View PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: theme.primary }]}
          onPress={onApproveSubmit}
        >
          <Text style={s.submitText}>Approve & Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginVertical: 4,
    maxWidth: "90%",
    alignSelf: "flex-start",
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 20 },
  fileInfo: { flex: 1 },
  filename: { fontSize: 14, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  divider: { height: 1 },
  actions: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  viewBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  viewText: { fontSize: 13, fontWeight: "600" },
  submitBtn: {
    flex: 2,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});

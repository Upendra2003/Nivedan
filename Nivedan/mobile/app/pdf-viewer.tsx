/**
 * pdf-viewer.tsx — Full-screen in-app PDF viewer (native route).
 *
 * Flow:
 *   1. Chat screen stores PDF data + callbacks in pdfStore → router.push("/pdf-viewer")
 *   2. This screen reads pdfStore and renders the PDF via NativePdfRenderer
 *      (WebView on iOS, placeholder on Android in Expo Go)
 *   3. Approve → calls onApprove callback → router.back()
 *   4. Request Changes → text input → calls onRequestChanges(text) → router.back()
 */
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { clearPdfViewerData, getPdfViewerData } from "../utils/pdfStore";
import { useTheme } from "../constants/theme";
import NativePdfRenderer from "../components/NativePdfRenderer";

export default function PdfViewerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const data = getPdfViewerData();

  const [showChanges, setShowChanges] = useState(false);
  const [changesText, setChangesText] = useState("");

  const close = () => {
    clearPdfViewerData();
    router.back();
  };

  const handleApprove = () => {
    data?.onApprove();
    clearPdfViewerData();
    router.back();
  };

  const handleSendChanges = () => {
    const text = changesText.trim();
    if (!text) return;
    data?.onRequestChanges(text);
    clearPdfViewerData();
    router.back();
  };

  if (!data) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, padding: 20 }}>No PDF data available.</Text>
      </SafeAreaView>
    );
  }

  const title = `${data.category} Complaint Form`;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[s.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity
          onPress={close}
          style={s.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[s.closeText, { color: theme.subtext }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* PDF body */}
      <View style={[s.body, { backgroundColor: theme.background }]}>
        {data.pdfBase64 ? (
          <NativePdfRenderer pdfBase64={data.pdfBase64} />
        ) : (
          <View style={s.center}>
            <Text style={s.bigIcon}>📄</Text>
            <Text style={[s.hint, { color: theme.subtext }]}>No PDF content.</Text>
          </View>
        )}
      </View>

      {/* Request Changes input */}
      {showChanges && (
        <View
          style={[
            s.changesBar,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <TextInput
            style={[
              s.changesInput,
              {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={changesText}
            onChangeText={setChangesText}
            placeholder="Describe what needs to be changed…"
            placeholderTextColor={theme.subtext}
            multiline
            autoFocus
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: theme.primary }]}
            onPress={handleSendChanges}
            disabled={!changesText.trim()}
          >
            <Text style={s.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom action bar */}
      {!showChanges && (
        <View
          style={[
            s.footer,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={[s.changesBtn, { borderColor: theme.border }]}
            onPress={() => setShowChanges(true)}
          >
            <Text style={[s.changesBtnText, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
              ✏  Changes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.approveBtn} onPress={handleApprove}>
            <Text style={s.approveBtnText} numberOfLines={1}>✓  Approve & Submit</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: "700" },
  closeBtn:    { padding: 4 },
  closeText:   { fontSize: 18, fontWeight: "600" },

  body:    { flex: 1 },
  center:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
  bigIcon: { fontSize: 56 },
  hint:    { fontSize: 13, textAlign: "center", lineHeight: 20 },

  changesBar: {
    borderTopWidth: 1,
    padding: 12,
    gap: 8,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  changesInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 120,
  },
  sendBtn:     { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12, alignItems: "center" },
  sendBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
  },
  changesBtn:     { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  changesBtnText: { fontSize: 13, fontWeight: "600" },
  approveBtn:     { flex: 2.5, borderRadius: 10, paddingVertical: 14, alignItems: "center", backgroundColor: "#16a34a" },
  approveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

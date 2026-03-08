/**
 * PdfViewer — full-screen modal PDF viewer.
 *
 * Note: Native PDF rendering requires react-native-pdf (dev build only).
 * In Expo Go a placeholder is shown. Full integration is Phase 7.
 */
import React from "react";
import {
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../constants/theme";

interface Props {
  visible: boolean;
  filename: string;
  /** Base64-encoded PDF string (without data: prefix). */
  pdfBase64?: string;
  onClose: () => void;
  onApproveSubmit: () => void;
  onRequestChanges: () => void;
}

export default function PdfViewer({
  visible,
  filename,
  pdfBase64,
  onClose,
  onApproveSubmit,
  onRequestChanges,
}: Props) {
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[s.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[s.filename, { color: theme.text }]} numberOfLines={1}>
            {filename}
          </Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[s.closeText, { color: theme.subtext }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* PDF body */}
        <View style={[s.body, { backgroundColor: theme.background }]}>
          {Platform.OS === "web" && pdfBase64 ? (
            // Web: render using an iframe via react-native-web
            <PdfWebView pdfBase64={pdfBase64} />
          ) : (
            // Native: placeholder (react-native-pdf goes here in Phase 7 dev build)
            <View style={s.placeholder}>
              <Text style={s.placeholderIcon}>📄</Text>
              <Text style={[s.placeholderTitle, { color: theme.text }]}>{filename}</Text>
              <Text style={[s.placeholderSub, { color: theme.subtext }]}>
                PDF preview requires a development build.{"\n"}
                Review the form details and approve below.
              </Text>
            </View>
          )}
        </View>

        {/* Bottom action bar */}
        <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[s.changesBtn, { borderColor: theme.border }]}
            onPress={onRequestChanges}
          >
            <Text style={[s.changesText, { color: theme.text }]}>Request Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.approveBtn, { backgroundColor: theme.primary }]}
            onPress={onApproveSubmit}
          >
            <Text style={s.approveText}>Approve & Submit</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/** Web-only PDF embed via iframe using a data URI. */
function PdfWebView({ pdfBase64 }: { pdfBase64: string }) {
  const src = `data:application/pdf;base64,${pdfBase64}`;
  // react-native-web renders View → div, so we use a style trick for iframe
  return (
    <View style={s.webContainer}>
      {/* @ts-ignore — iframe is valid HTML on web via react-native-web */}
      <iframe
        src={src}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="PDF Preview"
      />
    </View>
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
  filename: { flex: 1, fontSize: 16, fontWeight: "700" },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, fontWeight: "600" },

  body: { flex: 1 },

  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  placeholderIcon: { fontSize: 56 },
  placeholderTitle: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  placeholderSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },

  webContainer: { flex: 1 },

  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
  },
  changesBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  changesText: { fontSize: 14, fontWeight: "600" },
  approveBtn: {
    flex: 2,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  approveText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

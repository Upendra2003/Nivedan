/**
 * Native PDF renderer.
 * iOS     : WebView renders PDF inline from a data URI (WKWebView supports this natively).
 * Android : expo-sharing opens the PDF in the device's installed PDF viewer app.
 */
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WebView from "react-native-webview";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";

interface Props {
  pdfBase64: string;
}

export default function NativePdfRenderer({ pdfBase64 }: Props) {
  if (Platform.OS === "ios") {
    return (
      <WebView
        source={{ uri: `data:application/pdf;base64,${pdfBase64}` }}
        style={s.fill}
        originWhitelist={["*"]}
      />
    );
  }
  return <AndroidPdfOpener pdfBase64={pdfBase64} />;
}

function AndroidPdfOpener({ pdfBase64 }: { pdfBase64: string }) {
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState("");

  const open = async () => {
    if (!pdfBase64) {
      setError("No PDF data available.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Write base64 string to a temp PDF file.
      // Use the string literal "base64" — FileSystem.EncodingType may not be
      // accessible at runtime in all Expo Go builds.
      const cacheDir = FileSystem.cacheDirectory ?? "";
      const uri = cacheDir + "Nivedan_complaint.pdf";

      await FileSystem.writeAsStringAsync(uri, pdfBase64, {
        encoding: "base64" as FileSystem.EncodingType,
      });

      // Convert file:// URI → content:// URI, then open directly in PDF viewer
      // (no share sheet — opens the default/best available PDF app)
      const contentUri = await FileSystem.getContentUriAsync(uri);
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        flags: 1,           // FLAG_GRANT_READ_URI_PERMISSION
        type: "application/pdf",
      });

      setOpened(true);
    } catch (e: any) {
      setError(String(e?.message ?? e ?? "Could not open PDF."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.placeholder}>
      <Text style={s.icon}>📋</Text>
      <Text style={s.title}>Complaint Form Ready</Text>
      <Text style={s.sub}>
        {opened
          ? "PDF opened. Come back here to approve or request changes."
          : "Tap below to open your filled PDF in the device's PDF viewer."}
      </Text>

      {!!error && <Text style={s.error}>{error}</Text>}

      <TouchableOpacity
        style={[s.openBtn, loading && { opacity: 0.6 }]}
        onPress={open}
        disabled={loading}
        activeOpacity={0.75}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.openBtnText}>
            {opened ? "📄  View Again" : "📄  Open PDF"}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={s.hint}>
        After reviewing, close the PDF viewer and use the buttons below.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },

  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 14,
  },
  icon:  { fontSize: 52 },
  title: { fontSize: 17, fontWeight: "700", textAlign: "center", color: "#e2e8f0" },
  sub:   { fontSize: 13, textAlign: "center", color: "#94a3b8", lineHeight: 20 },
  error: { fontSize: 12, textAlign: "center", color: "#f87171", marginTop: 4 },
  hint:  { fontSize: 11, textAlign: "center", color: "#64748b", lineHeight: 18 },

  openBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 160,
    alignItems: "center",
    marginTop: 4,
  },
  openBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

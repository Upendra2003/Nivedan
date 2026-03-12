/**
 * ChatMessageRow
 * Renders a single message in the AI chat screen.
 * Exported types: Message (used by chat screen state)
 */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../constants/theme";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Message =
  | { id: string; type: "user"; text: string }
  | { id: string; type: "agent"; text: string }
  | { id: string; type: "action_buttons"; buttons: string[] }
  | { id: string; type: "status_update"; status: string; label: string }
  | { id: string; type: "pdf_card"; filename: string; pdfBase64?: string; label?: string }
  | { id: string; type: "signature_request" }
  | { id: string; type: "document_upload_request" }
  | { id: string; type: "uploaded_file_card"; filename: string; isSignature: boolean };

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChatMessageRow({
  msg,
  theme,
  onViewPdf,
  onActionBtn,
  onSignatureUpload,
  onSignatureSkip,
  onDocumentUpload,
  onDocumentsDone,
  uploading = false,
}: {
  msg: Message;
  theme: ReturnType<typeof useTheme>;
  onViewPdf: (filename: string, base64?: string) => void;
  onActionBtn: (btn: string) => void;
  onSignatureUpload?: () => void;
  onSignatureSkip?: () => void;
  onDocumentUpload?: (source: "camera" | "gallery" | "file") => void;
  onDocumentsDone?: () => void;
  uploading?: boolean;
}) {
  switch (msg.type) {
    case "user":
      return (
        <View style={s.userBubbleWrap}>
          <View style={[s.userBubble, { backgroundColor: theme.primary }]}>
            <Text style={s.userText}>{msg.text}</Text>
          </View>
        </View>
      );

    case "agent":
      return (
        <View style={s.agentBubbleWrap}>
          <View style={s.agentLabelRow}>
            <View style={[s.agentDot, { backgroundColor: theme.primary }]} />
            <Text style={[s.agentLabel, { color: theme.primary }]}>CivicFlow AI</Text>
          </View>
          <View style={[s.agentBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.agentText, { color: theme.text }]}>{msg.text}</Text>
          </View>
        </View>
      );

    case "action_buttons":
      return (
        <View style={s.actionRowWrap}>
          {msg.buttons.map((btn) => {
            const isPrimary = /^(yes|submit|haan|confirm|ok)/i.test(btn);
            return (
              <TouchableOpacity
                key={btn}
                style={[
                  s.actionBtn,
                  isPrimary
                    ? { backgroundColor: theme.primary }
                    : { borderColor: theme.border, borderWidth: 1 },
                ]}
                onPress={() => onActionBtn(btn)}
              >
                <Text style={[s.actionBtnText, { color: isPrimary ? "#fff" : theme.text }]}>
                  {btn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );

    case "status_update":
      return (
        <View style={[s.statusCard, { backgroundColor: "#22c55e18", borderColor: "#22c55e" }]}>
          <Text style={s.statusIcon}>✅</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.statusTitle, { color: "#16a34a" }]}>Complaint Filed!</Text>
            <Text style={[s.statusLabel, { color: "#16a34a" }]}>{msg.label}</Text>
          </View>
        </View>
      );

    case "pdf_card": {
      const isBlank = msg.label === "blank_form";
      return (
        <View style={s.agentBubbleWrap}>
          <View style={[s.pdfCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={s.pdfCardTop}>
              <Text style={s.pdfIcon}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.pdfName, { color: theme.text }]} numberOfLines={1}>
                  {msg.filename}
                </Text>
                <Text style={[s.pdfSub, { color: theme.subtext }]}>
                  {isBlank ? "Blank form — preview only" : "Filled complaint form"}
                </Text>
              </View>
            </View>
            <View style={s.pdfBtnRow}>
              <TouchableOpacity
                style={[s.pdfBtn, { borderColor: theme.border, borderWidth: 1 }]}
                onPress={() => onViewPdf(msg.filename, msg.pdfBase64)}
              >
                <Text style={[s.pdfBtnText, { color: theme.text }]}>View PDF</Text>
              </TouchableOpacity>
              {!isBlank && (
                <TouchableOpacity
                  style={[s.pdfBtn, { backgroundColor: theme.primary }]}
                  onPress={() => onActionBtn("yes, submit it")}
                >
                  <Text style={[s.pdfBtnText, { color: "#fff" }]}>Submit</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    case "signature_request":
      return (
        <View style={s.agentBubbleWrap}>
          <View style={[s.docCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={s.docCardIcon}>✍️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.docCardTitle, { color: theme.text }]}>Signature Required</Text>
              <Text style={[s.docCardSub, { color: theme.subtext }]}>
                {uploading ? "Uploading signature…" : "Upload a photo of your handwritten signature"}
              </Text>
            </View>
            <View style={s.docBtnRow}>
              <TouchableOpacity
                style={[s.docBtn, { backgroundColor: theme.primary, opacity: uploading ? 0.5 : 1 }]}
                onPress={() => onSignatureUpload?.()}
                disabled={uploading}
              >
                <Text style={s.docBtnTextWhite}>{uploading ? "Uploading…" : "📷 Upload"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.docBtn, { borderColor: theme.border, borderWidth: 1, opacity: uploading ? 0.4 : 1 }]}
                onPress={() => onSignatureSkip?.()}
                disabled={uploading}
              >
                <Text style={[s.docBtnText, { color: theme.text }]}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );

    case "document_upload_request":
      return (
        <View style={s.agentBubbleWrap}>
          <View style={[s.docCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={s.docCardIcon}>📎</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.docCardTitle, { color: theme.text }]}>Upload Documents</Text>
              <Text style={[s.docCardSub, { color: theme.subtext }]}>
                {uploading
                  ? "Uploading file, please wait…"
                  : "Pay slips, bank statements, letters, etc."}
              </Text>
            </View>
            <View style={[s.docBtnRow, { opacity: uploading ? 0.45 : 1 }]}>
              <TouchableOpacity
                style={[s.docBtn, { borderColor: theme.border, borderWidth: 1 }]}
                onPress={() => onDocumentUpload?.("camera")}
                disabled={uploading}
              >
                <Text style={[s.docBtnText, { color: theme.text }]}>📷 Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.docBtn, { borderColor: theme.border, borderWidth: 1 }]}
                onPress={() => onDocumentUpload?.("gallery")}
                disabled={uploading}
              >
                <Text style={[s.docBtnText, { color: theme.text }]}>🖼 Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.docBtn, { borderColor: theme.border, borderWidth: 1 }]}
                onPress={() => onDocumentUpload?.("file")}
                disabled={uploading}
              >
                <Text style={[s.docBtnText, { color: theme.text }]}>📄 File</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[s.doneBtn, { backgroundColor: theme.primary, opacity: uploading ? 0.45 : 1 }]}
              onPress={() => onDocumentsDone?.()}
              disabled={uploading}
            >
              <Text style={s.doneBtnText}>✓ Done — Generate My Form</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case "uploaded_file_card":
      return (
        <View style={[s.uploadedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={s.uploadedIcon}>{msg.isSignature ? "✍️" : "📎"}</Text>
          <Text style={[s.uploadedName, { color: theme.text }]} numberOfLines={1}>
            {msg.isSignature ? "Signature uploaded" : msg.filename}
          </Text>
          <Text style={[s.uploadedCheck, { color: "#22c55e" }]}>✓</Text>
        </View>
      );

    default:
      return null;
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  userBubbleWrap: { alignItems: "flex-end" },
  userBubble: {
    maxWidth: "78%",
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: { color: "#fff", fontSize: 15, lineHeight: 21 },

  agentBubbleWrap: { alignItems: "flex-start" },
  agentLabelRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  agentDot:  { width: 6, height: 6, borderRadius: 3 },
  agentLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  agentBubble: {
    maxWidth: "84%",
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  agentText: { fontSize: 15, lineHeight: 22 },

  actionRowWrap: { flexDirection: "row", gap: 10, marginTop: 4, flexWrap: "wrap" },
  actionBtn: {
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: "center",
  },
  actionBtnText: { fontSize: 14, fontWeight: "700" },

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  statusIcon:  { fontSize: 22 },
  statusTitle: { fontSize: 15, fontWeight: "700" },
  statusLabel: { fontSize: 13, marginTop: 2 },

  pdfCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    width: "92%",
  },
  pdfCardTop:  { flexDirection: "row", alignItems: "center", gap: 10 },
  pdfIcon:     { fontSize: 28 },
  pdfName:     { fontSize: 13, fontWeight: "700" },
  pdfSub:      { fontSize: 11, marginTop: 1 },
  pdfBtnRow:   { flexDirection: "row", gap: 8, marginTop: 4 },
  pdfBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  pdfBtnText: { fontSize: 14, fontWeight: "700" },

  docCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    width: "92%",
  },
  docCardIcon:  { fontSize: 26, marginBottom: 2 },
  docCardTitle: { fontSize: 14, fontWeight: "700" },
  docCardSub:   { fontSize: 11, marginTop: 2 },
  docBtnRow:    { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  docBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  docBtnTextWhite: { color: "#fff", fontSize: 13, fontWeight: "700" },
  docBtnText:      { fontSize: 13, fontWeight: "600" },
  doneBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  doneBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  uploadedCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    maxWidth: "80%",
  },
  uploadedIcon:  { fontSize: 18 },
  uploadedName:  { flex: 1, fontSize: 13 },
  uploadedCheck: { fontSize: 16, fontWeight: "700" },
});

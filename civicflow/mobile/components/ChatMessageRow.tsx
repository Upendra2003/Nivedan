/**
 * ChatMessageRow
 * Renders a single message in the AI chat screen.
 * Design: Nivedan / Sovereign Ledger — Navy + Saffron palette.
 */
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../constants/theme";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Message =
  | { id: string; type: "user"; text: string }
  | { id: string; type: "agent"; text: string }
  | { id: string; type: "thinking_summary"; steps: string[] }
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

    // ── User bubble ────────────────────────────────────────────────────────
    case "user":
      return (
        <View style={s.userBubbleWrap}>
          <View style={[s.userBubble, { backgroundColor: theme.primary }]}>
            <Text style={s.userText}>{msg.text}</Text>
          </View>
        </View>
      );

    // ── Agent bubble ───────────────────────────────────────────────────────
    case "agent":
      return (
        <View style={s.agentBubbleWrap}>
          <View style={s.agentLabelRow}>
            <View style={[s.agentDot, { backgroundColor: theme.secondary }]} />
            <Text style={[s.agentLabel, { color: theme.secondary }]}>Nivedan AI</Text>
          </View>
          <View style={[s.agentBubble, { backgroundColor: theme.surface }]}>
            <Text style={[s.agentText, { color: theme.text }]}>{msg.text}</Text>
          </View>
        </View>
      );

    // ── Action buttons ─────────────────────────────────────────────────────
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
                    ? { backgroundColor: theme.secondary }
                    : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.outlineVariant },
                ]}
                onPress={() => onActionBtn(btn)}
                activeOpacity={0.8}
              >
                <Text style={[s.actionBtnText, { color: isPrimary ? "#fff" : theme.text }]}>
                  {btn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );

    // ── Status update card ─────────────────────────────────────────────────
    case "status_update":
      return (
        <View style={[s.statusCard, { backgroundColor: "#22C55E18" }]}>
          <View style={[s.statusStrip, { backgroundColor: "#22C55E" }]} />
          <View style={s.statusInner}>
            <View style={[s.statusIconWrap, { backgroundColor: "#22C55E22" }]}>
              <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.statusTitle, { color: "#16A34A" }]}>Complaint Filed!</Text>
              <Text style={[s.statusLabel, { color: "#16A34A" }]}>{msg.label}</Text>
            </View>
          </View>
        </View>
      );

    // ── PDF card ───────────────────────────────────────────────────────────
    case "pdf_card": {
      const isBlank = msg.label === "blank_form";
      return (
        <View style={s.agentBubbleWrap}>
          <View style={[s.pdfCard, { backgroundColor: theme.surface }]}>
            <View style={[s.pdfCardTop, { gap: 10 }]}>
              <View style={[s.pdfIconWrap, { backgroundColor: theme.primaryContainer }]}>
                <Ionicons name="document-text" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.pdfName, { color: theme.primary }]} numberOfLines={1}>
                  {msg.filename}
                </Text>
                <Text style={[s.pdfSub, { color: theme.subtext }]}>
                  {isBlank ? "Blank form (preview only)" : "Filled complaint form"}
                </Text>
              </View>
            </View>
            <View style={s.pdfBtnRow}>
              <TouchableOpacity
                style={[s.pdfBtnOutline, { borderColor: theme.outlineVariant }]}
                onPress={() => onViewPdf(msg.filename, msg.pdfBase64)}
              >
                <Ionicons name="eye-outline" size={14} color={theme.primary} />
                <Text style={[s.pdfBtnText, { color: theme.primary }]}>View PDF</Text>
              </TouchableOpacity>
              {!isBlank && (
                <TouchableOpacity
                  style={[s.pdfBtnFilled, { backgroundColor: theme.secondary }]}
                  onPress={() => onActionBtn("yes, submit it")}
                >
                  <Ionicons name="cloud-upload-outline" size={14} color="#fff" />
                  <Text style={[s.pdfBtnText, { color: "#fff" }]}>Submit</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    // ── Signature request ──────────────────────────────────────────────────
    case "signature_request":
      return (
        <View style={s.agentBubbleWrap}>
          <View style={[s.docCard, { backgroundColor: theme.surface }]}>
            <View style={s.docCardHeader}>
              <View style={[s.docIconWrap, { backgroundColor: theme.secondaryContainer }]}>
                <Ionicons name="create-outline" size={20} color={theme.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.docCardTitle, { color: theme.primary }]}>Signature Required</Text>
                <Text style={[s.docCardSub, { color: theme.subtext }]}>
                  {uploading ? "Uploading signature…" : "Upload a photo of your handwritten signature"}
                </Text>
              </View>
            </View>
            <View style={s.docBtnRow}>
              <TouchableOpacity
                style={[s.docBtn, { backgroundColor: theme.secondary, opacity: uploading ? 0.5 : 1 }]}
                onPress={() => onSignatureUpload?.()}
                disabled={uploading}
              >
                <Ionicons name="camera-outline" size={14} color="#fff" />
                <Text style={s.docBtnTextWhite}>{uploading ? "Uploading…" : "Upload"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.docBtn, { borderWidth: 1, borderColor: theme.outlineVariant, opacity: uploading ? 0.4 : 1 }]}
                onPress={() => onSignatureSkip?.()}
                disabled={uploading}
              >
                <Text style={[s.docBtnText, { color: theme.subtext }]}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );

    // ── Document upload request ────────────────────────────────────────────
    case "document_upload_request":
      return (
        <View style={s.agentBubbleWrap}>
          <View style={[s.docCard, { backgroundColor: theme.surface }]}>
            <View style={s.docCardHeader}>
              <View style={[s.docIconWrap, { backgroundColor: theme.secondaryContainer }]}>
                <Ionicons name="attach-outline" size={20} color={theme.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.docCardTitle, { color: theme.primary }]}>Upload Documents</Text>
                <Text style={[s.docCardSub, { color: theme.subtext }]}>
                  {uploading
                    ? "Uploading file, please wait…"
                    : "Pay slips, bank statements, letters, etc."}
                </Text>
              </View>
            </View>
            <View style={[s.docBtnRow, { opacity: uploading ? 0.45 : 1 }]}>
              <TouchableOpacity
                style={[s.docBtn, { borderWidth: 1, borderColor: theme.outlineVariant }]}
                onPress={() => onDocumentUpload?.("camera")}
                disabled={uploading}
              >
                <Ionicons name="camera-outline" size={14} color={theme.primary} />
                <Text style={[s.docBtnText, { color: theme.primary }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.docBtn, { borderWidth: 1, borderColor: theme.outlineVariant }]}
                onPress={() => onDocumentUpload?.("gallery")}
                disabled={uploading}
              >
                <Ionicons name="images-outline" size={14} color={theme.primary} />
                <Text style={[s.docBtnText, { color: theme.primary }]}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.docBtn, { borderWidth: 1, borderColor: theme.outlineVariant }]}
                onPress={() => onDocumentUpload?.("file")}
                disabled={uploading}
              >
                <Ionicons name="document-outline" size={14} color={theme.primary} />
                <Text style={[s.docBtnText, { color: theme.primary }]}>File</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[s.doneBtn, { backgroundColor: theme.secondary, opacity: uploading ? 0.45 : 1 }]}
              onPress={() => onDocumentsDone?.()}
              disabled={uploading}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={s.doneBtnText}>Generate My Form</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    // ── Uploaded file card ─────────────────────────────────────────────────
    case "uploaded_file_card":
      return (
        <View style={[s.uploadedCard, { backgroundColor: theme.tertiaryContainer }]}>
          <Ionicons
            name={msg.isSignature ? "create" : "attach"}
            size={16}
            color={theme.tertiary}
          />
          <Text style={[s.uploadedName, { color: "#16A34A" }]} numberOfLines={1}>
            {msg.isSignature ? "Signature uploaded" : msg.filename}
          </Text>
          <Ionicons name="checkmark-circle" size={16} color={theme.tertiary} />
        </View>
      );

    // ── Thinking summary card (collapsible, persists in chat) ──────────────
    case "thinking_summary":
      return <ThinkingSummaryCard steps={msg.steps} theme={theme} />;

    default:
      return null;
  }
}

// ── ThinkingSummaryCard ────────────────────────────────────────────────────────

function ThinkingSummaryCard({
  steps,
  theme,
}: {
  steps: string[];
  theme: ReturnType<typeof useTheme>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => setExpanded((e) => !e)}
      style={[s.thinkCard, { backgroundColor: theme.primaryContainer, borderColor: theme.outlineVariant }]}
    >
      {/* Header row */}
      <View style={s.thinkHeader}>
        <View style={[s.thinkIconWrap, { backgroundColor: theme.primary }]}>
          <Ionicons name="hardware-chip-outline" size={11} color="#fff" />
        </View>
        <Text style={[s.thinkTitle, { color: theme.onPrimaryContainer }]}>
          Thought process
        </Text>
        <View style={{ flex: 1 }} />
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={theme.onPrimaryContainer}
        />
      </View>

      {/* Steps — shown when expanded */}
      {expanded && (
        <View style={s.thinkSteps}>
          {steps.map((step, i) => (
            <View key={i} style={s.thinkStepRow}>
              <View style={[s.thinkStepDot, { backgroundColor: theme.primary }]} />
              <Text style={[s.thinkStepText, { color: theme.onPrimaryContainer }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // User bubble
  userBubbleWrap: { alignItems: "flex-end" },
  userBubble: {
    maxWidth: "78%",
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: { color: "#fff", fontSize: 15, lineHeight: 21 },

  // Agent bubble
  agentBubbleWrap: { alignItems: "flex-start" },
  agentLabelRow:   { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  agentDot:        { width: 6, height: 6, borderRadius: 3 },
  agentLabel:      { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  agentBubble: {
    maxWidth: "84%",
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: "#1B2A4A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  agentText: { fontSize: 15, lineHeight: 22 },

  // Thinking summary card
  thinkCard: {
    alignSelf: "flex-start",
    maxWidth: "84%",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  thinkHeader:  { flexDirection: "row", alignItems: "center", gap: 7 },
  thinkIconWrap: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  thinkTitle:   { fontSize: 12, fontWeight: "600" },
  thinkSteps:   { gap: 6, paddingLeft: 2 },
  thinkStepRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  thinkStepDot: { width: 4, height: 4, borderRadius: 2, marginTop: 7, flexShrink: 0 },
  thinkStepText:{ fontSize: 12, lineHeight: 18, flex: 1 },

  // Action buttons
  actionRowWrap: { flexDirection: "row", gap: 10, marginTop: 4, flexWrap: "wrap" },
  actionBtn: {
    borderRadius: 100,
    paddingHorizontal: 22,
    paddingVertical: 11,
    minWidth: 90,
    alignItems: "center",
  },
  actionBtnText: { fontSize: 14, fontWeight: "700" },

  // Status card
  statusCard: {
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
  },
  statusStrip: { width: 4 },
  statusInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  statusIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statusTitle:    { fontSize: 14, fontWeight: "700" },
  statusLabel:    { fontSize: 12, marginTop: 2 },

  // PDF card
  pdfCard: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
    width: "92%",
    shadowColor: "#1B2A4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pdfCardTop:   { flexDirection: "row", alignItems: "center" },
  pdfIconWrap:  { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  pdfName:      { fontSize: 13, fontWeight: "700" },
  pdfSub:       { fontSize: 11, marginTop: 2 },
  pdfBtnRow:    { flexDirection: "row", gap: 8 },
  pdfBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 100,
    paddingVertical: 11,
    borderWidth: 1,
  },
  pdfBtnFilled: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 100,
    paddingVertical: 11,
  },
  pdfBtnText: { fontSize: 13, fontWeight: "700" },

  // Doc cards (signature + documents)
  docCard: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
    width: "92%",
    shadowColor: "#1B2A4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  docCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  docIconWrap:   { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  docCardTitle:  { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  docCardSub:    { fontSize: 12, lineHeight: 17 },
  docBtnRow:     { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  docBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  docBtnTextWhite: { color: "#fff", fontSize: 13, fontWeight: "700" },
  docBtnText:      { fontSize: 13, fontWeight: "600" },

  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 100,
    paddingVertical: 13,
  },
  doneBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Uploaded file card
  uploadedCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  uploadedName: { flex: 1, fontSize: 13, fontWeight: "600" },
});

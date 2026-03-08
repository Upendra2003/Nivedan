import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../services/api";
import { sendAgentMessage, AgentResponse } from "../../services/agent";
import { findSubcategory } from "../../constants/categories";
import { useTheme } from "../../constants/theme";
import ThinkingStrip from "../../components/ThinkingStrip";
import PdfCard from "../../components/PdfCard";
import PdfViewer from "../../components/PdfViewer";

// ── Types ─────────────────────────────────────────────────────────────────────

type Message =
  | { id: string; type: "user"; text: string }
  | { id: string; type: "agent"; text: string }
  | { id: string; type: "action_buttons"; buttons: string[] }
  | { id: string; type: "status_update"; status: string; label: string }
  | { id: string; type: "pdf_card"; filename: string; pdfBase64?: string; label?: string };

type Stage = "loading" | "chatting" | "confirming" | "submitted";

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { category: paramId } = useLocalSearchParams<{ category: string }>();
  const router   = useRouter();
  const theme    = useTheme();
  const insets   = useSafeAreaInsets();

  const resolved       = paramId ? findSubcategory(paramId) : null;
  const parentCategory = resolved?.category ?? null;
  const subcategory    = resolved?.subcategory ?? null;

  const [stage, setStage]                     = useState<Stage>("loading");
  const [messages, setMessages]               = useState<Message[]>([]);
  const [input, setInput]                     = useState("");
  const [complaintId, setComplaintId]         = useState<string | null>(null);
  const [thinking, setThinking]               = useState(false);
  const [thinkingSteps, setThinkingSteps]     = useState<string[] | undefined>();
  const [pdfViewer, setPdfViewer]             = useState<{
    visible: boolean; filename: string; base64?: string;
  }>({ visible: false, filename: "" });
  const listRef = useRef<FlatList>(null);

  const pushMsg = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // ── Apply agent response to UI ────────────────────────────────────────────

  const applyResponse = useCallback((res: AgentResponse) => {
    // Store thinking steps so ThinkingStrip can display them after API completes
    if (res.thinking_steps?.length) setThinkingSteps([...res.thinking_steps]);

    if (res.reply) pushMsg({ id: uid(), type: "agent", text: res.reply });

    switch (res.action) {
      case "show_pdf": {
        const filename  = res.action_data?.filename ?? "complaint.pdf";
        const pdf_base64 = res.action_data?.pdf_base64;
        const label     = res.action_data?.label;
        pushMsg({ id: uid(), type: "pdf_card", filename, pdfBase64: pdf_base64, label });
        setStage("confirming");
        break;
      }
      case "show_buttons": {
        const buttons = res.action_data?.buttons ?? ["Yes", "No"];
        pushMsg({ id: uid(), type: "action_buttons", buttons });
        setStage("confirming");
        break;
      }
      case "status_update": {
        const ref = res.action_data?.portal_ref_id ?? "";
        pushMsg({ id: uid(), type: "status_update", status: "filed", label: `Ref: ${ref}` });
        setStage("submitted");
        break;
      }
      default:
        if (stage !== "submitted") setStage("chatting");
    }
  }, [pushMsg, stage]);

  // ── Init: create complaint + get greeting ────────────────────────────────

  useEffect(() => {
    if (!parentCategory || !subcategory) return;
    let cancelled = false;

    (async () => {
      setThinking(true);
      try {
        // Create complaint (returns full doc with _id field)
        const doc = await api.authedPost<{ _id: string }>(
          "/complaints/create",
          { category: parentCategory.label, subcategory: subcategory.id, form_data: {} }
        );
        if (cancelled) return;

        const cid = doc._id;
        setComplaintId(cid);

        // Get greeting from agent (empty message = agent starts)
        const greet = await sendAgentMessage(cid, "");
        if (cancelled) return;
        applyResponse(greet);
        setStage("chatting");
      } catch (e: any) {
        if (cancelled) return;
        let msg = "Could not start. Please go back and try again.";
        try { msg = JSON.parse(e.message).error ?? msg; } catch {}
        pushMsg({ id: uid(), type: "agent", text: msg });
        setStage("chatting");
      } finally {
        if (!cancelled) setThinking(false);
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send user message ─────────────────────────────────────────────────────

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || !complaintId || stage === "loading" || stage === "submitted") return;

    pushMsg({ id: uid(), type: "user", text });
    setInput("");
    setThinkingSteps(undefined); // clear previous steps
    setThinking(true);

    try {
      const res = await sendAgentMessage(complaintId, text);
      applyResponse(res);
    } catch (e: any) {
      let msg = "Could not reach the server. Check your connection.";
      try { msg = JSON.parse(e.message).error ?? msg; } catch {}
      pushMsg({ id: uid(), type: "agent", text: msg });
    } finally {
      setThinking(false);
    }
  };

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (!resolved) {
    return (
      <SafeAreaView style={[s.center, { backgroundColor: theme.background }]}>
        <Text style={[s.bodyText, { color: theme.text }]}>Unknown issue type.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.primary, fontSize: 15 }}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[s.backArrow, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {subcategory?.label ?? parentCategory?.label}
          </Text>
          <Text style={[s.headerSub, { color: theme.subtext }]} numberOfLines={1}>
            {parentCategory?.icon}  {parentCategory?.label}
          </Text>
        </View>
        {/* AI badge */}
        <View style={[s.aiBadge, { backgroundColor: theme.primary + "22" }]}>
          <Text style={[s.aiBadgeText, { color: theme.primary }]}>AI</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={s.messageList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <MessageRow
              msg={item}
              theme={theme}
              onViewPdf={(filename, base64) => setPdfViewer({ visible: true, filename, base64 })}
              onActionBtn={(btn) => handleSend(btn)}
            />
          )}
        />

        {/* Thinking strip + input */}
        <View>
          <ThinkingStrip
            visible={thinking}
            steps={thinkingSteps}
            onDone={() => setThinkingSteps(undefined)}
          />

          {stage !== "submitted" && (
            <View
              style={[
                s.inputBar,
                {
                  backgroundColor: theme.surface,
                  borderTopColor: theme.border,
                  paddingBottom: Math.max(insets.bottom, 12),
                },
              ]}
            >
              {stage === "confirming" ? (
                <Text style={[s.confirmHint, { color: theme.subtext }]}>
                  Use the buttons above to respond
                </Text>
              ) : (
                <View style={s.inputRow}>
                  <TextInput
                    style={[
                      s.textInput,
                      { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                    ]}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type your message..."
                    placeholderTextColor={theme.subtext}
                    onSubmitEditing={() => handleSend()}
                    returnKeyType="send"
                    editable={!thinking && stage === "chatting"}
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      s.sendBtn,
                      { backgroundColor: theme.primary, opacity: thinking || !input.trim() ? 0.45 : 1 },
                    ]}
                    onPress={() => handleSend()}
                    disabled={thinking || !input.trim()}
                  >
                    <Text style={s.sendIcon}>↑</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* PDF Viewer */}
      {pdfViewer.visible && (
        <PdfViewer
          visible
          filename={pdfViewer.filename}
          pdfBase64={pdfViewer.base64}
          onClose={() => setPdfViewer({ visible: false, filename: "" })}
          onApproveSubmit={() => {
            setPdfViewer({ visible: false, filename: "" });
            handleSend("yes, submit it");
          }}
          onRequestChanges={() => {
            setPdfViewer({ visible: false, filename: "" });
            handleSend("I want to make changes");
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ── MessageRow ────────────────────────────────────────────────────────────────

function MessageRow({
  msg, theme, onViewPdf, onActionBtn,
}: {
  msg: Message;
  theme: ReturnType<typeof useTheme>;
  onViewPdf: (filename: string, base64?: string) => void;
  onActionBtn: (btn: string) => void;
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

    default:
      return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let _uid = 0;
function uid() { return `${Date.now()}-${++_uid}`; }

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  bodyText: { fontSize: 15 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn:    { padding: 4 },
  backArrow:  { fontSize: 20 },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: 16, fontWeight: "700" },
  headerSub:    { fontSize: 11, marginTop: 1 },
  aiBadge:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  aiBadgeText:  { fontSize: 11, fontWeight: "800", letterSpacing: 1 },

  // Messages
  messageList: { padding: 16, gap: 12, paddingBottom: 8 },

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

  // PDF card (inline in chat)
  pdfCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    maxWidth: "84%",
  },
  pdfCardTop:  { flexDirection: "row", alignItems: "center", gap: 10 },
  pdfIcon:     { fontSize: 28 },
  pdfName:     { fontSize: 13, fontWeight: "700" },
  pdfSub:      { fontSize: 11, marginTop: 1 },
  pdfBtnRow:   { flexDirection: "row", gap: 8 },
  pdfBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  pdfBtnText: { fontSize: 13, fontWeight: "700" },

  // Input bar
  inputBar:    { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10 },
  confirmHint: { textAlign: "center", fontSize: 13, paddingVertical: 8 },
  inputRow:    { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  textInput: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: { color: "#fff", fontSize: 20, fontWeight: "700" },
});

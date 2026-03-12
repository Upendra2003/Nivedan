import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
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
import PdfViewer from "../../components/PdfViewer";
import ChatMessageRow, { Message } from "../../components/ChatMessageRow";
import { useComplaintPolling } from "../../hooks/useComplaintPolling";
import { setPdfViewerData } from "../../utils/pdfStore";
import { useNotifications } from "../../context/NotificationContext";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = "loading" | "chatting" | "confirming" | "submitted";

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { category: paramId } = useLocalSearchParams<{ category: string }>();
  const router   = useRouter();
  const theme    = useTheme();
  const insets   = useSafeAreaInsets();
  const { refreshNotifications } = useNotifications();

  const resolved       = paramId ? findSubcategory(paramId) : null;
  const parentCategory = resolved?.category ?? null;
  const subcategory    = resolved?.subcategory ?? null;

  const [stage, setStage]                 = useState<Stage>("loading");
  const [messages, setMessages]           = useState<Message[]>([]);
  const [input, setInput]                 = useState("");
  const [complaintId, setComplaintId]     = useState<string | null>(null);
  const [thinking, setThinking]           = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[] | undefined>();
  const [uploading, setUploading]         = useState(false); // file upload in progress (not AI)
  const [pdfViewer, setPdfViewer]         = useState<{
    visible: boolean; filename: string; base64?: string;
  }>({ visible: false, filename: "" });

  const listRef          = useRef<FlatList>(null);
  const handleSendRef    = useRef<((text?: string) => Promise<void>) | undefined>(undefined);
  const applyResponseRef = useRef<((res: AgentResponse) => void) | undefined>(undefined);
  const lastStatusRef    = useRef<string | null>(null);

  const pushMsg = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const pushStatusCard = useCallback((status: string, label: string) => {
    pushMsg({ id: uid(), type: "status_update", status, label });
  }, [pushMsg]);

  // ── Apply agent response to UI ────────────────────────────────────────────

  const applyResponse = useCallback((res: AgentResponse) => {
    if (res.thinking_steps?.length) setThinkingSteps([...res.thinking_steps]);
    if (res.reply) pushMsg({ id: uid(), type: "agent", text: res.reply });

    switch (res.action) {
      case "show_pdf": {
        const filename   = res.action_data?.filename ?? "complaint.pdf";
        const pdf_base64 = res.action_data?.pdf_base64;
        const label      = res.action_data?.label;
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
      case "request_signature": {
        pushMsg({ id: uid(), type: "signature_request" });
        setStage("confirming");
        break;
      }
      case "request_documents": {
        pushMsg({ id: uid(), type: "document_upload_request" });
        setStage("confirming");
        break;
      }
      case "status_update": {
        const ref = res.action_data?.portal_ref_id ?? "";
        pushMsg({ id: uid(), type: "status_update", status: "filed", label: `Ref: ${ref}` });
        lastStatusRef.current = "filed";
        refreshNotifications();
        setStage("submitted");
        break;
      }
      default:
        if (stage !== "submitted") setStage("chatting");
    }
  }, [pushMsg, stage, refreshNotifications]);

  // ── Init: create complaint + get greeting ────────────────────────────────

  useEffect(() => {
    if (!parentCategory || !subcategory) return;
    let cancelled = false;

    (async () => {
      setThinking(true);
      try {
        const doc = await api.authedPost<{ _id: string }>(
          "/complaints/create",
          { category: parentCategory.label, subcategory: subcategory.id, form_data: {} }
        );
        if (cancelled) return;

        const cid = doc._id;
        setComplaintId(cid);
        lastStatusRef.current = "pending";

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

    Keyboard.dismiss();
    pushMsg({ id: uid(), type: "user", text });
    setInput("");
    setThinkingSteps(undefined);
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

  // ── Signature upload ──────────────────────────────────────────────────────

  // Max base64 size we'll accept (~600 KB decoded = ~800 KB base64)
  const MAX_B64 = 800_000;

  const handleSignatureUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      pushMsg({ id: uid(), type: "agent", text: "Please allow photo access to upload your signature." });
      return;
    }
    // Open picker BEFORE setting thinking — picker is not "loading"
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    const b64 = result.assets[0].base64!;
    if (b64.length > MAX_B64) {
      pushMsg({ id: uid(), type: "agent", text: "Signature image is too large. Please crop or use a smaller photo." });
      return;
    }
    setUploading(true);
    try {
      await api.authedPost(`/complaints/${complaintId}/upload-doc`, {
        type: "signature",
        file_base64: b64,
        filename: "signature.jpg",
        mime_type: result.assets[0].mimeType || "image/jpeg",
      });
      pushMsg({ id: uid(), type: "uploaded_file_card", filename: "signature.jpg", isSignature: true });
      setUploading(false);
      await handleSend("signature uploaded"); // this sets thinking=true for AI response
    } catch {
      pushMsg({ id: uid(), type: "agent", text: "Could not upload signature. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleSignatureSkip = () => handleSend("skip signature");

  // ── Document upload ───────────────────────────────────────────────────────

  const handleDocumentUpload = async (source: "camera" | "gallery" | "file") => {
    let base64Data = "";
    let filename   = "document.jpg";
    let mimeType   = "image/jpeg";

    try {
      if (source === "file") {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["image/*", "application/pdf"],
          copyToCacheDirectory: true,
        });
        if (result.canceled || !result.assets?.[0]) return;
        const asset = result.assets[0];
        filename  = asset.name;
        mimeType  = asset.mimeType || "application/octet-stream";
        base64Data = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        const { status } = source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          pushMsg({ id: uid(), type: "agent", text: "Please allow camera/photo access to add documents." });
          return;
        }
        // Open picker before showing loading — user is browsing, not waiting on us
        const result = source === "camera"
          ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.4 })
          : await ImagePicker.launchImageLibraryAsync({
              base64: true, quality: 0.4,
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
            });
        if (result.canceled || !result.assets[0]?.base64) return;
        const asset = result.assets[0];
        filename   = `document_${Date.now()}.jpg`;
        mimeType   = asset.mimeType || "image/jpeg";
        base64Data = asset.base64!;
      }

      if (base64Data.length > MAX_B64) {
        pushMsg({ id: uid(), type: "agent", text: "That file is too large (max ~600 KB). Please use a compressed or cropped version." });
        return;
      }

      // Show a lightweight uploading state — not the AI thinking overlay
      setUploading(true);
      await api.authedPost(`/complaints/${complaintId}/upload-doc`, {
        type: "supporting",
        file_base64: base64Data,
        filename,
        mime_type: mimeType,
      });
      pushMsg({ id: uid(), type: "uploaded_file_card", filename, isSignature: false });
    } catch {
      pushMsg({ id: uid(), type: "agent", text: "Could not upload document. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentsDone = () => handleSend("done uploading documents");

  // Update refs on every render so callbacks always use the latest closure
  handleSendRef.current    = handleSend;
  applyResponseRef.current = applyResponse;

  // ── Polling (rejection + status fallback) ────────────────────────────────

  useComplaintPolling({
    complaintId,
    stage,
    lastStatusRef,
    applyResponseRef,
    pushStatusCard,
    refreshNotifications,
    setStage,
    setThinking,
    setThinkingSteps,
  });

  // ── Auto-scroll whenever a new message is added ──────────────────────────

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  // ── Scroll to end when keyboard opens ────────────────────────────────────

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 150);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }),  400);
    });
    return () => show.remove();
  }, []);

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
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <ChatMessageRow
              msg={item}
              theme={theme}
              onViewPdf={(filename, base64) => {
                if (Platform.OS === "web") {
                  setPdfViewer({ visible: true, filename, base64 });
                } else {
                  setPdfViewerData({
                    pdfBase64: base64 ?? "",
                    filename,
                    category: subcategory?.label ?? parentCategory?.label ?? "Complaint",
                    onApprove: () => handleSendRef.current?.("yes, submit it"),
                    onRequestChanges: (text: string) => handleSendRef.current?.(text),
                  });
                  router.push("/pdf-viewer");
                }
              }}
              onSignatureUpload={handleSignatureUpload}
              onSignatureSkip={handleSignatureSkip}
              onDocumentUpload={handleDocumentUpload}
              onDocumentsDone={handleDocumentsDone}
              uploading={uploading}
              onActionBtn={(btn) => handleSend(btn)}
            />
          )}
        />

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
              <View style={s.inputRow}>
                <TextInput
                  style={[
                    s.textInput,
                    { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                  ]}
                  value={input}
                  onChangeText={setInput}
                  placeholder={stage === "confirming" ? "Or type your reply here…" : "Type your message..."}
                  placeholderTextColor={theme.subtext}
                  onSubmitEditing={() => handleSend()}
                  returnKeyType="send"
                  editable={!thinking && stage !== "loading"}
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
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

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

// ── Helpers ───────────────────────────────────────────────────────────────────

let _uid = 0;
function uid() { return `${Date.now()}-${++_uid}`; }

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:     { flex: 1 },
  center:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  bodyText: { fontSize: 15 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn:      { padding: 4 },
  backArrow:    { fontSize: 20 },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: 16, fontWeight: "700" },
  headerSub:    { fontSize: 11, marginTop: 1 },
  aiBadge:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  aiBadgeText:  { fontSize: 11, fontWeight: "800", letterSpacing: 1 },

  messageList: { padding: 16, gap: 12, paddingBottom: 8 },

  inputBar:  { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10 },
  inputRow:  { flexDirection: "row", gap: 8, alignItems: "flex-end" },
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

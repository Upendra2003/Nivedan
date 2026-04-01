import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
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
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../services/api";
import { sendAgentMessage, getThinkingSteps, AgentResponse } from "../../services/agent";
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

  const [stage,         setStage]         = useState<Stage>("loading");
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [input,         setInput]         = useState("");
  const [complaintId,   setComplaintId]   = useState<string | null>(null);
  const [thinking,      setThinking]      = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[] | undefined>();
  const [uploading,     setUploading]     = useState(false);
  const [pdfViewer,     setPdfViewer]     = useState<{
    visible: boolean; filename: string; base64?: string;
  }>({ visible: false, filename: "" });

  const [kbOffset, setKbOffset] = useState(0);

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

  const applyResponse = useCallback((res: AgentResponse) => {
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

  useEffect(() => {
    if (!parentCategory || !subcategory) return;
    let cancelled = false;

    (async () => {
      setThinking(true);
      const initStart = Date.now();
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

        // Ensure ThinkingStrip shows for at least 2s so user sees the loading state
        const elapsed = Date.now() - initStart;
        if (elapsed < 2000) {
          await new Promise<void>((r) => setTimeout(r, 2000 - elapsed));
        }
        if (cancelled) return;

        applyResponseRef.current?.(greet);
        setStage("chatting");

        // Defer setThinking(false) by one frame so the greeting renders BEFORE
        // ThinkingStrip hides (avoids React 18 batching them into the same commit)
        requestAnimationFrame(() => { if (!cancelled) setThinking(false); });
      } catch (e: any) {
        if (cancelled) return;
        let msg = "Could not start. Please go back and try again.";
        try { msg = JSON.parse(e.message).error ?? msg; } catch {}
        pushMsg({ id: uid(), type: "agent", text: msg });
        setStage("chatting");
        setThinking(false);
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const MIN_THINKING_MS = 3500;

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || !complaintId || stage === "loading" || stage === "submitted") return;

    Keyboard.dismiss();
    pushMsg({ id: uid(), type: "user", text });
    setInput("");
    setThinkingSteps(undefined);
    setThinking(true);

    const startTime = Date.now();

    try {
      // Run thinking-steps generation and actual agent response in parallel.
      // thinking call is fire-and-forget-safe — failure falls back to empty steps.
      const [thinkingRes, agentRes] = await Promise.all([
        getThinkingSteps(complaintId, text).catch(() => ({ steps: [] })),
        sendAgentMessage(complaintId, text),
      ]);

      // Show model-generated steps in ThinkingStrip as soon as they arrive
      if (thinkingRes.steps.length > 0) {
        setThinkingSteps(thinkingRes.steps);
      }

      // Hold the actual response until the minimum thinking display time has passed
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_THINKING_MS) {
        await new Promise<void>((resolve) => setTimeout(resolve, MIN_THINKING_MS - elapsed));
      }

      // Persist steps as a collapsible card in the chat history, then reveal response
      if (thinkingRes.steps.length > 0) {
        pushMsg({ id: uid(), type: "thinking_summary", steps: thinkingRes.steps });
      }
      applyResponse(agentRes);
    } catch (e: any) {
      let msg = "Could not reach the server. Check your connection.";
      try { msg = JSON.parse(e.message).error ?? msg; } catch {}
      pushMsg({ id: uid(), type: "agent", text: msg });
    } finally {
      setThinking(false);
    }
  };

  const MAX_B64 = 1_200_000;

  const handleSignatureUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      pushMsg({ id: uid(), type: "agent", text: "Please allow photo access to upload your signature." });
      return;
    }
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
      await handleSend("signature uploaded");
    } catch (e) {
      if (__DEV__) console.warn("[signature upload]", e);
      pushMsg({ id: uid(), type: "agent", text: "Could not upload signature. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleSignatureSkip = () => handleSend("skip signature");

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
        filename   = asset.name;
        mimeType   = asset.mimeType || "application/octet-stream";
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

      setUploading(true);
      await api.authedPost(`/complaints/${complaintId}/upload-doc`, {
        type: "supporting",
        file_base64: base64Data,
        filename,
        mime_type: mimeType,
      });
      pushMsg({ id: uid(), type: "uploaded_file_card", filename, isSignature: false });
    } catch (e) {
      if (__DEV__) console.warn("[document upload]", e);
      pushMsg({ id: uid(), type: "agent", text: "Could not upload document. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentsDone = () => handleSend("done uploading documents");

  handleSendRef.current    = handleSend;
  applyResponseRef.current = applyResponse;

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

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      // On Android + edge-to-edge, KAV "padding" mode needs to know how much
      // the keyboard overlaps the safe-area so we can subtract insets.bottom.
      // We store the raw keyboard height and pass it as keyboardVerticalOffset.
      if (Platform.OS === "android") {
        setKbOffset(e.endCoordinates.height);
      }
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 150);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }),  300);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      if (Platform.OS === "android") setKbOffset(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (!resolved) {
    return (
      <SafeAreaView style={[s.center, { backgroundColor: theme.background }]}>
        <Text style={[s.bodyText, { color: theme.text }]}>Unknown issue type.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.secondary, fontSize: 15 }}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    // backgroundColor: theme.surface so the bottom gesture area shows the same
    // white as the input bar (no lavender gap at the bottom of the screen)
    <SafeAreaView style={[s.root, { backgroundColor: theme.surface }]}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {subcategory?.label ?? parentCategory?.label}
          </Text>
          <Text style={s.headerSub} numberOfLines={1}>
            {parentCategory?.icon}  {parentCategory?.label}
          </Text>
        </View>
        <View style={[s.aiBadge, { backgroundColor: theme.secondary }]}>
          <Ionicons name="sparkles" size={12} color="#fff" />
          <Text style={s.aiBadgeText}>AI</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={[
          { flex: 1, backgroundColor: theme.background },
          // On Android, we drive the offset ourselves via keyboard listeners
          // so KAV is effectively a no-op (behavior undefined = transparent wrapper).
          // This avoids the "stuck in elevated position" bug with edge-to-edge + new arch.
          Platform.OS === "android" && kbOffset > 0
            ? { paddingBottom: kbOffset - insets.bottom }
            : undefined,
        ]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={s.messageList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            <ThinkingStrip
              visible={thinking}
              steps={thinkingSteps}
              onDone={() => setThinkingSteps(undefined)}
            />
          }
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
          {stage !== "submitted" && (
            <View
              style={[
                s.inputBar,
                {
                  backgroundColor: theme.surface,
                  borderTopColor: theme.surfaceContainerHigh,
                  paddingBottom: 12,
                },
              ]}
            >
              <View style={s.inputRow}>
                {/* Voice input button */}
                <TouchableOpacity
                  style={[s.micBtn, { backgroundColor: theme.surfaceContainerHigh }]}
                  onPress={() =>
                    Alert.alert(
                      "Voice Input",
                      "Speak your message — voice recognition coming soon.",
                      [{ text: "OK" }]
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons name="mic-outline" size={20} color={theme.subtext} />
                </TouchableOpacity>

                <TextInput
                  style={[
                    s.textInput,
                    {
                      backgroundColor: theme.surfaceContainerLow,
                      color: theme.text,
                      borderColor: theme.outlineVariant,
                    },
                  ]}
                  value={input}
                  onChangeText={setInput}
                  placeholder={stage === "confirming" ? "Or type your reply here…" : "Type your response…"}
                  placeholderTextColor={theme.outline}
                  onSubmitEditing={() => handleSend()}
                  returnKeyType="send"
                  editable={!thinking && stage !== "loading"}
                  multiline
                />

                <TouchableOpacity
                  style={[
                    s.sendBtn,
                    { backgroundColor: theme.primary, opacity: thinking || !input.trim() ? 0.4 : 1 },
                  ]}
                  onPress={() => handleSend()}
                  disabled={thinking || !input.trim()}
                >
                  <Ionicons name="arrow-up" size={20} color="#fff" />
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
function uid() { return `${Date.now()}-${++_uid}-${Math.random().toString(36).slice(2, 7)}`; }

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:     { flex: 1 },
  center:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  bodyText: { fontSize: 15 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn:      { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: 16, fontWeight: "700", color: "#fff" },
  headerSub:    { fontSize: 11, marginTop: 2, color: "rgba(255,255,255,0.65)" },
  aiBadge:      {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  aiBadgeText:  { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },

  messageList: { padding: 16, gap: 12, paddingBottom: 8 },

  inputBar:  { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10 },
  inputRow:  { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  textInput: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
    maxHeight: 100,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

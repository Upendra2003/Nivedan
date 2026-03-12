/**
 * useComplaintPolling
 * Encapsulates the two polling intervals used by the chat screen:
 *   1. Rejection poll — every 8s when stage="submitted", triggers agent resubmission flow
 *   2. Status fallback — every 10s, inserts a status_update card when status changes
 */
import { useEffect } from "react";
import { api } from "../services/api";
import { sendAgentMessage, AgentResponse } from "../services/agent";

type Stage = "loading" | "chatting" | "confirming" | "submitted";

interface UseComplaintPollingParams {
  complaintId: string | null;
  stage: Stage;
  lastStatusRef: React.MutableRefObject<string | null>;
  applyResponseRef: React.MutableRefObject<((res: AgentResponse) => void) | undefined>;
  pushStatusCard: (status: string, label: string) => void;
  refreshNotifications: () => void;
  setStage: (s: Stage) => void;
  setThinking: (v: boolean) => void;
  setThinkingSteps: (steps: string[] | undefined) => void;
}

export function useComplaintPolling({
  complaintId,
  stage,
  lastStatusRef,
  applyResponseRef,
  pushStatusCard,
  refreshNotifications,
  setStage,
  setThinking,
  setThinkingSteps,
}: UseComplaintPollingParams): void {
  // ── Poll for rejection when stage = "submitted" ──────────────────────────
  useEffect(() => {
    if (stage !== "submitted" || !complaintId) return;
    const interval = setInterval(async () => {
      try {
        const c = await api.authedGet<{ status: string; agent_state: string }>(
          `/complaints/${complaintId}`
        );
        if (c.status === "failed" || c.agent_state === "REJECTED") {
          clearInterval(interval);
          setStage("chatting");
          setThinkingSteps(undefined);
          setThinking(true);
          try {
            const res = await sendAgentMessage(complaintId, "");
            applyResponseRef.current?.(res);
          } finally {
            setThinking(false);
          }
        }
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [stage, complaintId, setStage, setThinking, setThinkingSteps, applyResponseRef]);

  // ── Status fallback: every 10s check for status changes ──────────────────
  // Covers cases where push notification doesn't arrive in demo environment.
  useEffect(() => {
    if (!complaintId || stage === "loading") return;
    const interval = setInterval(async () => {
      try {
        const c = await api.authedGet<{ status: string; current_step_label: string }>(
          `/complaints/${complaintId}`
        );
        const prevStatus = lastStatusRef.current;
        if (prevStatus !== null && prevStatus !== c.status) {
          pushStatusCard(c.status, c.current_step_label || c.status);
          refreshNotifications();
        }
        lastStatusRef.current = c.status;
      } catch {}
    }, 10_000);
    return () => clearInterval(interval);
  }, [complaintId, stage, lastStatusRef, pushStatusCard, refreshNotifications]);
}

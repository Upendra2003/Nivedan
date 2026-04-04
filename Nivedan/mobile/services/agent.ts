import { api } from "./api";

export interface AgentResponse {
  reply: string;
  action: null | "show_pdf" | "show_buttons" | "status_update" | "request_signature" | "request_documents";
  action_data?: {
    filename?: string;
    pdf_base64?: string;
    label?: string;
    buttons?: string[];
    status?: string;
    portal_ref_id?: string;
  };
  thinking_steps?: string[];
  history?: Array<{ role: "user" | "assistant"; text: string }>;
}

export interface ThinkingResponse {
  steps: string[];
}

export async function sendAgentMessage(
  complaintId: string,
  message: string
): Promise<AgentResponse> {
  return api.authedPost<AgentResponse>("/agent/message", {
    complaint_id: complaintId,
    message,
  });
}

export async function resumeAgentSession(complaintId: string): Promise<AgentResponse> {
  return api.authedGet<AgentResponse>(`/agent/resume/${complaintId}`);
}

export async function getThinkingSteps(
  complaintId: string,
  message: string
): Promise<ThinkingResponse> {
  return api.authedPost<ThinkingResponse>("/agent/thinking", {
    complaint_id: complaintId,
    message,
  });
}

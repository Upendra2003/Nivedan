import { api } from "./api";

export interface AgentResponse {
  reply: string;
  action: null | "show_pdf" | "show_buttons" | "status_update";
  action_data?: {
    filename?: string;
    pdf_base64?: string;
    label?: string;
    buttons?: string[];
    status?: string;
    portal_ref_id?: string;
  };
  thinking_steps?: string[];
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

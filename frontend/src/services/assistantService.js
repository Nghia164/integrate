// =============================================================================
// File: src/services/assistantService.js
// US31 - Dịch vụ Trợ lý AI hội thoại (Manager)
// =============================================================================

import { mockAssistantReply } from "../mocks/assistantMock.js";

export const IS_MOCK = true;
export const TIMEOUT_MS = 20000;


export const ROUTES = {
  dashboard: "/manager/dashboard",
  schedule: "/manager/schedule",
  openShifts: "/manager/open-shifts",
  leave: "/manager/leave",
  attendance: "/manager/attendance",
  hours: "/manager/work-hours",
  payroll: "/manager/payroll",
  reports: "/manager/reports",
};

export class AssistantError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const blockText = (b) =>
  b.type === "text" ? b.text
  : b.type === "list" ? b.items.join("; ")
  : b.type === "insight" ? `${b.title ?? "Nhận xét"}: ${b.text}`
  : b.type === "stats" || b.type === "bars" ? b.items.map((i) => `${i.label} ${i.display ?? i.value}`).join(", ")
  : "";
export const blocksToText = (blocks = []) => blocks.map(blockText).filter(Boolean).join(" ");

export async function askAssistant(question) {
  // BACKEND: Gọi API POST /api/assistant/chat gửi lịch sử trò chuyện và câu hỏi tới mô hình AI LLM
  return mockAssistantReply(question);
}

export default {
  IS_MOCK,
  ROUTES,
  AssistantError,
  blocksToText,
  askAssistant,
};
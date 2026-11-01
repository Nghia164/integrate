/**
 * File: src/mocks/assistantMock.js
 * Dữ liệu giả lập câu trả lời của Trợ lý AI (Static Mock Data)
 */

export const mockAssistantResponses = {
  default: {
    blocks: [
      {
        type: "text",
        text: "Xin chào! Tôi là Trợ lý AI Smart Scheduling. Tôi có thể giúp bạn giải đáp thắc mắc về lịch làm việc, quy chế đổi ca, định biên nhân sự hoặc tính toán lương.",
      },
      {
        type: "list",
        items: [
          "Hỏi về ca làm việc thiếu người trong tuần",
          "Hỏi về quy chế thời gian nghỉ tối thiểu 12 giờ giữa 2 ca",
          "Kiểm tra danh sách đơn xin nghỉ phép đang chờ duyệt",
        ],
      },
    ],
    suggestions: [
      "Tuần này có ca nào thiếu người không?",
      "Quy chế nghỉ giữa 2 ca quy định như thế nào?",
      "Có bao nhiêu đơn xin nghỉ phép đang chờ duyệt?",
    ],
  },
  understaffed: {
    blocks: [
      {
        type: "text",
        text: "Theo dữ liệu lịch tuần hiện tại, có 2 ca trực cần bổ sung nhân sự:",
      },
      {
        type: "list",
        items: [
          "Thứ 3 (27/10) - Ca chiều (12:00 - 17:00): Thiếu 1 Pha chế",
          "Thứ 6 (30/10) - Ca tối (17:00 - 22:00): Thiếu 1 Thu ngân",
        ],
      },
      {
        type: "insight",
        title: "Khuyến nghị",
        text: "Bạn có thể vào màn hình Ca trực mở (Open Shifts) để đăng ca kèm tiền thưởng khuyến khích nhân viên nhận ca.",
      },
    ],
    suggestions: ["Mở Open Shift cho ca chiều T3", "Xem danh sách nhân viên rảnh chiều T3"],
  },
};

export function getMockAssistantResponse(question = "") {
  const q = String(question || "").toLowerCase();
  if (q.includes("thiếu") || q.includes("ca") || q.includes("lịch")) {
    return mockAssistantResponses.understaffed;
  }
  return mockAssistantResponses.default;
}

export const mockAssistantReply = (question) => getMockAssistantResponse(question);

export default {
  mockAssistantResponses,
  getMockAssistantResponse,
  mockAssistantReply,
};


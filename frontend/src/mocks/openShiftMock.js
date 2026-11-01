/**
 * File: src/mocks/openShiftMock.js
 * Dữ liệu ca trực mở mẫu (Static Mock Data) + Quy tắc kiểm tra form cơ bản
 */

export const ROLES = ["Pha chế", "Thu ngân", "Phục vụ"];
export const MAX_NEEDED = 10;
export const MAX_NOTE = 250;

export const toISO = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const parseISO = (s) => {
  const [y, m, d] = (s || "").split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayISO = () => toISO(new Date());

export const addDaysISO = (iso, days) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
};

export const weekdayOf = (iso) => {
  const names = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return names[parseISO(iso).getDay()];
};

export const fmtDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const dayLabel = (iso) => `${weekdayOf(iso)}, ${fmtDate(iso)}`;

export const startOf = (s) => {
  if (!s || !s.date || !s.startTime) return new Date();
  const [h, m] = s.startTime.split(":").map(Number);
  const d = parseISO(s.date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

export const statusOf = (s, now = new Date()) => {
  if (!s) return "open";
  if (s.cancelled) return "cancelled";
  const count = s.claims?.length || 0;
  if (count >= s.needed) return "filled";
  if (s.date && s.startTime) {
    const shiftStart = startOf(s);
    if (!isNaN(shiftStart.getTime()) && shiftStart <= now) return "closed";
  }
  return "open";
};

export const getCancelRule = (s) => {
  if (s.cancelled) return { allowed: false, reason: "Ca này đã bị hủy trước đó." };
  if ((s.claims?.length || 0) > 0)
    return { allowed: false, reason: "Không thể hủy ca khi đã có nhân viên đăng ký nhận." };
  return { allowed: true };
};

export const getEditRule = (s) => {
  if (s.cancelled) return { allowed: false, reason: "Không thể sửa ca đã bị hủy." };
  const count = s.claims?.length || 0;
  if (count > 0) {
    return {
      allowed: true,
      locked: true,
      reason: "Đã có người nhận ca: chỉ được sửa số lượng cần tuyển và ghi chú.",
      minNeeded: count,
    };
  }
  return { allowed: true, locked: false };
};

export const validateOpenShift = (p) => {
  if (!p.date) return "Vui lòng chọn ngày làm việc.";
  if (!p.startTime || !p.endTime) return "Vui lòng nhập giờ bắt đầu và kết thúc.";
  if (p.startTime >= p.endTime) return "Giờ bắt đầu phải trước giờ kết thúc.";
  if (!p.needed || Number(p.needed) < 1 || Number(p.needed) > MAX_NEEDED)
    return `Số lượng cần tuyển từ 1 đến ${MAX_NEEDED}.`;
  if (p.bonus && (Number(p.bonus) < 0 || Number(p.bonus) % 1000 !== 0))
    return "Tiền thưởng phải là bội số của 1.000đ.";
  return null;
};

export const validateClaim = (shift, employee) => {
  if (!shift) return "Không tìm thấy ca trực mở.";
  if (shift.cancelled) return "Ca này đã bị hủy.";
  if ((shift.claims?.length || 0) >= shift.needed) return "Ca này đã đủ người đăng ký.";
  const empId = employee?.employeeId || employee?.id;
  if (shift.claims?.some((c) => c.employeeId === empId)) return "Bạn đã nhận ca này rồi.";
  if (shift.role && employee) {
    const empRoles =
      employee.roles || employee.roleTags || [employee.roleTag || employee.role].filter(Boolean);
    if (empRoles.length > 0 && !empRoles.includes(shift.role)) {
      return "Vai trò của bạn không phù hợp với ca trực này.";
    }
  }
  return null;
};

export const isEligible = (shift, employee) => !validateClaim(shift, employee);
export const isClaimedBy = (shift, empId) => Boolean(shift.claims?.some((c) => c.employeeId === empId));

let mockOpenShifts = [
  {
    id: "OS001",
    date: "2026-10-31",
    shiftCode: "morning",
    shiftId: "morning",
    shiftName: "Ca sáng",
    startTime: "06:00",
    endTime: "12:00",
    time: "06:00 - 12:00",
    role: "Pha chế",
    roleTag: "Pha chế",
    needed: 1,
    neededCount: 1,
    claimedCount: 0,
    bonus: 50000,
    bonusAmount: 50000,
    note: "Cần hỗ trợ ca sáng cuối tuần đông khách",
    status: "open",
    cancelled: false,
    version: 1,
    claims: [],
  },
  {
    id: "OS002",
    date: "2026-11-01",
    shiftCode: "afternoon",
    shiftId: "afternoon",
    shiftName: "Ca chiều",
    startTime: "12:00",
    endTime: "17:00",
    time: "12:00 - 17:00",
    role: "Thu ngân",
    roleTag: "Thu ngân",
    needed: 1,
    neededCount: 1,
    claimedCount: 0,
    bonus: 30000,
    bonusAmount: 30000,
    note: "Bổ sung vị trí thu ngân",
    status: "open",
    cancelled: false,
    version: 1,
    claims: [],
  },
  {
    id: "OS003",
    date: "2026-11-02",
    shiftCode: "evening",
    shiftId: "evening",
    shiftName: "Ca tối",
    startTime: "17:00",
    endTime: "22:00",
    time: "17:00 - 22:00",
    role: "Phục vụ",
    roleTag: "Phục vụ",
    needed: 1,
    neededCount: 1,
    claimedCount: 0,
    bonus: 40000,
    bonusAmount: 40000,
    note: "Cần nhân sự hỗ trợ đóng cửa",
    status: "open",
    cancelled: false,
    version: 1,
    claims: [],
  },
];

export function getOpenShifts() {
  return JSON.parse(JSON.stringify(mockOpenShifts));
}

export function getSavedOpenShifts() {
  return getOpenShifts();
}

export function saveOpenShifts(list) {
  mockOpenShifts = list;
  return { success: true };
}

export default {
  ROLES,
  MAX_NEEDED,
  MAX_NOTE,
  dayLabel,
  startOf,
  statusOf,
  weekdayOf,
  fmtDate,
  getCancelRule,
  getEditRule,
  validateOpenShift,
  validateClaim,
  isEligible,
  isClaimedBy,
  toISO,
  parseISO,
  todayISO,
  addDaysISO,
  mockOpenShifts,
  getOpenShifts,
  getSavedOpenShifts,
  saveOpenShifts,
};

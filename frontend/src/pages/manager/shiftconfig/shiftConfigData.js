// Dữ liệu mẫu, nhãn hiển thị và quy tắc kiểm tra cho trang "Ca & ràng buộc".
//
// Vì sao không sợ tiếng Việt: thuật toán xếp lịch (sau này thay bằng Python OR-Tools - US10) chỉ nhận MÃ và SỐ, không đọc chữ hiển thị.
//   - mỗi ca có `code` cố định (morning, afternoon...) và giờ dạng "HH:MM"
//   - trạng thái lưu bằng key ("active" | "paused"), chữ tiếng Việt chỉ nằm trong SHIFT_STATUS để hiển thị
//   - mỗi ràng buộc có `id` cố định (rest_between_shifts...) và giá trị là số
// Nên đặt tên ca bằng tiếng Việt thoải mái; đừng đổi `code` và `id`.

export const SHIFT_STATUS = {
  active: { label: "Hoạt động", hex: "#10b981" },
  paused: { label: "Tạm dừng", hex: "#94a3b8" },
};

export const CATEGORY = { hard: "Bắt buộc (cứng)", soft: "Ưu tiên (mềm)" };

export const initialShifts = [
  { id: 1, code: "morning", name: "Sáng", startTime: "06:00", endTime: "12:00", multiplier: 1.0, status: "active" },
  { id: 2, code: "afternoon", name: "Chiều", startTime: "12:00", endTime: "17:00", multiplier: 1.0, status: "active" },
  { id: 3, code: "evening", name: "Tối", startTime: "17:00", endTime: "22:00", multiplier: 1.2, status: "active" },
];

export const initialGeneralSettings = {
  availabilityDeadlineDay: "friday", // "thursday" | "friday" | "saturday" | "sunday"
  availabilityDeadlineTime: "23:59",
  gracePeriodMin: 5, // Ân hạn chấm công (phút)
  holidayMultiplier: 1.5, // Hệ số lương ngày lễ mặc định
  holidays: [
    { id: "h1", date: "2026-01-01", name: "Tết Dương Lịch", multiplier: 1.5 },
    { id: "h2", date: "2026-04-30", name: "Ngày Giải phóng miền Nam", multiplier: 1.5 },
    { id: "h3", date: "2026-05-01", name: "Ngày Quốc tế Lao động", multiplier: 1.5 },
    { id: "h4", date: "2026-09-02", name: "Quốc khánh", multiplier: 1.5 },
  ],
};

// Ràng buộc có `value` là loại chỉnh được số (trong khoảng min–max); còn lại chỉ bật/tắt.
// Các mức trần (48 giờ/tuần, 6 ngày liên tiếp, 12h nghỉ...) bám theo Bộ luật Lao động 2019 (Điều 105, 109, 111).
export const initialConstraints = [
  { id: "rest_between_shifts", category: "hard", enabled: true, value: 12, min: 12, max: 24, unit: "giờ",
    name: "Thời gian nghỉ tối thiểu giữa 2 ngày làm",
    desc: "Từ lúc hết ca hôm trước đến lúc bắt đầu ca hôm sau phải cách nhau ít nhất số giờ này (theo Điều 109 BLLĐ 2019, tối thiểu 12 giờ). Hai ca liền nhau trong cùng một ngày không bị tính." },
  { id: "no_clopening", category: "hard", enabled: true,
    name: "Không xếp ca tối rồi ca sáng hôm sau",
    desc: "Nhân viên đóng cửa ca tối muộn thì hôm sau không làm ca sáng sớm. Đảm bảo nhân viên có đủ thời gian hồi phục thể lực." },
  { id: "max_shifts_per_day", category: "hard", enabled: true, value: 1, min: 1, max: 2, unit: "ca/ngày",
    name: "Số ca tối đa trong một ngày",
    desc: "Mỗi nhân viên chỉ được phân công tối đa số ca này trong một ngày." },
  { id: "max_hours_per_day", category: "hard", enabled: true, value: 8, min: 4, max: 10, unit: "giờ/ngày",
    name: "Số giờ làm tối đa mỗi ngày",
    desc: "Tổng giờ làm trong một ngày không vượt quá mức này (thông thường là 8 giờ)." },
  { id: "max_hours_per_week", category: "hard", enabled: true, value: 40, min: 20, max: 48, unit: "giờ/tuần",
    name: "Số giờ làm tối đa mỗi tuần",
    desc: "Luật lao động quy định giờ làm bình thường không quá 48 giờ/tuần." },
  { id: "max_consecutive_days", category: "hard", enabled: true, value: 6, min: 3, max: 6, unit: "ngày",
    name: "Số ngày làm liên tiếp tối đa",
    desc: "Mỗi tuần nhân viên phải được nghỉ ít nhất 24 giờ liên tục, nên tối đa 6 ngày làm liên tiếp." },
  { id: "respect_approved_leave", category: "hard", enabled: true,
    name: "Không xếp ca vào ngày nghỉ đã duyệt",
    desc: "Nhân viên có đơn xin nghỉ đã được duyệt sẽ không bị xếp ca trong những ngày đó." },
  { id: "skill_match", category: "hard", enabled: true,
    name: "Đúng vai trò chuyên môn (Role_Tag)",
    desc: "Vị trí cần người theo Role_Tag (Phục vụ, Pha chế, Thu ngân) chỉ được xếp cho nhân viên có đúng vai trò đó." },
  { id: "fair_hours_distribution", category: "soft", enabled: true,
    name: "Phân bổ giờ làm công bằng",
    desc: "Cố gắng chia đều tổng số giờ làm việc giữa các nhân viên trong tuần để đảm bảo thu nhập và khối lượng công việc công bằng." },
  { id: "fair_weekend_distribution", category: "soft", enabled: true,
    name: "Chia đều ca cuối tuần",
    desc: "Chia đều các ca Thứ 7 và Chủ nhật giữa các nhân viên trong nhóm." },
  { id: "preference_matching", category: "soft", enabled: true,
    name: "Ưu tiên nguyện vọng của nhân viên",
    desc: "Cố gắng xếp đúng ca mong muốn và thời gian rảnh mà nhân viên đã đăng ký." },
];

export const toMin = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Tính thời lượng ca (phút), hỗ trợ ca qua đêm (ví dụ 22:00 -> 06:00 = 8h = 480 phút)
export const getShiftDurationMin = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const s = toMin(startTime);
  const e = toMin(endTime);
  if (s === e) return 0;
  return (e - s + 1440) % 1440;
};

export const isOvernightShift = (startTime, endTime) => {
  if (!startTime || !endTime) return false;
  return toMin(endTime) < toMin(startTime);
};

// 360 -> "6h", 330 -> "5h30"
export const fmtDuration = (min) => `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}`;

// Kiểm tra hai khoảng giờ có trùng nhau không (kể cả ca qua đêm)
export function shiftsOverlap(startAStr, endAStr, startBStr, endBStr) {
  if (!startAStr || !endAStr || !startBStr || !endBStr) return false;
  let sA = toMin(startAStr);
  let eA = toMin(endAStr);
  let sB = toMin(startBStr);
  let eB = toMin(endBStr);
  if (eA <= sA) eA += 1440;
  if (eB <= sB) eB += 1440;

  const intervalsA = [[sA, eA], [sA + 1440, eA + 1440]];
  const intervalsB = [[sB, eB], [sB + 1440, eB + 1440]];
  for (const [a1, a2] of intervalsA) {
    for (const [b1, b2] of intervalsB) {
      if (Math.max(a1, b1) < Math.min(a2, b2)) return true;
    }
  }
  return false;
}

// Sinh mã ca duy nhất không bao giờ bị tái sử dụng
export const generateShiftCode = () => `shift_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

// Kiểm tra một ca mẫu trước khi lưu. Trả về câu báo lỗi tiếng Việt, hoặc "" nếu hợp lệ.
// `form.id` có nghĩa là đang sửa (bỏ qua chính nó khi so sánh).
export function validateShift(form, shifts) {
  const name = form.name.trim();
  const others = shifts.filter((s) => s.id !== form.id);
  if (!name) return "Vui lòng nhập tên ca.";
  if (others.some((s) => s.name.toLowerCase() === name.toLowerCase())) return `Đã có ca tên “${name}”.`;
  if (!form.startTime || !form.endTime) return "Vui lòng chọn giờ bắt đầu và giờ kết thúc.";
  if (form.startTime === form.endTime) return "Giờ kết thúc không được trùng với giờ bắt đầu.";
  
  if (form.multiplier !== undefined && form.multiplier !== "") {
    const mult = Number(form.multiplier);
    if (isNaN(mult) || mult < 1.0 || mult > 3.0) {
      return "Hệ số lương ca phải từ 1.0 đến 3.0.";
    }
  }

  if (form.status === "paused" && !others.some((s) => s.status === "active"))
    return "Phải còn ít nhất một ca đang hoạt động để tạo lịch.";
  return "";
}

// ---- Chuyển đổi dữ liệu với API (/shift-config) ----
export const toPayload = (shifts, constraints, generalSettings) => ({
  shifts: shifts.map(({ code, name, startTime, endTime, multiplier, status }) => ({
    code,
    name,
    startTime,
    endTime,
    multiplier: multiplier !== undefined ? Number(multiplier) : 1.0,
    status,
  })),
  constraints: constraints.map(({ id, enabled, value }) => ({ id, enabled, ...(value !== undefined && { value }) })),
  generalSettings: generalSettings || initialGeneralSettings,
});

// Ghép dữ liệu server với bản mô tả/khoảng giá trị trong giao diện. Thiếu dữ liệu thì dùng mặc định.
export function fromPayload(data) {
  const shifts = Array.isArray(data?.shifts) && data.shifts.length
    ? data.shifts.map((s, i) => ({
        id: s.id ?? (i + 1),
        code: s.code || `shift_${s.id ?? (i + 1)}`,
        name: s.name,
        startTime: s.startTime || s.start || "06:00",
        endTime: s.endTime || s.end || "12:00",
        multiplier: s.multiplier !== undefined ? Number(s.multiplier) : 1.0,
        status: s.status || (s.active !== false ? "active" : "inactive"),
      }))
    : initialShifts;

  const saved = new Map((data?.constraints ?? []).map((c) => [c.id, c]));
  const constraints = initialConstraints.map((c) => {
    const s = saved.get(c.id);
    if (!s) return c;
    const okValue = Number.isInteger(s.value) && s.value >= c.min && s.value <= c.max;
    return { ...c, enabled: c.category === "hard" ? true : !!s.enabled, ...(c.value !== undefined && okValue && { value: s.value }) };
  });

  const generalSettings = data?.generalSettings ? { ...initialGeneralSettings, ...data.generalSettings } : initialGeneralSettings;

  return { shifts, constraints, generalSettings };
}

// Cảnh báo chéo giữa ràng buộc và ca đang hoạt động (không chặn lưu). Trả về { [id ràng buộc]: câu cảnh báo }.
export function constraintWarnings(constraints, shifts) {
  const lens = shifts.filter((s) => s.status === "active").map((s) => getShiftDurationMin(s.startTime, s.endTime));
  const longest = Math.max(0, ...lens);
  const out = {};
  for (const c of constraints) {
    if ((c.id === "max_hours_per_day" || c.id === "max_hours_per_week") && c.enabled && c.value * 60 < longest)
      out[c.id] = `Ca dài nhất (${fmtDuration(longest)}) vượt giới hạn này nên sẽ không xếp được.`;
  }
  return out;
}
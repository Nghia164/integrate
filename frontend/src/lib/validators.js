/**
 * FILE NÀY LÀM GÌ: Bộ hàm kiểm tra tính hợp lệ dữ liệu (Validation SSOT) cho Form toàn hệ thống
 * Loại: Thư viện nền tảng (Shared Library)
 * Nguyên tắc:
 * - Tự động trim khoảng trắng đầu/cuối trước khi kiểm tra
 * - Trả về boolean (hàm isValid*) hoặc object { valid, error, value } (hàm validate*)
 */

// 1. KIỂM TRA EMAIL (RFC 5322 cơ bản, có @, domain có dấu chấm, không khoảng trắng)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(raw) {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.includes(" ")) return false;
  return EMAIL_REGEX.test(trimmed);
}

export function validateEmail(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return { valid: false, error: "Vui lòng nhập email.", value: "" };
  }
  const trimmed = String(raw).trim();
  if (!isValidEmail(trimmed)) {
    return { valid: false, error: "Email không hợp lệ (ví dụ: nhanvien@company.com).", value: trimmed };
  }
  return { valid: true, error: "", value: trimmed };
}

// 2. KIỂM TRA SỐ ĐIỆN THOẠI (10 số VN, đầu 03/05/07/08/09, chấp nhận +84/84)
export function normalizePhone(raw) {
  if (typeof raw !== "string" && typeof raw !== "number") return "";
  let clean = String(raw).trim().replace(/[\s().-]/g, "");
  if (clean.startsWith("+84")) {
    clean = "0" + clean.slice(3);
  } else if (clean.startsWith("84") && clean.length === 11) {
    clean = "0" + clean.slice(2);
  }
  return clean;
}

export function isValidPhone(raw) {
  if (raw === null || raw === undefined) return false;
  const clean = normalizePhone(raw);
  return /^0(3|5|7|8|9)\d{8}$/.test(clean);
}

export function validatePhone(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return { valid: false, error: "Vui lòng nhập số điện thoại.", value: "" };
  }
  const clean = normalizePhone(raw);
  if (!isValidPhone(raw)) {
    return {
      valid: false,
      error: "Số điện thoại không hợp lệ (10 số Việt Nam, ví dụ: 0912345678).",
      value: clean,
    };
  }
  return { valid: true, error: "", value: clean };
}

// 3. KIỂM TRA TÊN NHÂN VIÊN (2-50 ký tự, tiếng Việt có dấu, khoảng trắng, ', -, không số hay ký tự lạ)
const VN_NAME_REGEX = /^[a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s'-]{2,50}$/u;

export function isValidName(raw) {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return false;
  return VN_NAME_REGEX.test(trimmed);
}

export function validateName(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return { valid: false, error: "Vui lòng nhập họ và tên.", value: "" };
  }
  const trimmed = String(raw).trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    return { valid: false, error: "Họ và tên phải từ 2 đến 50 ký tự.", value: trimmed };
  }
  if (!isValidName(trimmed)) {
    return { valid: false, error: "Họ và tên chỉ được chứa chữ cái, khoảng trắng, dấu ' hoặc -.", value: trimmed };
  }
  return { valid: true, error: "", value: trimmed };
}

// 4. KIỂM TRA ĐỊA CHỈ (Tối đa 200 ký tự)
export function isValidAddress(raw, { required = false, maxLength = 200 } = {}) {
  if (raw === null || raw === undefined) return !required;
  const trimmed = String(raw).trim();
  if (required && !trimmed) return false;
  return trimmed.length <= maxLength;
}

export function validateAddress(raw, { required = false, maxLength = 200 } = {}) {
  const trimmed = (raw === null || raw === undefined) ? "" : String(raw).trim();
  if (required && !trimmed) {
    return { valid: false, error: "Vui lòng nhập địa chỉ.", value: "" };
  }
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Địa chỉ không được vượt quá ${maxLength} ký tự.`, value: trimmed };
  }
  return { valid: true, error: "", value: trimmed };
}

// 5. KIỂM TRA LƯƠNG THEO GIỜ (Số nguyên VND > 0)
export function isValidHourlyWage(raw) {
  if (raw === null || raw === undefined || raw === "") return false;
  const num = Number(raw);
  if (!Number.isFinite(num) || !Number.isInteger(num)) return false;
  return num > 0;
}

export function validateHourlyWage(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return { valid: false, error: "Vui lòng nhập mức lương theo giờ.", value: 0 };
  }
  const trimmed = String(raw).trim().replace(/[,.]/g, "");
  const num = Number(trimmed);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num <= 0) {
    return { valid: false, error: "Mức lương theo giờ phải là số nguyên dương (> 0 VNĐ).", value: num };
  }
  return { valid: true, error: "", value: num };
}

// 6. KIỂM TRA TIỀN THƯỞNG CA MỞ (Số nguyên VND >= 0)
export function isValidBonus(raw) {
  if (raw === null || raw === undefined || raw === "") return false;
  const num = Number(raw);
  if (!Number.isFinite(num) || !Number.isInteger(num)) return false;
  return num >= 0;
}

export function validateBonus(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return { valid: true, error: "", value: 0 };
  }
  const trimmed = String(raw).trim().replace(/[,.]/g, "");
  const num = Number(trimmed);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0) {
    return { valid: false, error: "Tiền thưởng phải là số nguyên không âm (≥ 0 VNĐ).", value: num };
  }
  return { valid: true, error: "", value: num };
}

// 7. KIỂM TRA MẬT KHẨU (Tối thiểu 8 ký tự, có ít nhất 1 chữ cái và 1 chữ số)
export function isValidPassword(raw) {
  if (typeof raw !== "string") return false;
  if (raw.length < 8) return false;
  return /[A-Za-z]/.test(raw) && /\d/.test(raw);
}

export function validatePassword(raw) {
  if (raw === null || raw === undefined || String(raw) === "") {
    return { valid: false, error: "Vui lòng nhập mật khẩu.", value: "" };
  }
  const str = String(raw);
  if (str.length < 8) {
    return { valid: false, error: "Mật khẩu phải có tối thiểu 8 ký tự.", value: str };
  }
  if (!/[A-Za-z]/.test(str) || !/\d/.test(str)) {
    return { valid: false, error: "Mật khẩu phải bao gồm cả chữ cái và chữ số.", value: str };
  }
  return { valid: true, error: "", value: str };
}

// 8. KIỂM TRA LÝ DO ĐỔI CA / GHI CHÚ (Tối đa 200 ký tự)
export function isValidNote(raw, { required = false, maxLength = 200 } = {}) {
  if (raw === null || raw === undefined) return !required;
  const trimmed = String(raw).trim();
  if (required && !trimmed) return false;
  return trimmed.length <= maxLength;
}

export function validateNote(raw, { required = false, maxLength = 200, label = "Ghi chú" } = {}) {
  const trimmed = (raw === null || raw === undefined) ? "" : String(raw).trim();
  if (required && !trimmed) {
    return { valid: false, error: `Vui lòng nhập ${label.toLowerCase()}.`, value: "" };
  }
  if (trimmed.length > maxLength) {
    return { valid: false, error: `${label} không được vượt quá ${maxLength} ký tự.`, value: trimmed };
  }
  return { valid: true, error: "", value: trimmed };
}

// 9. KIỂM TRA LÝ DO NGHỈ PHÉP (Tối đa 200 ký tự)
export function isValidLeaveReason(raw, { required = true, maxLength = 200 } = {}) {
  return isValidNote(raw, { required, maxLength });
}

export function validateLeaveReason(raw, { required = true, maxLength = 200 } = {}) {
  return validateNote(raw, { required, maxLength, label: "Lý do nghỉ phép" });
}

// 10. KIỂM TRA NGÀY (Không nằm trong quá khứ nếu canBePast = false)
export function isValidDate(raw, { canBePast = false } = {}) {
  if (!raw) return false;
  let d;
  if (raw instanceof Date) {
    d = raw;
  } else if (typeof raw === "string" || typeof raw === "number") {
    d = new Date(raw);
  } else {
    return false;
  }
  if (Number.isNaN(d.getTime())) return false;

  if (!canBePast) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(d);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate < today) return false;
  }
  return true;
}

export function validateDate(raw, { canBePast = false, label = "Ngày" } = {}) {
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return { valid: false, error: `Vui lòng chọn ${label.toLowerCase()}.`, value: null };
  }
  if (!isValidDate(raw, { canBePast: true })) {
    return { valid: false, error: `${label} không hợp lệ.`, value: null };
  }
  if (!canBePast && !isValidDate(raw, { canBePast: false })) {
    return { valid: false, error: `${label} không được nằm trong quá khứ.`, value: raw };
  }
  return { valid: true, error: "", value: raw };
}

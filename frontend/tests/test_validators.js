/**
 * File: tests/test_validators.js
 * Test suite kiểm tra các hàm xác thực và tìm kiếm dùng chung (Part 2)
 * Sử dụng node:test và assert
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  isValidEmail,
  validateEmail,
  normalizePhone,
  isValidPhone,
  validatePhone,
  isValidName,
  validateName,
  isValidAddress,
  validateAddress,
  isValidHourlyWage,
  validateHourlyWage,
  isValidBonus,
  validateBonus,
  isValidPassword,
  validatePassword,
  isValidNote,
  validateNote,
  isValidLeaveReason,
  validateLeaveReason,
  isValidDate,
  validateDate,
} from "../src/lib/validators.js";
import {
  normalizeText,
  matchesSearch,
} from "../src/lib/searchUtils.js";

describe("1. Kiểm tra Email (isValidEmail & validateEmail)", () => {
  it("Ca 1: Email hợp lệ chuẩn", () => {
    assert.strictEqual(isValidEmail("admin@smartscheduling.vn"), true);
  });
  it("Ca 2: Email hợp lệ có ký tự đặc biệt được phép (. - +)", () => {
    assert.strictEqual(isValidEmail("user.name+test-123@domain.co.uk"), true);
  });
  it("Ca 3: Email hợp lệ có khoảng trắng đầu/cuối (tự trim)", () => {
    assert.strictEqual(isValidEmail("  staff01@example.com  "), true);
    assert.strictEqual(validateEmail("  staff01@example.com  ").valid, true);
  });
  it("Ca 4: Email thiếu ký tự @ (sai)", () => {
    assert.strictEqual(isValidEmail("userexample.com"), false);
  });
  it("Ca 5: Email thiếu domain sau @ hoặc thiếu dấu chấm (sai)", () => {
    assert.strictEqual(isValidEmail("user@domain"), false);
    assert.strictEqual(isValidEmail("user@.com"), false);
  });
  it("Ca 6: Email chứa khoảng trắng ở giữa (sai)", () => {
    assert.strictEqual(isValidEmail("user name@domain.com"), false);
  });
  it("Ca 7: Email rỗng hoặc chỉ có khoảng trắng (sai)", () => {
    assert.strictEqual(isValidEmail(""), false);
    assert.strictEqual(isValidEmail("   "), false);
  });
  it("Ca 8: Email null, undefined, hoặc không phải string (sai)", () => {
    assert.strictEqual(isValidEmail(null), false);
    assert.strictEqual(isValidEmail(undefined), false);
    assert.strictEqual(isValidEmail(12345), false);
  });
});

describe("2. Kiểm tra Số điện thoại (isValidPhone, normalizePhone, validatePhone)", () => {
  it("Ca 1: Số điện thoại chuẩn 10 số đầu 09", () => {
    assert.strictEqual(isValidPhone("0912345678"), true);
    assert.strictEqual(normalizePhone("0912345678"), "0912345678");
    assert.strictEqual(validatePhone("0912345678").valid, true);
  });
  it("Ca 2: Các đầu số VN hợp lệ khác (03, 05, 07, 08)", () => {
    assert.strictEqual(isValidPhone("0323456789"), true);
    assert.strictEqual(isValidPhone("0523456789"), true);
    assert.strictEqual(isValidPhone("0723456789"), true);
    assert.strictEqual(isValidPhone("0823456789"), true);
  });
  it("Ca 3: Định dạng quốc tế +84 đổi về 0", () => {
    assert.strictEqual(isValidPhone("+84912345678"), true);
    assert.strictEqual(normalizePhone("+84912345678"), "0912345678");
  });
  it("Ca 4: Định dạng 84 đổi về 0", () => {
    assert.strictEqual(isValidPhone("84912345678"), true);
    assert.strictEqual(normalizePhone("84912345678"), "0912345678");
  });
  it("Ca 5: Số có dấu cách hoặc dấu gạch ngang (tự chuẩn hóa)", () => {
    assert.strictEqual(isValidPhone("0912 345 678"), true);
    assert.strictEqual(isValidPhone("0912-345-678"), true);
  });
  it("Ca 6: Đầu số không thuộc di động VN (đầu 01, 02, 04, 06... sai)", () => {
    assert.strictEqual(isValidPhone("0123456789"), false);
    assert.strictEqual(isValidPhone("0223456789"), false);
    assert.strictEqual(isValidPhone("0423456789"), false);
  });
  it("Ca 7: Độ dài không đủ 10 số hoặc vượt quá 10 số (sai)", () => {
    assert.strictEqual(isValidPhone("091234567"), false); // 9 số
    assert.strictEqual(isValidPhone("09123456789"), false); // 11 số
  });
  it("Ca 8: Chứa chữ cái, ký tự lạ, null, undefined hoặc chuỗi rỗng (sai)", () => {
    assert.strictEqual(isValidPhone("0912345abc"), false);
    assert.strictEqual(isValidPhone(""), false);
    assert.strictEqual(isValidPhone(null), false);
    assert.strictEqual(isValidPhone(undefined), false);
  });
});

describe("3. Kiểm tra Tên nhân viên (isValidName & validateName)", () => {
  it("Ca 1: Tên tiếng Việt có dấu chuẩn", () => {
    assert.strictEqual(isValidName("Nguyễn Văn A"), true);
    assert.strictEqual(isValidName("Trần Thị Bích Ngọc"), true);
    assert.strictEqual(validateName("Nguyễn Văn A").valid, true);
  });
  it("Ca 2: Tên có dấu nháy đơn ' hoặc dấu gạch ngang -", () => {
    assert.strictEqual(isValidName("Jean-Paul"), true);
    assert.strictEqual(isValidName("O'Connor"), true);
  });
  it("Ca 3: Tên tiếng Anh chuẩn không dấu", () => {
    assert.strictEqual(isValidName("John Doe"), true);
  });
  it("Ca 4: Tên có khoảng trắng đầu/cuối (tự trim khi kiểm tra)", () => {
    assert.strictEqual(isValidName("  Lê Hoàng Nam  "), true);
  });
  it("Ca 5: Tên chứa chữ số (sai)", () => {
    assert.strictEqual(isValidName("Nguyễn Văn 1"), false);
    assert.strictEqual(isValidName("Staff01"), false);
  });
  it("Ca 6: Tên chứa ký tự đặc biệt cấm (@, #, $, !, ?, ... sai)", () => {
    assert.strictEqual(isValidName("Lê Văn @"), false);
    assert.strictEqual(isValidName("Trần*Lan"), false);
  });
  it("Ca 7: Độ dài dưới 2 ký tự hoặc trên 50 ký tự (sai)", () => {
    assert.strictEqual(isValidName("A"), false); // 1 ký tự
    assert.strictEqual(isValidName("a".repeat(51)), false); // 51 ký tự
    assert.strictEqual(isValidName("ab"), true); // Biên 2 ký tự
    assert.strictEqual(isValidName("a".repeat(50)), true); // Biên 50 ký tự
  });
  it("Ca 8: Chuỗi rỗng, null, undefined, kiểu dữ liệu sai (sai)", () => {
    assert.strictEqual(isValidName(""), false);
    assert.strictEqual(isValidName("   "), false);
    assert.strictEqual(isValidName(null), false);
    assert.strictEqual(isValidName(undefined), false);
    assert.strictEqual(isValidName(12345), false);
  });
});

describe("4. Kiểm tra Địa chỉ (isValidAddress & validateAddress)", () => {
  it("Ca 1: Địa chỉ thông thường hợp lệ", () => {
    assert.strictEqual(isValidAddress("123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM"), true);
  });
  it("Ca 2: Địa chỉ đúng 200 ký tự (biên tối đa)", () => {
    const addr200 = "Số " + "a".repeat(197);
    assert.strictEqual(isValidAddress(addr200), true);
  });
  it("Ca 3: Địa chỉ vượt quá 200 ký tự (sai)", () => {
    const addr201 = "a".repeat(201);
    assert.strictEqual(isValidAddress(addr201), false);
    assert.strictEqual(validateAddress(addr201).valid, false);
  });
  it("Ca 4: Địa chỉ rỗng khi không bắt buộc (hợp lệ)", () => {
    assert.strictEqual(isValidAddress("", { required: false }), true);
    assert.strictEqual(isValidAddress(null, { required: false }), true);
  });
  it("Ca 5: Địa chỉ rỗng khi bắt buộc (sai)", () => {
    assert.strictEqual(isValidAddress("", { required: true }), false);
    assert.strictEqual(isValidAddress("   ", { required: true }), false);
    assert.strictEqual(validateAddress("", { required: true }).valid, false);
  });
  it("Ca 6: Địa chỉ có ký tự đặc biệt tiếng Việt, dấu xuyệt (hợp lệ)", () => {
    assert.strictEqual(isValidAddress("Hẻm 45/12/3A Đường số 8, Khu phố 3"), true);
  });
  it("Ca 7: Địa chỉ có khoảng trắng đầu/cuối được tự trim", () => {
    assert.strictEqual(isValidAddress("   Đà Nẵng   "), true);
  });
  it("Ca 8: Địa chỉ null/undefined khi bắt buộc (sai)", () => {
    assert.strictEqual(isValidAddress(null, { required: true }), false);
    assert.strictEqual(isValidAddress(undefined, { required: true }), false);
  });
});

describe("5. Kiểm tra Lương theo giờ (isValidHourlyWage & validateHourlyWage)", () => {
  it("Ca 1: Lương số nguyên dương hợp lệ (number)", () => {
    assert.strictEqual(isValidHourlyWage(25000), true);
    assert.strictEqual(isValidHourlyWage(50000), true);
  });
  it("Ca 2: Lương chuỗi số nguyên hợp lệ (string)", () => {
    assert.strictEqual(isValidHourlyWage("30000"), true);
    assert.strictEqual(validateHourlyWage("30000").valid, true);
  });
  it("Ca 3: Lương bằng 0 (sai)", () => {
    assert.strictEqual(isValidHourlyWage(0), false);
    assert.strictEqual(isValidHourlyWage("0"), false);
  });
  it("Ca 4: Lương số âm (sai)", () => {
    assert.strictEqual(isValidHourlyWage(-10000), false);
    assert.strictEqual(isValidHourlyWage("-25000"), false);
  });
  it("Ca 5: Lương số thập phân / có phần lẻ (sai)", () => {
    assert.strictEqual(isValidHourlyWage(25000.5), false);
    assert.strictEqual(isValidHourlyWage("25000.5"), false);
  });
  it("Ca 6: Lương chuỗi có dấu phẩy/chấm ngăn cách hàng nghìn (validate tự làm sạch)", () => {
    assert.strictEqual(validateHourlyWage("30,000").valid, true);
    assert.strictEqual(validateHourlyWage("30,000").value, 30000);
  });
  it("Ca 7: Lương chuỗi chữ hoặc ký tự lạ (sai)", () => {
    assert.strictEqual(isValidHourlyWage("abc"), false);
    assert.strictEqual(isValidHourlyWage("30k"), false);
  });
  it("Ca 8: Lương null, undefined hoặc chuỗi rỗng (sai)", () => {
    assert.strictEqual(isValidHourlyWage(null), false);
    assert.strictEqual(isValidHourlyWage(undefined), false);
    assert.strictEqual(isValidHourlyWage(""), false);
  });
});

describe("6. Kiểm tra Tiền thưởng ca mở (isValidBonus & validateBonus)", () => {
  it("Ca 1: Tiền thưởng 0 VND (hợp lệ)", () => {
    assert.strictEqual(isValidBonus(0), true);
    assert.strictEqual(isValidBonus("0"), true);
    assert.strictEqual(validateBonus(0).valid, true);
  });
  it("Ca 2: Tiền thưởng số nguyên dương (hợp lệ)", () => {
    assert.strictEqual(isValidBonus(50000), true);
    assert.strictEqual(isValidBonus("100000"), true);
  });
  it("Ca 3: Tiền thưởng rỗng/không nhập (mặc định = 0 hợp lệ)", () => {
    assert.strictEqual(validateBonus("").valid, true);
    assert.strictEqual(validateBonus("").value, 0);
    assert.strictEqual(validateBonus(null).value, 0);
  });
  it("Ca 4: Tiền thưởng số âm (sai)", () => {
    assert.strictEqual(isValidBonus(-50000), false);
    assert.strictEqual(isValidBonus("-10000"), false);
  });
  it("Ca 5: Tiền thưởng số thập phân có phần lẻ (sai)", () => {
    assert.strictEqual(isValidBonus(50000.5), false);
    assert.strictEqual(isValidBonus("50000.5"), false);
  });
  it("Ca 6: Tiền thưởng có định dạng phân cách hàng nghìn (validate làm sạch)", () => {
    assert.strictEqual(validateBonus("50,000").valid, true);
    assert.strictEqual(validateBonus("50,000").value, 50000);
  });
  it("Ca 7: Tiền thưởng chứa chữ cái (sai)", () => {
    assert.strictEqual(isValidBonus("bonus"), false);
  });
  it("Ca 8: Tiền thưởng null/undefined trực tiếp với isValidBonus (sai)", () => {
    assert.strictEqual(isValidBonus(null), false);
    assert.strictEqual(isValidBonus(undefined), false);
  });
});

describe("7. Kiểm tra Mật khẩu (isValidPassword & validatePassword)", () => {
  it("Ca 1: Mật khẩu chuẩn có cả chữ và số, >= 8 ký tự", () => {
    assert.strictEqual(isValidPassword("Admin123"), true);
    assert.strictEqual(isValidPassword("Matkhau2026"), true);
  });
  it("Ca 2: Mật khẩu đúng 8 ký tự biên", () => {
    assert.strictEqual(isValidPassword("Pass1234"), true);
  });
  it("Ca 3: Mật khẩu có thêm ký tự đặc biệt (!@#$)", () => {
    assert.strictEqual(isValidPassword("Password@123"), true);
  });
  it("Ca 4: Mật khẩu ngắn dưới 8 ký tự (sai)", () => {
    assert.strictEqual(isValidPassword("Pass12"), false); // 6 ký tự
    assert.strictEqual(isValidPassword("Pass123"), false); // 7 ký tự
  });
  it("Ca 5: Mật khẩu chỉ có chữ cái, không có số (sai)", () => {
    assert.strictEqual(isValidPassword("PasswordOnly"), false);
  });
  it("Ca 6: Mật khẩu chỉ có số, không có chữ cái (sai)", () => {
    assert.strictEqual(isValidPassword("12345678"), false);
  });
  it("Ca 7: Mật khẩu rỗng hoặc chỉ có khoảng trắng (sai)", () => {
    assert.strictEqual(isValidPassword(""), false);
    assert.strictEqual(validatePassword("").valid, false);
  });
  it("Ca 8: Mật khẩu null, undefined hoặc kiểu dữ liệu sai (sai)", () => {
    assert.strictEqual(isValidPassword(null), false);
    assert.strictEqual(isValidPassword(undefined), false);
    assert.strictEqual(isValidPassword(12345678), false);
  });
});

describe("8. Kiểm tra Ghi chú & Lý do (isValidNote & isValidLeaveReason)", () => {
  it("Ca 1: Ghi chú thông thường dưới 200 ký tự (hợp lệ)", () => {
    assert.strictEqual(isValidNote("Em có việc gia đình đột xuất."), true);
  });
  it("Ca 2: Ghi chú đúng 200 ký tự biên (hợp lệ)", () => {
    assert.strictEqual(isValidNote("a".repeat(200)), true);
  });
  it("Ca 3: Ghi chú vượt quá 200 ký tự (sai)", () => {
    assert.strictEqual(isValidNote("a".repeat(201)), false);
    assert.strictEqual(validateNote("a".repeat(201)).valid, false);
  });
  it("Ca 4: Ghi chú rỗng khi không bắt buộc (hợp lệ)", () => {
    assert.strictEqual(isValidNote("", { required: false }), true);
    assert.strictEqual(isValidNote(null, { required: false }), true);
  });
  it("Ca 5: Ghi chú rỗng khi bắt buộc (sai)", () => {
    assert.strictEqual(isValidNote("", { required: true }), false);
    assert.strictEqual(validateNote("", { required: true }).valid, false);
  });
  it("Ca 6: Lý do xin nghỉ phép hợp lệ (bắt buộc, <= 200 ký tự)", () => {
    assert.strictEqual(isValidLeaveReason("Nghỉ ốm đi khám bác sĩ"), true);
  });
  it("Ca 7: Lý do xin nghỉ phép để trống (sai)", () => {
    assert.strictEqual(isValidLeaveReason(""), false);
    assert.strictEqual(validateLeaveReason("").valid, false);
  });
  it("Ca 8: Lý do xin nghỉ phép vượt quá 200 ký tự (sai)", () => {
    assert.strictEqual(isValidLeaveReason("x".repeat(201)), false);
  });
});

describe("9. Kiểm tra Ngày (isValidDate & validateDate)", () => {
  it("Ca 1: Ngày tương lai hợp lệ", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    assert.strictEqual(isValidDate(future, { canBePast: false }), true);
  });
  it("Ca 2: Ngày hôm nay (biên hiện tại, hợp lệ khi canBePast=false)", () => {
    const today = new Date();
    assert.strictEqual(isValidDate(today, { canBePast: false }), true);
  });
  it("Ca 3: Ngày quá khứ khi canBePast = false (sai)", () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    assert.strictEqual(isValidDate(past, { canBePast: false }), false);
    assert.strictEqual(validateDate(past, { canBePast: false }).valid, false);
  });
  it("Ca 4: Ngày quá khứ khi canBePast = true (hợp lệ)", () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    assert.strictEqual(isValidDate(past, { canBePast: true }), true);
    assert.strictEqual(validateDate(past, { canBePast: true }).valid, true);
  });
  it("Ca 5: Chuỗi ngày ISO định dạng YYYY-MM-DD", () => {
    assert.strictEqual(isValidDate("2099-12-31", { canBePast: false }), true);
    assert.strictEqual(isValidDate("2000-01-01", { canBePast: true }), true);
    assert.strictEqual(isValidDate("2000-01-01", { canBePast: false }), false);
  });
  it("Ca 6: Chuỗi ngày không hợp lệ (sai)", () => {
    assert.strictEqual(isValidDate("invalid-date-string"), false);
  });
  it("Ca 7: Ngày rỗng hoặc null (sai)", () => {
    assert.strictEqual(isValidDate(""), false);
    assert.strictEqual(isValidDate(null), false);
    assert.strictEqual(isValidDate(undefined), false);
  });
  it("Ca 8: validateDate trả về thông báo lỗi thân thiện", () => {
    const res = validateDate("", { label: "Ngày làm việc" });
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, "Vui lòng chọn ngày làm việc.");
  });
});

describe("10. Kiểm tra normalizeText (Chuẩn hóa tiếng Việt)", () => {
  it("Ca 1: Bỏ dấu tiếng Việt thông thường", () => {
    assert.strictEqual(normalizeText("Nguyễn Văn An"), "nguyen van an");
  });
  it("Ca 2: Xử lý chữ đ và Đ hoa/thường", () => {
    assert.strictEqual(normalizeText("Đà Nẵng & Đắk Lắk"), "da nang & dak lak");
  });
  it("Ca 3: Chuyển hoa thành thường", () => {
    assert.strictEqual(normalizeText("SMART SCHEDULING"), "smart scheduling");
  });
  it("Ca 4: Xóa khoảng trắng thừa ở đầu, cuối và giữa", () => {
    assert.strictEqual(normalizeText("   Pha    chế   ca    sáng  "), "pha che ca sang");
  });
  it("Ca 5: Chuỗi null, undefined hoặc số", () => {
    assert.strictEqual(normalizeText(null), "");
    assert.strictEqual(normalizeText(undefined), "");
    assert.strictEqual(normalizeText(12345), "12345");
  });
  it("Ca 6: Chuỗi rỗng hoặc toàn khoảng trắng", () => {
    assert.strictEqual(normalizeText(""), "");
    assert.strictEqual(normalizeText("     "), "");
  });
  it("Ca 7: Chuỗi chứa ký tự số và ký hiệu đặc biệt", () => {
    assert.strictEqual(normalizeText("NV-001 (Pha chế)"), "nv-001 (pha che)");
  });
  it("Ca 8: Chuỗi đã không dấu giữ nguyên", () => {
    assert.strictEqual(normalizeText("coffee shop"), "coffee shop");
  });
});

describe("11. Kiểm tra matchesSearch (Tìm kiếm đa từ khóa, logic AND)", () => {
  const fields = ["NV001", "Nguyễn Văn An", "Pha chế", "0912345678", "nguyen.an@company.com"];

  it("Ca 1: Khớp mã nhân viên (không phân biệt hoa thường)", () => {
    assert.strictEqual(matchesSearch("nv001", fields), true);
    assert.strictEqual(matchesSearch("NV001", fields), true);
  });
  it("Ca 2: Khớp tên có dấu hoặc không dấu", () => {
    assert.strictEqual(matchesSearch("Nguyễn Văn An", fields), true);
    assert.strictEqual(matchesSearch("nguyen van an", fields), true);
  });
  it("Ca 3: Nhiều từ khóa trải dài trên nhiều trường khác nhau (AND logic)", () => {
    // 'an' trong tên, 'pha che' trong vai trò -> khớp
    assert.strictEqual(matchesSearch("an pha che", fields), true);
    // 'nv001' trong mã, '0912' trong số điện thoại -> khớp
    assert.strictEqual(matchesSearch("nv001 0912", fields), true);
  });
  it("Ca 4: Có 1 từ khóa không khớp bất kỳ trường nào -> trả về false (AND logic)", () => {
    assert.strictEqual(matchesSearch("an thu ngan", fields), false); // có an nhưng không có 'thu ngan'
  });
  it("Ca 5: Chuỗi tìm kiếm rỗng, null hoặc undefined -> trả về true (hiện tất cả)", () => {
    assert.strictEqual(matchesSearch("", fields), true);
    assert.strictEqual(matchesSearch("   ", fields), true);
    assert.strictEqual(matchesSearch(null, fields), true);
    assert.strictEqual(matchesSearch(undefined, fields), true);
  });
  it("Ca 6: An toàn với ký tự đặc biệt regex (+, *, ?, [, ], (, ), ., ^, $, \\)", () => {
    assert.strictEqual(matchesSearch("NV-001 [test]", fields), false);
    assert.strictEqual(matchesSearch("(", fields), false); // Không quăng lỗi RegExp SyntaxError!
    assert.strictEqual(matchesSearch("+84", fields), false);
    assert.strictEqual(matchesSearch("company.com", fields), true); // Khớp email
  });
  it("Ca 7: Danh sách trường rỗng hoặc null", () => {
    assert.strictEqual(matchesSearch("an", []), false);
    assert.strictEqual(matchesSearch("an", null), false);
  });
  it("Ca 8: Trường chứa giá trị null, undefined hoặc số nguyên", () => {
    const fieldsWithNull = [null, undefined, 12345, "Ca sáng"];
    assert.strictEqual(matchesSearch("12345", fieldsWithNull), true);
    assert.strictEqual(matchesSearch("ca sang", fieldsWithNull), true);
    assert.strictEqual(matchesSearch("chieu", fieldsWithNull), false);
  });
});

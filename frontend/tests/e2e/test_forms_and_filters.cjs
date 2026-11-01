/**
 * File: tests/e2e/test_forms_and_filters.cjs
 * Kịch bản kiểm thử E2E: Rà soát Form, Tìm kiếm đa từ khóa không dấu, và Bộ lọc/EmptyState (Part 3)
 */

const puppeteer = require("puppeteer-core");
const assert = require("node:assert");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:5173";

async function setControlledInput(page, selector, val) {
  await page.evaluate((sel, value) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Không tìm thấy phần tử: ${sel}`);
    const proto = el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? window.HTMLSelectElement.prototype
        : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (el._valueTracker) {
      el._valueTracker.setValue(value + "_different");
    }
    if (setter) {
      setter.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, selector, val);
}

async function runTests() {
  console.log(">>> [E2E] Khởi động Chrome headless cho test_forms_and_filters.cjs...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. ĐĂNG NHẬP VỚI TƯ CÁCH QUẢN LÝ (MANAGER)
    console.log("--- BƯỚC 1: Đăng nhập tài khoản Manager ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const user = {
        id: 1,
        employeeId: "QL001",
        name: "Quản lý mẫu",
        email: "manager@coffee.com",
        role: "manager",
      };
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "mock-token");
      sessionStorage.setItem("user", JSON.stringify(user));
    });

    // 2. TEST FORM NHÂN VIÊN (MANAGER EMPLOYEES)
    console.log("--- BƯỚC 2: Kiểm tra Form Thêm Nhân Viên & Validation ---");
    await page.goto(`${BASE_URL}/manager/employees`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));

    // Bấm nút "Thêm nhân viên"
    const addBtn = await page.waitForSelector("button ::-p-text(Thêm nhân viên)", { timeout: 5000 });
    await addBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // Nhập tên sai (chứa số hoặc ký tự lạ)
    await setControlledInput(page, "input[name='name']", "Nguyễn Văn 123");
    // Nhập số điện thoại sai
    await setControlledInput(page, "input[name='phone']", "012345");
    // Blur để kích hoạt onBlur validation
    await page.evaluate(() => document.querySelector("input[name='name']")?.blur());
    await page.evaluate(() => document.querySelector("input[name='phone']")?.blur());
    await new Promise((r) => setTimeout(r, 400));

    // Bấm submit form
    const submitBtn = await page.waitForSelector("button[type='submit'] ::-p-text(Thêm nhân viên)");
    await submitBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    // Xác nhận có thông báo lỗi hiển thị
    const pageContent = await page.content();
    assert.ok(
      pageContent.includes("chỉ được chứa chữ cái") ||
      pageContent.includes("Số điện thoại không hợp lệ") ||
      pageContent.includes("Vui lòng kiểm tra lại các trường"),
      "Phải có thông báo lỗi validation trên form nhân viên khi nhập sai"
    );
    console.log("✔ Validation form nhân viên hoạt động chuẩn xác (báo lỗi chữ đỏ khi sai).");

    // Đóng modal
    const cancelBtn = await page.waitForSelector("button ::-p-text(Hủy)");
    await cancelBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // 3. TEST TÌM KIẾM TIẾNG VIỆT KHÔNG DẤU VÀ NHIỀU TỪ KHÓA TRÊN BẢNG NHÂN VIÊN
    console.log("--- BƯỚC 3: Kiểm tra Tìm kiếm không dấu & đa từ khóa trên Bảng Nhân Viên ---");
    // Tìm kiếm không dấu: "an phuc vu" -> phải tìm ra nhân viên Nguyễn Văn An (vai trò Phục vụ)
    const searchInput = await page.waitForSelector("[data-testid='toolbar'] input");
    await searchInput.type("an phuc vu");
    await new Promise((r) => setTimeout(r, 600));

    const rowsAfterSearch = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("tbody tr")).map((tr) => tr.innerText);
    });
    assert.ok(rowsAfterSearch.length >= 1, "Phải tìm thấy ít nhất 1 nhân viên khi gõ 'an phuc vu'");
    assert.ok(rowsAfterSearch[0].includes("Nguyễn Văn An") || rowsAfterSearch[0].includes("NV001"), "Dòng tìm được phải là Nguyễn Văn An");
    console.log("✔ Tìm kiếm đa từ khóa không dấu 'an phuc vu' trên bảng nhân viên khớp chính xác!");

    // 4. TEST TÌM TỪ KHÓA KHÔNG TỒN TẠI -> EMPTY STATE CHUẨN VÀ NÚT 'XÓA BỘ LỌC'
    console.log("--- BƯỚC 4: Kiểm tra EmptyState chuẩn & Nút 'Xóa bộ lọc' ---");
    const clearSearchIcon = await page.$("[data-testid='toolbar'] button[aria-label='Xóa nội dung tìm kiếm']");
    if (clearSearchIcon) {
      await clearSearchIcon.click();
      await new Promise((r) => setTimeout(r, 200));
    }
    await searchInput.type("tu_khoa_khong_ton_tai_xyz123");
    await new Promise((r) => setTimeout(r, 600));

    const emptyText = await page.evaluate(() => document.body.innerText);
    assert.ok(
      emptyText.includes("Không tìm thấy kết quả phù hợp"),
      "Bảng phải hiển thị tiêu đề EmptyState chuẩn: 'Không tìm thấy kết quả phù hợp'"
    );
    assert.ok(
      emptyText.includes("Thử thay đổi từ khóa hoặc bộ lọc"),
      "Bảng phải hiển thị mô tả EmptyState chuẩn"
    );

    // Xác nhận có nút 'Xóa bộ lọc'
    const clearFilterBtn = await page.waitForSelector("button ::-p-text(Xóa bộ lọc)");
    assert.ok(clearFilterBtn, "Phải xuất hiện nút 'Xóa bộ lọc' trong EmptyState");
    await clearFilterBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // Sau khi xóa bộ lọc, bảng hiển thị lại danh sách đầy đủ
    const rowsRestored = await page.evaluate(() => document.querySelectorAll("tbody tr").length);
    assert.ok(rowsRestored >= 5, "Bảng phải hiển thị lại các nhân viên sau khi bấm Xóa bộ lọc");
    console.log("✔ EmptyState chuẩn và nút 'Xóa bộ lọc' hoạt động hoàn hảo trên trang Quản lý!");

    // 5. TEST STAFF: CA TRỰC MỞ & ĐỔI CA
    console.log("--- BƯỚC 5: Đăng nhập Staff & Kiểm tra Tìm kiếm/EmptyState trang Ca trực mở ---");
    await page.evaluate(() => {
      const user = {
        id: "NV001",
        employeeId: "NV001",
        name: "Nguyễn Văn An",
        email: "nguyenvanan@gmail.com",
        role: "staff",
        roles: ["Phục vụ", "Pha chế"],
      };
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "mock-token-staff");
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("token", "mock-token-staff");
    });

    await page.goto(`${BASE_URL}/employees/open-shifts`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));

    const staffSearchInput = await page.waitForSelector("input[placeholder*='Tìm kiếm theo mã']");
    await staffSearchInput.type("ca_khong_co_that_9999");
    await new Promise((r) => setTimeout(r, 600));

    const staffEmptyText = await page.evaluate(() => document.body.innerText);
    assert.ok(
      staffEmptyText.includes("Không tìm thấy kết quả phù hợp"),
      "Trang Ca trực mở Staff phải hiện EmptyState chuẩn khi tìm kiếm không ra kết quả"
    );

    const staffClearBtn = await page.waitForSelector("button ::-p-text(Xóa bộ lọc)");
    await staffClearBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    console.log("✔ Trang Staff OpenShifts: Tìm kiếm và EmptyState hoạt động xuất sắc!");

    // 6. TEST STAFF PROFILE VALIDATION
    console.log("--- BƯỚC 6: Kiểm tra Validation trang Hồ Sơ Cá Nhân Staff ---");
    await page.goto(`${BASE_URL}/employees/profile`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));

    const editProfileBtn = await page.waitForSelector("button ::-p-text(Chỉnh sửa)");
    await editProfileBtn.click();
    await new Promise((r) => setTimeout(r, 500));

    await setControlledInput(page, "input[type='tel']", "12345"); // SĐT sai định dạng

    const saveProfileBtn = await page.waitForSelector("button ::-p-text(Lưu)");
    await saveProfileBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    const profileText = await page.evaluate(() => document.body.innerText);
    assert.ok(
      profileText.includes("Số điện thoại không hợp lệ"),
      "Trang Profile phải báo lỗi validation khi nhập số điện thoại không hợp lệ"
    );
    console.log("✔ Trang Staff Profile: Báo lỗi inline số điện thoại chuẩn xác!");

    console.log("\n=======================================================");
    console.log("TẤT CẢ CÁC BƯỚC KIỂM THỬ E2E CHO PHẦN 3 ĐÃ VƯỢT QUA 100%!");
    console.log("=======================================================\n");
  } finally {
    await browser.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Lỗi kiểm thử E2E Form & Filter:", err);
  process.exit(1);
});

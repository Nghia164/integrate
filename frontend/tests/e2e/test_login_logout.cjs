/**
 * Test E2E: Đăng nhập / Đăng xuất & Bảo mật Lưu tài khoản (Part 5)
 * Runner: node tests/e2e/test_login_logout.cjs
 */

const assert = require("assert");
const puppeteer = require("puppeteer-core");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:5173";

async function setControlledInput(page, selector, val) {
  await page.evaluate((sel, value) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Không tìm thấy phần tử: ${sel}`);
    const proto = el instanceof HTMLInputElement
      ? window.HTMLInputElement.prototype
      : window.HTMLTextAreaElement.prototype;
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
  console.log(">>> [E2E] Khởi động Chrome headless cho test_login_logout.cjs...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. ĐĂNG NHẬP THƯỜNG (KHÔNG TÍCH LƯU TÀI KHOẢN) VÀ ĐĂNG XUẤT
    console.log("--- BƯỚC 1: Đăng nhập thông thường (không lưu tài khoản) & Đăng xuất ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle0" });

    // Điền thông tin đăng nhập Quản lý
    await page.waitForSelector("input#email");
    await page.type("input#email", "quanly@smartscheduling.vn");
    await page.type("input#password", "12345678");

    // Click Đăng nhập
    const submitBtn = await page.waitForSelector("button[type='submit']");
    await submitBtn.click();
    await page.waitForFunction(() => window.location.pathname.includes("/manager/dashboard"), { timeout: 5000 });

    assert.ok(
      page.url().includes("/manager/dashboard"),
      "Đăng nhập thành công phải chuyển hướng đến /manager/dashboard"
    );
    console.log("✔ Đăng nhập Manager thành công!");

    // Chuyển sang một trang nội bộ (ví dụ: Quản lý nhân viên) để tạo lịch sử duyệt web
    await page.evaluate(() => {
      const link = document.querySelector("aside a[href*='employees']");
      if (link) link.click();
    });
    await page.waitForFunction(() => window.location.pathname.includes("/manager/employees"), { timeout: 5000 });

    // Bấm nút Đăng xuất trong sidebar
    console.log("--- BƯỚC 2: Bấm Đăng xuất -> Kiểm tra Input Email & Mật khẩu trống rỗng ---");
    await page.evaluate(() => {
      const btn = document.querySelector("button[title='Đăng xuất']");
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Xác nhận đã về trang /login
    assert.ok(page.url().includes("/login"), "Sau khi đăng xuất phải về trang /login");

    // Kiểm tra input email và password TRỐNG RỖNG
    const emailVal = await page.$eval("input#email", (el) => el.value);
    const passVal = await page.$eval("input#password", (el) => el.value);

    assert.strictEqual(emailVal, "", "Input email phải trống rỗng sau khi đăng xuất");
    assert.strictEqual(passVal, "", "Input mật khẩu phải trống rỗng sau khi đăng xuất");
    console.log("✔ Sau khi bấm Đăng xuất: Cả input email và password đều trống rỗng!");

    // 2. BẤM BACK TRÌNH DUYỆT -> BỊ ĐẨY VỀ /login (KHÔNG VÀO ĐƯỢC TRANG CŨ)
    console.log("--- BƯỚC 3: Bấm nút 'Back' trên trình duyệt -> Bị chặn và đẩy về /login ---");
    await page.goBack();
    await new Promise((r) => setTimeout(r, 600));

    const currentUrl = page.url();
    assert.ok(
      currentUrl.includes("/login"),
      `Khi bấm Back sau khi đăng xuất, phải bị đẩy về /login (hiện tại: ${currentUrl})`
    );

    // Thử truy cập trực tiếp URL bảo vệ
    await page.goto(`${BASE_URL}/manager/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    assert.ok(
      page.url().includes("/login"),
      "Truy cập trực tiếp URL bảo vệ khi đã đăng xuất phải bị chuyển hướng về /login"
    );
    console.log("✔ Bảo mật Back Button & Route Guard: Người dùng bị chặn hoàn toàn khi đã đăng xuất!");

    // 3. ĐĂNG NHẬP CÓ TÍCH 'LƯU TÀI KHOẢN'
    console.log("--- BƯỚC 4: Đăng nhập có tích 'Lưu tài khoản' -> Reload chỉ có email, mật khẩu rỗng ---");
    await page.goto("about:blank");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));

    await page.waitForSelector("input#email");
    await page.type("input#email", "nguyenvanan@gmail.com");
    await page.type("input#password", "12345678");

    // Tích ô "Lưu tài khoản"
    const rememberCb = await page.waitForSelector("input[name='rememberMe']");
    await rememberCb.click();

    // Submit đăng nhập
    const loginBtn = await page.waitForSelector("button[type='submit']");
    await loginBtn.click();
    await page.waitForFunction(() => window.location.pathname.includes("/employees/schedule"), { timeout: 5000 });

    assert.ok(
      page.url().includes("/employees/schedule"),
      "Đăng nhập Staff NV001 thành công phải vào /employees/schedule"
    );

    // Kiểm tra localStorage: TUYỆT ĐỐI KHÔNG LƯU MẬT KHẨU
    const storageData = await page.evaluate(() => {
      const allKeys = Object.keys(localStorage);
      const allValues = allKeys.map((k) => localStorage.getItem(k));
      const hasPassword = allValues.some((v) => v && v.includes("12345678"));
      return {
        savedEmail: localStorage.getItem("SMART_SCHEDULING_REMEMBERED_EMAIL"),
        hasPassword,
      };
    });

    assert.strictEqual(
      storageData.savedEmail,
      "nguyenvanan@gmail.com",
      "localStorage phải lưu email nguyenvanan@gmail.com khi tích 'Lưu tài khoản'"
    );
    assert.strictEqual(
      storageData.hasPassword,
      false,
      "TUYỆT ĐỐI KHÔNG ĐƯỢC LƯU MẬT KHẨU TRONG LOCALSTORAGE"
    );
    console.log("✔ 'Lưu tài khoản' chỉ lưu email, TUYỆT ĐỐI không lưu mật khẩu!");

    // Giả lập phiên hết hạn hoặc mở trang login ở tab mới: xóa session nhưng giữ email đã lưu
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    });

    // Truy cập lại trang /login
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));

    // Kiểm tra trên form đăng nhập: Email tự động điền, Password trống rỗng
    const autoEmail = await page.$eval("input#email", (el) => el.value);
    const autoPass = await page.$eval("input#password", (el) => el.value);
    const autoRememberChecked = await page.$eval("input[name='rememberMe']", (el) => el.checked);

    assert.strictEqual(
      autoEmail,
      "nguyenvanan@gmail.com",
      "Email phải được tự động điền từ tài khoản đã lưu"
    );
    assert.strictEqual(
      autoPass,
      "",
      "Mật khẩu BẮT BUỘC phải trống rỗng, không được tự động điền"
    );
    assert.strictEqual(
      autoRememberChecked,
      true,
      "Checkbox 'Lưu tài khoản' phải ở trạng thái được tích"
    );
    console.log("✔ Khi tải lại trang đăng nhập: Email tự điền, mật khẩu rỗng, checkbox tích sẵn!");

    console.log("\n=======================================================");
    console.log("TẤT CẢ CÁC BƯỚC KIỂM THỬ E2E CHO PHẦN 5 ĐÃ VƯỢT QUA 100%! ");
    console.log("=======================================================\n");
  } finally {
    await browser.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Lỗi kiểm thử E2E Đăng nhập / Đăng xuất:", err);
  process.exit(1);
});

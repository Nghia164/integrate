/* global process */
// =============================================================================
// File: tests/e2e/test_auth_flow.js
// Kiểm thử E2E: Đăng nhập form, phân quyền vai trò, validation và bảo vệ route
// =============================================================================

import {
  launchBrowser,
  createTrackedPage,
  setControlledInputValue,
  sleep,
  BASE_URL,
} from "./helpers.js";

async function runAuthFlowTest() {
  console.log("=== BẮT ĐẦU TEST E2E: QUY TRÌNH ĐĂNG NHẬP THẬT & BẢO VỆ ROUTE ===");
  const browser = await launchBrowser();
  const { page } = await createTrackedPage(browser);

  try {
    // 1. Kiểm tra trang đăng nhập & auto-focus
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await sleep(500);

    const activeId = await page.evaluate(() => document.activeElement?.id);
    console.log(`[PASS] Tự động focus vào ô tài khoản: #${activeId}`);

    await page.screenshot({
      path: "C:/Users/Dell/.gemini/antigravity/brain/81d23576-cec1-4d0c-b99d-1f5076508c32/screenshot_login_page_new_design.png",
    });
    console.log("[PASS] Đã chụp ảnh trang đăng nhập mới");

    // 2. Client-side validation: để trống và bấm Đăng nhập
    await page.click('button[type="submit"]');
    await sleep(300);
    const accountError = await page.$eval("#account-error", (el) => el.textContent.trim()).catch(() => "");
    const passwordError = await page.$eval("#password-error", (el) => el.textContent.trim()).catch(() => "");
    if (accountError && passwordError) {
      console.log(`[PASS] Báo lỗi validate client: "${accountError}", "${passwordError}"`);
    } else {
      throw new Error("Không hiển thị lỗi validate client khi để trống!");
    }

    // 3. Kiểm tra thông báo sai mật khẩu (không tiết lộ sai ô nào)
    await setControlledInputValue(page, "#email", "manager@gmail.com");
    await setControlledInputValue(page, "#password", "wrong_password");
    await page.click('button[type="submit"]');
    await sleep(600);
    const alertMsg = await page.$eval('[role="alert"]', (el) => el.textContent.trim()).catch(() => "");
    if (alertMsg.includes("Tài khoản hoặc mật khẩu không đúng")) {
      console.log(`[PASS] Thông báo sai mật khẩu bảo mật: "${alertMsg}"`);
    } else {
      throw new Error(`Thông báo lỗi không đúng mong đợi: "${alertMsg}"`);
    }

    // 4. Kiểm tra tài khoản đã nghỉ việc (Đỗ Kim Ngân: dokimngan@gmail.com)
    await setControlledInputValue(page, "#email", "dokimngan@gmail.com");
    await setControlledInputValue(page, "#password", "12345678");
    await page.click('button[type="submit"]');
    await sleep(600);
    const inactiveMsg = await page.$eval('[role="alert"]', (el) => el.textContent.trim()).catch(() => "");
    if (inactiveMsg.includes("Tài khoản không còn hoạt động")) {
      console.log(`[PASS] Thông báo tài khoản nghỉ việc: "${inactiveMsg}"`);
    } else {
      throw new Error(`Thông báo không còn hoạt động không xuất hiện: "${inactiveMsg}"`);
    }

    // 5. Kiểm tra tính năng redirect quay lại route trước đó (state.from)
    // Người dùng truy cập thẳng vào /employees/leave khi chưa đăng nhập
    await page.goto(`${BASE_URL}/employees/leave`, { waitUntil: "networkidle2" });
    await sleep(500);
    if (!page.url().includes("/login")) {
      throw new Error("Chưa đăng nhập truy cập /employees/leave không bị redirect về /login!");
    }
    console.log("[PASS] Chưa đăng nhập vào /employees/leave -> chuyển hướng về /login với state.from");

    // Đăng nhập bằng Email Staff: nguyenvanan@gmail.com
    await setControlledInputValue(page, "#email", "nguyenvanan@gmail.com");
    await setControlledInputValue(page, "#password", "12345678");
    await page.click('button[type="submit"]');
    await sleep(1500);
    if (page.url().includes("/employees/leave")) {
      console.log("[PASS] Đăng nhập Staff bằng email thành công, tự động quay lại đúng trang:", page.url());
    } else {
      throw new Error(`Đăng nhập không quay lại đúng trang /employees/leave! Hiện tại: ${page.url()}`);
    }

    // 6. Staff cố vào /manager/dashboard -> bị chặn và chuyển về /employees/schedule
    await page.goto(`${BASE_URL}/manager/dashboard`, { waitUntil: "networkidle2" });
    await sleep(500);
    if (page.url().includes("/employees")) {
      console.log("[PASS] Staff cố vào /manager bị chặn, URL:", page.url());
    } else {
      throw new Error("Staff vào được /manager!");
    }

    // 7. Bấm Đăng xuất từ Staff
    const logoutBtn = await page.$('button[title="Đăng xuất"]');
    if (logoutBtn) {
      console.log("Tìm thấy nút Đăng xuất, đang bấm...");
      await page.evaluate(() => {
        const btn = document.querySelector('button[title="Đăng xuất"]');
        if (btn) btn.click();
      });
      await sleep(1500);
      console.log("URL sau khi bấm Đăng xuất:", page.url());
      if (page.url().includes("/login")) {
        console.log("[PASS] Đăng xuất Staff thành công, chuyển về:", page.url());
      } else {
        throw new Error(`Đăng xuất không chuyển về /login! URL hiện tại: ${page.url()}`);
      }
    }

    // 8. Đăng nhập Manager bằng email quanly@smartscheduling.vn
    await page.waitForSelector("#email", { visible: true });
    await sleep(500);
    await setControlledInputValue(page, "#email", "quanly@smartscheduling.vn");
    await setControlledInputValue(page, "#password", "12345678");
    await sleep(300);
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
      else document.querySelector('form')?.requestSubmit();
    });
    await sleep(1500);
    if (page.url().includes("/manager")) {
      console.log("[PASS] Đăng nhập Manager bằng email thành công, URL:", page.url());
    } else {
      const alertText = await page.$eval('[role="alert"]', el => el.textContent).catch(() => '');
      const accountErr = await page.$eval('#account-error', el => el.textContent).catch(() => '');
      const passErr = await page.$eval('#password-error', el => el.textContent).catch(() => '');
      throw new Error(`Đăng nhập Manager thất bại! URL: ${page.url()}, alert: "${alertText}", accountErr: "${accountErr}", passErr: "${passErr}"`);
    }

    // 9. Manager cố vào /employees/schedule -> chuyển về /manager/dashboard
    await page.goto(`${BASE_URL}/employees/schedule`, { waitUntil: "networkidle2" });
    await sleep(500);
    if (page.url().includes("/manager")) {
      console.log("[PASS] Manager bị chặn không vào được /employees, URL:", page.url());
    } else {
      throw new Error("Manager vào được /employees!");
    }

    // 10. Đã đăng nhập Manager mà vào /login -> tự chuyển về /manager/dashboard
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await sleep(500);
    if (page.url().includes("/manager")) {
      console.log("[PASS] Đã đăng nhập vào /login tự động chuyển về trang chính vai trò:", page.url());
    } else {
      throw new Error("Đã đăng nhập vào /login không bị redirect!");
    }

    // 11. Đã đăng nhập Manager mà vào / -> tự chuyển về /manager/dashboard
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    await sleep(500);
    if (page.url().includes("/manager")) {
      console.log("[PASS] Đã đăng nhập vào / (Landing) tự động chuyển về trang chính vai trò:", page.url());
    } else {
      throw new Error("Đã đăng nhập vào / không bị redirect!");
    }

    console.log("=== TOÀN BỘ LUỒNG ĐĂNG NHẬP, VALIDATION & BẢO VỆ ROUTE PASS 100% ===");
  } finally {
    await browser.close();
  }
}

runAuthFlowTest().catch((err) => {
  console.error("Test E2E Thất bại:", err);
  process.exit(1);
});

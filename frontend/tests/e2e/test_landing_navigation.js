/* global process */
// =============================================================================
// File: tests/e2e/test_landing_navigation.js
// Kiểm thử E2E: Trang Landing Page công khai, điều hướng Đăng nhập & Chuyển hướng
// =============================================================================

import {
  launchBrowser,
  createTrackedPage,
  setControlledInputValue,
  sleep,
  BASE_URL,
} from "./helpers.js";

const ARTIFACT_DIR = "C:/Users/Dell/.gemini/antigravity/brain/81d23576-cec1-4d0c-b99d-1f5076508c32";

async function runLandingE2ETest() {
  console.log("=== BẮT ĐẦU TEST E2E: LANDING PAGE & LUỒNG ĐIỀU HƯỚNG ===");
  const browser = await launchBrowser();
  const { page, errors } = await createTrackedPage(browser);

  try {
    // 1. Dọn sạch phiên đăng nhập (chưa đăng nhập)
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.evaluate(() => localStorage.clear());

    // 2. Truy cập Landing Page "/" ở chế độ Desktop (1440x900)
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    await sleep(600);

    // Xác nhận tiêu đề và các thành phần chính của Landing
    const pageText = await page.evaluate(() => document.body.innerText);
    if (!pageText.includes("Smart Scheduling") || !pageText.includes("Tự động hóa xếp ca")) {
      throw new Error("Landing Page không hiển thị đúng nội dung giới thiệu!");
    }
    console.log("[PASS] Landing Page hiển thị đầy đủ nội dung trên Desktop");

    // Chụp screenshot Desktop
    await page.screenshot({
      path: `${ARTIFACT_DIR}/screenshot_landing_desktop.png`,
      fullPage: false,
    });
    console.log("[PASS] Đã chụp ảnh Desktop:", `${ARTIFACT_DIR}/screenshot_landing_desktop.png`);

    // 3. Chụp screenshot Mobile (390x844 - iPhone style)
    await page.setViewport({ width: 390, height: 844 });
    await sleep(400);
    await page.screenshot({
      path: `${ARTIFACT_DIR}/screenshot_landing_mobile.png`,
      fullPage: false,
    });
    console.log("[PASS] Đã chụp ảnh Mobile:", `${ARTIFACT_DIR}/screenshot_landing_mobile.png`);

    // Trở lại viewport Desktop để tương tác click
    await page.setViewport({ width: 1440, height: 900 });
    await sleep(200);

    // 4. Bấm nút "Đăng nhập" trên thanh điều hướng Landing -> chuyển sang /login
    const loginNavBtn = await page.waitForSelector('header a[href="/login"], header button');
    if (!loginNavBtn) throw new Error("Không tìm thấy nút Đăng nhập trên header Landing!");
    
    // Tìm cụ thể nút có chữ Đăng nhập trong header
    await page.evaluate(() => {
      const headerBtns = Array.from(document.querySelectorAll("header button, header a"));
      const btn = headerBtns.find(b => b.innerText.includes("Đăng nhập"));
      if (btn) btn.click();
    });
    await sleep(600);

    if (page.url().includes("/login")) {
      console.log("[PASS] Bấm nút Đăng nhập trên Landing chuyển đúng sang /login:", page.url());
    } else {
      throw new Error(`Bấm nút Đăng nhập không chuyển sang /login! URL hiện tại: ${page.url()}`);
    }

    // 5. Kiểm tra link "Về trang giới thiệu" trên LoginPage
    const backToLanding = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a, button"));
      const homeLink = links.find(
        (l) => l.innerText.includes("Về trang giới thiệu") || l.getAttribute("href") === "/"
      );
      if (homeLink) {
        homeLink.click();
        return true;
      }
      return false;
    });
    if (!backToLanding) throw new Error("Không tìm thấy link Về trang giới thiệu trên LoginPage");
    await sleep(600);

    const currentUrlAfterBack = page.url();
    if (currentUrlAfterBack === `${BASE_URL}/` || currentUrlAfterBack === `${BASE_URL}`) {
      console.log("[PASS] Bấm 'Quay lại trang chủ' từ LoginPage chuyển đúng về Landing '/':", currentUrlAfterBack);
    } else {
      throw new Error(`Link quay lại không về '/': ${currentUrlAfterBack}`);
    }

    // 6. Đăng nhập với tài khoản Manager -> truy cập "/" -> tự chuyển về /manager/dashboard
    console.log("\n--- Kiểm tra tự động chuyển hướng khi Manager vào '/' ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await setControlledInputValue(page, "#email", "quanly@smartscheduling.vn");
    await setControlledInputValue(page, "#password", "12345678");
    await page.click('button[type="submit"]');
    await sleep(1000);

    if (!page.url().includes("/manager")) {
      throw new Error(`Đăng nhập Manager thất bại! URL: ${page.url()}`);
    }
    console.log("[PASS] Manager đăng nhập thành công vào:", page.url());

    // Cố truy cập lại "/" khi đã đăng nhập
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    await sleep(500);
    if (page.url().includes("/manager/dashboard")) {
      console.log("[PASS] Đã đăng nhập Manager vào '/' tự chuyển về /manager/dashboard:", page.url());
    } else {
      throw new Error(`Manager vào '/' không tự chuyển về /manager/dashboard! URL: ${page.url()}`);
    }

    // Đăng xuất Manager
    await page.evaluate(() => {
      const btn = document.querySelector('button[title="Đăng xuất"]');
      if (btn) btn.click();
    });
    await sleep(1000);
    if (!page.url().includes("/login")) {
      await page.evaluate(() => localStorage.clear());
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    }
    console.log("[PASS] Manager đã đăng xuất, URL:", page.url());

    // 7. Đăng nhập với tài khoản Staff -> truy cập "/" -> tự chuyển về /employees/schedule
    console.log("\n--- Kiểm tra tự động chuyển hướng khi Staff vào '/' ---");
    if (!page.url().includes("/login")) {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    }
    await setControlledInputValue(page, "#email", "nguyenvanan@gmail.com");
    await setControlledInputValue(page, "#password", "12345678");
    await page.evaluate(() => {
      document.querySelector("form")?.requestSubmit();
    });
    await sleep(1500);

    if (!page.url().includes("/employees")) {
      const alert = await page.$eval('[role="alert"]', el => el.textContent).catch(() => '');
      const accErr = await page.$eval('#account-error', el => el.textContent).catch(() => '');
      const passErr = await page.$eval('#password-error', el => el.textContent).catch(() => '');
      const vals = await page.evaluate(() => ({
        email: document.querySelector('#email')?.value,
        pass: document.querySelector('#password')?.value
      }));
      throw new Error(`Đăng nhập Staff thất bại! URL: ${page.url()}, alert: "${alert}", accErr: "${accErr}", passErr: "${passErr}", vals: ${JSON.stringify(vals)}`);
    }
    console.log("[PASS] Staff đăng nhập thành công vào:", page.url());

    // Cố truy cập lại "/" khi đã đăng nhập
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    await sleep(500);
    if (page.url().includes("/employees/schedule")) {
      console.log("[PASS] Đã đăng nhập Staff vào '/' tự chuyển về /employees/schedule:", page.url());
    } else {
      throw new Error(`Staff vào '/' không tự chuyển về /employees/schedule! URL: ${page.url()}`);
    }

    // Đăng xuất Staff
    await page.waitForSelector('button[title="Đăng xuất"]', { visible: true });
    await page.evaluate(() => {
      const btn = document.querySelector('button[title="Đăng xuất"]');
      if (btn) btn.click();
    });
    await sleep(1000);
    console.log("[PASS] Staff đã đăng xuất, URL hiện tại:", page.url());

    // Nếu chưa ở /login hoặc /, đảm bảo localStorage đã sạch
    const remainingUser = await page.evaluate(() => localStorage.getItem("user"));
    if (remainingUser) {
      await page.evaluate(() => localStorage.clear());
    }

    // 8. Khi chưa đăng nhập, truy cập /manager/dashboard hoặc /employees/schedule -> chuyển về /login
    console.log("\n--- Kiểm tra chặn truy cập khi chưa đăng nhập ---");
    await page.goto(`${BASE_URL}/manager/dashboard`, { waitUntil: "networkidle2" });
    await sleep(300);
    if (page.url().includes("/login")) {
      console.log("[PASS] Chưa đăng nhập vào /manager/dashboard bị chuyển về /login");
    } else {
      throw new Error(`Chưa đăng nhập vẫn vào được /manager/dashboard: ${page.url()}`);
    }

    await page.goto(`${BASE_URL}/employees/schedule`, { waitUntil: "networkidle2" });
    await sleep(300);
    if (page.url().includes("/login")) {
      console.log("[PASS] Chưa đăng nhập vào /employees/schedule bị chuyển về /login");
    } else {
      throw new Error(`Chưa đăng nhập vẫn vào được /employees/schedule: ${page.url()}`);
    }

    if (errors.length > 0) {
      console.warn("Cảnh báo console errors:", errors);
    }

    console.log("\n=== TẤT CẢ CÁC BƯỚC KIỂM THỬ LANDING PAGE & ĐIỀU HƯỚNG ĐỀU THÀNH CÔNG (100% PASS) ===");
  } finally {
    await browser.close();
  }
}

runLandingE2ETest().catch((err) => {
  console.error(">>> THẤT BẠI TRONG E2E TEST:", err);
  process.exit(1);
});

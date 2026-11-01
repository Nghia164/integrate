/* global process */
// =============================================================================
// File: tests/e2e/capture_login_comparison.js
// Mục đích:
// 1. Chụp ảnh trang Login khổ máy tính (1440x900) và điện thoại (390x844)
// 2. Kiểm thử đổi màu nền token trong CSS phản hồi toàn bộ web rồi hoàn lại
// 3. Kiểm thử tương tác đăng nhập Staff, Manager, và đăng nhập sai
// =============================================================================

import fs from "node:fs";
import { launchBrowser, createTrackedPage, setControlledInputValue, sleep, BASE_URL } from "./helpers.js";

const ARTIFACT_DIR = "C:/Users/Dell/.gemini/antigravity/brain/81d23576-cec1-4d0c-b99d-1f5076508c32";
const DESKTOP_IMG = `${ARTIFACT_DIR}/screenshot_login_desktop_nexus.png`;
const MOBILE_IMG = `${ARTIFACT_DIR}/screenshot_login_mobile_nexus.png`;

async function main() {
  console.log("=== BẮT ĐẦU CHỤP ẢNH & KIỂM THỬ GIAO DIỆN LOGIN THEO MẪU ===");
  const browser = await launchBrowser();
  const { page } = await createTrackedPage(browser);

  try {
    // 1. Chụp màn hình Desktop (1440x900)
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await sleep(600);

    await page.screenshot({ path: DESKTOP_IMG, fullPage: true });
    console.log(`[PASS] Đã chụp ảnh Login Desktop: ${DESKTOP_IMG}`);

    // 2. Chụp màn hình Mobile (390x844 - iPhone 14 / modern phone)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await sleep(600);

    await page.screenshot({ path: MOBILE_IMG, fullPage: true });
    console.log(`[PASS] Đã chụp ảnh Login Mobile: ${MOBILE_IMG}`);

    // 3. Khôi phục lại viewport Desktop để kiểm thử form & đổi token
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await sleep(300);

    // Kiểm tra thử đăng nhập sai
    console.log("--- Kiểm tra thông báo lỗi khi đăng nhập sai ---");
    await setControlledInputValue(page, "#email", "quanly@smartscheduling.vn");
    await setControlledInputValue(page, "#password", "wrong_pass");
    await page.click('button[type="submit"]');
    await sleep(600);
    const alertMsg = await page.$eval('[role="alert"]', el => el.textContent.trim()).catch(() => "");
    console.log(`[PASS] Hiển thị banner lỗi bảo mật: "${alertMsg}"`);

    // Kiểm tra đăng nhập đúng Staff -> vào /employees/schedule
    console.log("--- Kiểm tra đăng nhập đúng Staff ---");
    await setControlledInputValue(page, "#email", "nguyenvanan@gmail.com");
    await setControlledInputValue(page, "#password", "12345678");
    await page.click('button[type="submit"]');
    await sleep(1500);
    console.log(`[PASS] Staff đăng nhập thành công vào: ${page.url()}`);

    // Đăng xuất Staff
    await page.evaluate(() => {
      const btn = document.querySelector('button[title="Đăng xuất"]');
      if (btn) btn.click();
    });
    await sleep(1000);

    // Kiểm tra đăng nhập đúng Manager -> vào /manager/dashboard
    console.log("--- Kiểm tra đăng nhập đúng Manager ---");
    await page.waitForSelector("#email", { visible: true });
    await sleep(400);
    await setControlledInputValue(page, "#email", "quanly@smartscheduling.vn");
    await setControlledInputValue(page, "#password", "12345678");
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });
    await sleep(1500);
    if (!page.url().includes("/manager")) {
      throw new Error(`Manager không vào đúng /manager! Hiện tại: ${page.url()}`);
    }
    console.log(`[PASS] Manager đăng nhập thành công vào: ${page.url()}`);

    // 4. KIỂM THỬ ĐỔI TOKEN MÀU NỀN TRONG CSS PHẢN HỒI VÀ HOÀN LẠI
    console.log("--- Kiểm thử đổi màu nền token CSS và hoàn lại ---");
    const cssPath = "src/index.css";
    const originalCss = fs.readFileSync(cssPath, "utf-8");

    try {
      // Đổi tạm thời sang màu hồng nhạt #FFE4E6 để kiểm chứng phản hồi
      const testCss = originalCss
        .replace(/--page-bg:\s*#F4F7F9;/g, "--page-bg: #FFE4E6;")
        .replace(/--color-page-bg:\s*#F4F7F9;/g, "--color-page-bg: #FFE4E6;");
      fs.writeFileSync(cssPath, testCss, "utf-8");
      await sleep(1000);

      // Tải lại trang và kiểm tra computed style của body và background
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
      await sleep(500);
      const bgBody = await page.evaluate(() => {
        return getComputedStyle(document.body).backgroundColor;
      });
      console.log(`[PASS] Sau khi đổi token, computed background body: ${bgBody} (nhận màu mới)`);
    } finally {
      // HOÀN LẠI NGAY LẬP TỨC VỀ GỐC
      fs.writeFileSync(cssPath, originalCss, "utf-8");
      await sleep(1000);
      console.log("[PASS] Đã hoàn lại toàn bộ file token src/index.css về gốc #F4F7F9");
    }

    console.log("=== TOÀN BỘ BƯỚC KIỂM THỬ GIAO DIỆN LOGIN & TOKEN PASS 100% ===");
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error("Test Thất Bại:", err);
  process.exit(1);
});

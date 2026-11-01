/* global process */
// =============================================================================
// File: tests/e2e/capture_option_b_screenshots.js
// Chụp ảnh kiểm thử trực quan bảng màu ca Phương án B (Tông lạnh)
// =============================================================================

import {
  launchBrowser,
  createTrackedPage,
  loginAsManager,
  setControlledInputValue,
  sleep,
  BASE_URL,
} from "./helpers.js";

const ARTIFACT_DIR = "C:/Users/Dell/.gemini/antigravity/brain/81d23576-cec1-4d0c-b99d-1f5076508c32";

async function runCapture() {
  console.log("=== BẮT ĐẦU CHỤP ẢNH GIAO DIỆN BẢNG MÀU CA PHƯƠNG ÁN B ===");
  const browser = await launchBrowser();
  const { page } = await createTrackedPage(browser);

  try {
    // 1. Chụp Landing Page với bảng màu ca mới
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    await sleep(600);
    await page.screenshot({
      path: `${ARTIFACT_DIR}/screenshot_landing_option_b.png`,
    });
    console.log("[PASS] Đã chụp screenshot_landing_option_b.png");

    // 2. Đăng nhập Staff và chụp Lịch của tôi (Desktop & Mobile)
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await setControlledInputValue(page, "#email", "nguyenvanan@gmail.com");
    await setControlledInputValue(page, "#password", "123456");
    await page.click('button[type="submit"]');
    await sleep(1200);

    // Chụp Desktop Lịch của tôi
    await page.goto(`${BASE_URL}/employees/schedule`, { waitUntil: "networkidle2" });
    await sleep(800);
    await page.screenshot({
      path: `${ARTIFACT_DIR}/screenshot_staff_schedule_option_b.png`,
    });
    console.log("[PASS] Đã chụp screenshot_staff_schedule_option_b.png");

    // Chụp Mobile Lịch của tôi
    await page.setViewport({ width: 390, height: 844 });
    await sleep(600);
    await page.screenshot({
      path: `${ARTIFACT_DIR}/screenshot_staff_schedule_mobile_option_b.png`,
    });
    console.log("[PASS] Đã chụp screenshot_staff_schedule_mobile_option_b.png");

    // 3. Đăng nhập Manager và chụp Lịch đã tạo
    await page.setViewport({ width: 1440, height: 900 });
    await loginAsManager(page);
    await page.goto(`${BASE_URL}/manager/schedule/created`, { waitUntil: "networkidle2" });
    await sleep(1000);
    await page.screenshot({
      path: `${ARTIFACT_DIR}/screenshot_manager_schedule_option_b.png`,
    });
    console.log("[PASS] Đã chụp screenshot_manager_schedule_option_b.png, URL:", page.url());

    console.log("=== HOÀN TẤT CHỤP ẢNH TẤT CẢ MÀN HÌNH BẢNG MÀU CA PHƯƠNG ÁN B ===");
  } finally {
    await browser.close();
  }
}

runCapture().catch((err) => {
  console.error("Lỗi khi chụp ảnh:", err);
  process.exit(1);
});

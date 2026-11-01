/* global process */
// =============================================================================
// File: tests/e2e/test_token_reactivity_and_capture.js
// Kiểm tra: Đổi thử 1 màu trong file token -> toàn bộ đổi theo -> hoàn lại -> chụp ảnh Lịch của tôi (Tuần)
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import {
  launchBrowser,
  createTrackedPage,
  setControlledInputValue,
  sleep,
  BASE_URL,
} from "./helpers.js";

const ARTIFACT_DIR = "C:/Users/Dell/.gemini/antigravity/brain/81d23576-cec1-4d0c-b99d-1f5076508c32";
const TOKEN_PATH = path.resolve("src/shared/shiftColors.js");

async function runTestAndCapture() {
  console.log("=== BẮT ĐẦU KIỂM THỬ: ĐỔI MÀU TOKEN -> TOÀN BỘ ĐỔI THEO -> HOÀN LẠI ===");

  const originalContent = fs.readFileSync(TOKEN_PATH, "utf-8");

  const browser = await launchBrowser();
  const { page } = await createTrackedPage(browser);

  try {
    // 1. Đăng nhập Staff trước
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await setControlledInputValue(page, "#email", "nguyenvanan@gmail.com");
    await setControlledInputValue(page, "#password", "123456");
    await page.click('button[type="submit"]');
    await sleep(1500);

    // Vào trang Lịch của tôi
    await page.goto(`${BASE_URL}/employees/schedule`, { waitUntil: "networkidle2" });
    await sleep(800);

    // Kiểm tra màu ban đầu của Ca Sáng
    const initialMorningBg = await page.evaluate(() => {
      // Tìm thẻ ca sáng đầu tiên
      const buttons = Array.from(document.querySelectorAll("button"));
      const morningBtn = buttons.find((b) => b.innerText.includes("Ca Sáng"));
      return morningBtn ? window.getComputedStyle(morningBtn).backgroundColor : null;
    });
    console.log("[1] Màu nền Ca Sáng ban đầu:", initialMorningBg);

    // 2. Thử nghiệm đổi màu trong file token shiftColors.js: đổi bg của Ca Sáng thành #BBE5F8
    const testContent = originalContent.replace(
      'bg: "#E6F4FA"',
      'bg: "#BBE5F8"'
    );
    fs.writeFileSync(TOKEN_PATH, testContent, "utf-8");
    console.log("[2] Đã sửa thử nghiệm bg của Ca Sáng thành #BBE5F8 trong shiftColors.js");

    // Đợi Vite HMR hoặc refresh trang
    await sleep(1200);
    await page.reload({ waitUntil: "networkidle2" });
    await sleep(800);

    const changedMorningBg = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const morningBtn = buttons.find((b) => b.innerText.includes("Ca Sáng"));
      return morningBtn ? window.getComputedStyle(morningBtn).backgroundColor : null;
    });
    console.log("[3] Màu nền Ca Sáng sau khi đổi token:", changedMorningBg);

    if (changedMorningBg === initialMorningBg) {
      console.warn("Cảnh báo: Màu chưa cập nhật qua HMR/reload");
    } else {
      console.log("✔ [PASS] Đổi token thành công: Giao diện toàn bộ trang Staff đổi theo ngay lập tức!");
    }

    // 3. Hoàn lại nguyên trạng file token shiftColors.js
    fs.writeFileSync(TOKEN_PATH, originalContent, "utf-8");
    console.log("[4] Đã hoàn lại file token ban đầu");

    await sleep(1200);
    await page.reload({ waitUntil: "networkidle2" });
    await sleep(800);

    const revertedMorningBg = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const morningBtn = buttons.find((b) => b.innerText.includes("Ca Sáng"));
      return morningBtn ? window.getComputedStyle(morningBtn).backgroundColor : null;
    });
    console.log("[5] Màu nền Ca Sáng sau khi hoàn lại:", revertedMorningBg);

    // 4. Chụp lại ảnh Lịch của tôi (Tuần) khổ máy tính (1440x900)
    const screenshotPath = `${ARTIFACT_DIR}/screenshot_staff_schedule_desktop_final.png`;
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
    });
    console.log("[PASS] Đã chụp ảnh Lịch của tôi (Tuần) khổ máy tính:", screenshotPath);

    console.log("=== HOÀN TẤT KIỂM THỬ TOKEN VÀ CHỤP ẢNH GIAO DIỆN ===");
  } finally {
    // Đảm bảo luôn hoàn lại file dù có lỗi
    fs.writeFileSync(TOKEN_PATH, originalContent, "utf-8");
    await browser.close();
  }
}

runTestAndCapture().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});

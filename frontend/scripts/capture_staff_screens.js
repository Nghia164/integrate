/**
 * File: scripts/capture_staff_screens.js
 * Mục đích: Chụp ảnh giao diện 3 trang Staff (US08, US13, US19) ở các kích thước và chế độ xem:
 * - Lịch của tôi (desktop tuần, ngày, tháng + mobile ngày/danh sách)
 * - Đăng ký rảnh/bận (desktop + mobile)
 * - Ca trực mở (desktop + mobile)
 */
import path from "node:path";
import process from "node:process";
import { launchBrowser, createTrackedPage, sleep, BASE_URL } from "../tests/e2e/helpers.js";

const ARTIFACT_DIR = "C:\\Users\\Dell\\.gemini\\antigravity\\brain\\81d23576-cec1-4d0c-b99d-1f5076508c32";

async function capture() {
  console.log("Khởi động Chrome để chụp ảnh các màn hình Staff...");
  const browser = await launchBrowser();
  const { page } = await createTrackedPage(browser);

  try {
    // 1. Đăng nhập Staff NV001
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await sleep(500);
    await page.evaluate(() => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "NV001",
          employeeId: "NV001",
          name: "Nguyễn Văn An",
          email: "nguyenvanan@gmail.com",
          role: "staff",
          roleTag: "Phục vụ",
          status: "Đang làm việc",
        })
      );
      localStorage.setItem("token", "mock-staff-token-NV001");
    });
    await sleep(500);

    // ==========================================
    // 1. LỊCH CỦA TÔI (US13)
    // ==========================================
    console.log("1. Chụp ảnh Lịch của tôi...");
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/employees/schedule`, { waitUntil: "domcontentloaded" });
    await sleep(1500);

    // a) Desktop - Dạng Tuần (mặc định)
    const weekPath = path.join(ARTIFACT_DIR, "screenshot_staff_schedule_week_desktop.png");
    const schedDefaultPath = path.join(ARTIFACT_DIR, "screenshot_staff_schedule_desktop.png");
    await page.screenshot({ path: weekPath, fullPage: true });
    await page.screenshot({ path: schedDefaultPath, fullPage: true });
    console.log(` -> Đã lưu Desktop (Tuần - full): ${weekPath}`);

    // b) Desktop - Dạng Ngày (bấm nút "Ngày")
    try {
      const clickedDay = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find((b) => b.textContent.trim() === "Ngày");
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      if (clickedDay) {
        await sleep(1000);
        const dayPath = path.join(ARTIFACT_DIR, "screenshot_staff_schedule_day_desktop.png");
        await page.screenshot({ path: dayPath, fullPage: false });
        console.log(` -> Đã lưu Desktop (Ngày): ${dayPath}`);
      }
    } catch (e) {
      console.warn("Lỗi khi chuyển dạng Ngày:", e.message);
    }

    // c) Desktop - Dạng Tháng (bấm nút "Tháng")
    try {
      const clickedMonth = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find((b) => b.textContent.trim() === "Tháng");
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      if (clickedMonth) {
        await sleep(1000);
        const monthPath = path.join(ARTIFACT_DIR, "screenshot_staff_schedule_month_desktop.png");
        await page.screenshot({ path: monthPath, fullPage: false });
        console.log(` -> Đã lưu Desktop (Tháng): ${monthPath}`);
      }
    } catch (e) {
      console.warn("Lỗi khi chuyển dạng Tháng:", e.message);
    }

    // d) Mobile - 375x812 (Dạng ngày hoặc danh sách)
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/employees/schedule`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    const mobileSchedPath = path.join(ARTIFACT_DIR, "screenshot_staff_schedule_mobile.png");
    await page.screenshot({ path: mobileSchedPath, fullPage: true });
    console.log(` -> Đã lưu Mobile (Lịch của tôi - full): ${mobileSchedPath}`);

    // ==========================================
    // 2. ĐĂNG KÝ RẢNH / BẬN (US08)
    // ==========================================
    console.log("2. Chụp ảnh Đăng ký rảnh/bận...");
    // Desktop: 1280x800
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/employees/availability`, { waitUntil: "domcontentloaded" });
    await sleep(1200);
    const availDeskPath = path.join(ARTIFACT_DIR, "screenshot_staff_availability_desktop.png");
    await page.screenshot({ path: availDeskPath, fullPage: false });
    console.log(` -> Đã lưu Desktop (Rảnh/bận): ${availDeskPath}`);

    // Mobile: 375x812
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await sleep(800);
    const availMobilePath = path.join(ARTIFACT_DIR, "screenshot_staff_availability_mobile.png");
    await page.screenshot({ path: availMobilePath, fullPage: false });
    console.log(` -> Đã lưu Mobile (Rảnh/bận): ${availMobilePath}`);

    // ==========================================
    // 3. CA TRỰC MỞ (US19)
    // ==========================================
    console.log("3. Chụp ảnh Ca trực mở...");
    // Desktop: 1280x800
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/employees/open-shifts`, { waitUntil: "domcontentloaded" });
    await sleep(1200);
    const openDeskPath = path.join(ARTIFACT_DIR, "screenshot_staff_open_shifts_desktop.png");
    await page.screenshot({ path: openDeskPath, fullPage: false });
    console.log(` -> Đã lưu Desktop (Ca trực mở): ${openDeskPath}`);

    // Mobile: 375x812
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await sleep(800);
    const openMobilePath = path.join(ARTIFACT_DIR, "screenshot_staff_open_shifts_mobile.png");
    await page.screenshot({ path: openMobilePath, fullPage: false });
    console.log(` -> Đã lưu Mobile (Ca trực mở): ${openMobilePath}`);

    console.log("=== HOÀN TẤT CHỤP ẢNH TẤT CẢ MÀN HÌNH THEO YÊU CẦU ===");
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error("Lỗi khi chụp ảnh:", err);
  process.exit(1);
});

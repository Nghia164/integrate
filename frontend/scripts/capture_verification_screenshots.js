/**
 * scripts/capture_verification_screenshots.js
 * Chụp 4 ảnh minh chứng kiểm thử:
 * 1. Chấm công Staff (?now=2026-10-31T11:50&gps=store)
 * 2. Chấm công Staff giờ thật (không cờ demo)
 * 3. Chấm công Manager (cột Trạng thái)
 * 4. Sidebar Manager (không còn khối thông tin user ở đáy, chỉ còn nút Đăng xuất)
 */
import path from "node:path";
import { launchBrowser, createTrackedPage, sleep, BASE_URL } from "../tests/e2e/helpers.js";

const ARTIFACT_DIR = "C:\\Users\\Dell\\.gemini\\antigravity\\brain\\81d23576-cec1-4d0c-b99d-1f5076508c32";

async function run() {
  console.log("Bắt đầu chụp ảnh minh chứng...");
  const browser = await launchBrowser();
  const { page } = await createTrackedPage(browser);

  try {
    // -------------------------------------------------------------
    // 1. Staff Attendance với ?now=2026-10-31T11:50&gps=store
    // -------------------------------------------------------------
    console.log("1. Chụp Chấm công Staff (?now=2026-10-31T11:50&gps=store)...");
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await sleep(300);
    await page.evaluate(() => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "NV001",
          employeeId: "NV001",
          name: "Nguyễn Văn An",
          email: "nguyenvanan@gmail.com",
          role: "staff",
          roles: ["Phục vụ", "Thu ngân"],
          status: "Đang làm việc",
        })
      );
      localStorage.setItem("token", "mock-staff-token-NV001");
    });

    await page.goto(`${BASE_URL}/employees/attendance?now=2026-10-31T11:50&gps=store`, {
      waitUntil: "domcontentloaded",
    });
    await sleep(1500);

    const staffDemoPath = path.join(ARTIFACT_DIR, "screenshot_staff_attendance_demo.png");
    await page.screenshot({ path: staffDemoPath, fullPage: true });
    console.log(` -> Đã lưu: ${staffDemoPath}`);

    // -------------------------------------------------------------
    // 2. Staff Attendance Giờ thật (xoá cờ demo)
    // -------------------------------------------------------------
    console.log("2. Chụp Chấm công Staff giờ thật...");
    await page.evaluate(() => {
      localStorage.removeItem("SMART_SCHEDULING_DEMO_NOW");
      localStorage.removeItem("SMART_SCHEDULING_DEMO_GPS");
    });
    await page.goto(`${BASE_URL}/employees/attendance`, {
      waitUntil: "domcontentloaded",
    });
    await sleep(1500);

    const staffRealPath = path.join(ARTIFACT_DIR, "screenshot_staff_attendance_real.png");
    await page.screenshot({ path: staffRealPath, fullPage: true });
    console.log(` -> Đã lưu: ${staffRealPath}`);

    // -------------------------------------------------------------
    // 3. Manager Attendance (cột Trạng thái)
    // -------------------------------------------------------------
    console.log("3. Chụp Chấm công Manager (cột Trạng thái)...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await sleep(300);
    await page.evaluate(() => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "QL001",
          name: "Trần Quản Lý",
          email: "tranmanager@gmail.com",
          role: "manager",
          status: "Đang làm việc",
        })
      );
      localStorage.setItem("token", "mock-manager-token-QL001");
      // Dùng tuần demo để bảng chấm công hiển thị đầy đủ các trạng thái chuẩn
      localStorage.setItem("SMART_SCHEDULING_DEMO_NOW", "2026-10-31T11:50:00");
    });

    await page.goto(`${BASE_URL}/manager/attendance`, {
      waitUntil: "domcontentloaded",
    });
    await sleep(1500);

    const managerAttPath = path.join(ARTIFACT_DIR, "screenshot_manager_attendance_status.png");
    await page.screenshot({ path: managerAttPath, fullPage: true });
    console.log(` -> Đã lưu: ${managerAttPath}`);

    // -------------------------------------------------------------
    // 4. Sidebar Manager (không còn khối thông tin user ở đáy)
    // -------------------------------------------------------------
    console.log("4. Chụp Sidebar Manager...");
    // Chụp lại khung nhìn hoặc crop sidebar
    const managerSidebarPath = path.join(ARTIFACT_DIR, "screenshot_manager_sidebar.png");
    // Chụp viewport để thấy rõ toàn bộ sidebar bên trái
    await page.screenshot({ path: managerSidebarPath, fullPage: false });
    console.log(` -> Đã lưu: ${managerSidebarPath}`);

    console.log("Hoàn tất chụp 4 ảnh minh chứng!");
  } catch (err) {
    console.error("Lỗi chụp ảnh:", err);
  } finally {
    await browser.close();
  }
}

run();

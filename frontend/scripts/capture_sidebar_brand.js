/**
 * File: scripts/capture_sidebar_brand.js
 * Chụp ảnh đầu sidebar Staff và Manager cạnh nhau (cả mở rộng và thu gọn)
 */
import fs from "node:fs";
import path from "node:path";
import { launchBrowser, createTrackedPage, sleep, BASE_URL } from "../tests/e2e/helpers.js";

const ARTIFACT_DIR = "C:\\Users\\Dell\\.gemini\\antigravity\\brain\\81d23576-cec1-4d0c-b99d-1f5076508c32";

async function run() {
  console.log("Khởi động Chrome để chụp ảnh Sidebar Brand...");
  const browser = await launchBrowser();
  const { page } = await createTrackedPage(browser);

  try {
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Staff Expanded
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
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
    await page.goto(`${BASE_URL}/employees/schedule`, { waitUntil: "domcontentloaded" });
    await sleep(800);

    const staffAside = await page.$("aside");
    const staffExpandedPath = path.join(ARTIFACT_DIR, "screenshot_sidebar_staff_expanded.png");
    if (staffAside) {
      const box = await staffAside.boundingBox();
      await page.screenshot({
        path: staffExpandedPath,
        clip: { x: box.x, y: box.y, width: box.width, height: 160 },
      });
      console.log(` -> Đã lưu Staff Expanded: ${staffExpandedPath}`);
    }

    // 2. Staff Collapsed
    await page.click('button[aria-label="Thu gọn menu"]');
    await sleep(500);
    const staffCollapsedPath = path.join(ARTIFACT_DIR, "screenshot_sidebar_staff_collapsed.png");
    if (staffAside) {
      const box = await staffAside.boundingBox();
      await page.screenshot({
        path: staffCollapsedPath,
        clip: { x: box.x, y: box.y, width: box.width, height: 160 },
      });
      console.log(` -> Đã lưu Staff Collapsed: ${staffCollapsedPath}`);
    }

    // 3. Manager Expanded
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
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
    });
    await page.goto(`${BASE_URL}/manager/dashboard`, { waitUntil: "domcontentloaded" });
    await sleep(800);

    const mgrAside = await page.$("aside");
    const mgrExpandedPath = path.join(ARTIFACT_DIR, "screenshot_sidebar_manager_expanded.png");
    if (mgrAside) {
      const box = await mgrAside.boundingBox();
      await page.screenshot({
        path: mgrExpandedPath,
        clip: { x: box.x, y: box.y, width: box.width, height: 160 },
      });
      console.log(` -> Đã lưu Manager Expanded: ${mgrExpandedPath}`);
    }

    // 4. Manager Collapsed
    await page.click('button[aria-label="Thu gọn menu"]');
    await sleep(500);
    const mgrCollapsedPath = path.join(ARTIFACT_DIR, "screenshot_sidebar_manager_collapsed.png");
    if (mgrAside) {
      const box = await mgrAside.boundingBox();
      await page.screenshot({
        path: mgrCollapsedPath,
        clip: { x: box.x, y: box.y, width: box.width, height: 160 },
      });
      console.log(` -> Đã lưu Manager Collapsed: ${mgrCollapsedPath}`);
    }

    // 5. Đọc các ảnh thành base64 để ghép nối trong trang tĩnh
    console.log("5. Tạo ảnh so sánh trực quan cạnh nhau...");
    const b64StaffExp = fs.readFileSync(staffExpandedPath).toString("base64");
    const b64MgrExp = fs.readFileSync(mgrExpandedPath).toString("base64");
    const b64StaffCol = fs.readFileSync(staffCollapsedPath).toString("base64");
    const b64MgrCol = fs.readFileSync(mgrCollapsedPath).toString("base64");

    const comparisonHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; font-family: "Segoe UI", Tahoma, sans-serif; }
          body { margin: 0; padding: 24px; background: #F4F7F9; color: #0F172A; }
          h2 { margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #0F172A; text-align: center; }
          .grid { display: flex; gap: 20px; justify-content: center; align-items: flex-start; }
          .col { display: flex; flex-direction: column; align-items: center; }
          .label { font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; text-align: center; }
          .frame { background: white; border-radius: 16px; border: 1px solid #CBD5E1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); padding: 8px; }
          img { display: block; border-radius: 12px; }
        </style>
      </head>
      <body>
        <h2>ĐỒNG BỘ BRAND BLOCK SIDEBAR (STAFF & MANAGER)</h2>
        <div class="grid">
          <div class="col">
            <div class="label">Staff (Cổng Nhân Viên)</div>
            <div class="frame"><img src="data:image/png;base64,${b64StaffExp}" width="264" /></div>
          </div>
          <div class="col">
            <div class="label">Manager (Cổng Quản Lý)</div>
            <div class="frame"><img src="data:image/png;base64,${b64MgrExp}" width="264" /></div>
          </div>
          <div class="col">
            <div class="label">Staff Thu Gọn</div>
            <div class="frame"><img src="data:image/png;base64,${b64StaffCol}" width="80" /></div>
          </div>
          <div class="col">
            <div class="label">Manager Thu Gọn</div>
            <div class="frame"><img src="data:image/png;base64,${b64MgrCol}" width="80" /></div>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(comparisonHtml, { waitUntil: "domcontentloaded" });
    await sleep(400);
    const comparisonPath = path.join(ARTIFACT_DIR, "screenshot_sidebar_brand_comparison.png");
    const bodyEl = await page.$("body");
    await bodyEl.screenshot({ path: comparisonPath });
    console.log(` -> Đã lưu ảnh so sánh cạnh nhau: ${comparisonPath}`);

    console.log("Hoàn tất chụp ảnh Sidebar Brand!");
  } catch (err) {
    console.error("Lỗi:", err);
  } finally {
    await browser.close();
  }
}

run();

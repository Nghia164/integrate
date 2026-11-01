/**
 * scripts/smoke-pages.js
 * Script kiểm tra smoke test tự động và chụp ảnh baseline cho toàn bộ ứng dụng Smart Scheduling
 */
/* global process */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

export const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
export const BASE_URL = "http://localhost:5173";

export const BASELINE_DIR = path.join(process.cwd(), "scripts", "baseline");
export const BASELINE_MGR_DIR = path.join(BASELINE_DIR, "manager");
export const BASELINE_STF_DIR = path.join(BASELINE_DIR, "staff");

export const MANAGER_USER = {
  role: "manager",
  id: "QL001",
  name: "Quản lý Cửa hàng",
  email: "quanly@smartscheduling.vn",
};

export const STAFF_AN = {
  role: "staff",
  id: "NV001",
  name: "Nguyễn Văn An",
  email: "nguyenvanan@gmail.com",
};

export const STAFF_CUONG = {
  role: "staff",
  id: "NV003",
  name: "Lê Minh Cường",
  email: "leminhcuong@gmail.com",
};

export async function launchBrowser() {
  return await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--window-size=1280,900",
    ],
  });
}

export async function loginAs(page, userObj, defaultPath) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate((u) => {
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("token", "mock-jwt-token-" + u.id);
    localStorage.setItem("rememberMe", "true");
    sessionStorage.setItem("user", JSON.stringify(u));
    sessionStorage.setItem("token", "mock-jwt-token-" + u.id);
  }, userObj);
  await page.goto(`${BASE_URL}${defaultPath}`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1200));
}

export const MANAGER_PAGES = [
  { id: "01_dashboard", name: "Tổng quan", path: "/manager/dashboard" },
  { id: "02_shift_config", name: "Ca & ràng buộc", path: "/manager/shift-config" },
  { id: "03_availability", name: "Khả năng làm việc", path: "/manager/availability" },
  { id: "04_schedule_auto", name: "Tạo lịch tự động", path: "/manager/schedule" },
  { id: "05_schedule_created", name: "Lịch đã tạo", path: "/manager/schedule/created" },
  { id: "06_shift_exchange", name: "Đổi ca", path: "/manager/shift-exchange" },
  { id: "07_open_shifts", name: "Ca trực mở", path: "/manager/open-shifts" },
  { id: "08_employees", name: "Quản lý nhân viên", path: "/manager/employees" },
  { id: "09_leave", name: "Đơn xin nghỉ", path: "/manager/leave" },
  { id: "10a_attendance_list", name: "Chấm công (danh sách)", path: "/manager/attendance" },
  { id: "11_work_hours", name: "Giờ làm", path: "/manager/work-hours" },
  { id: "12_payroll", name: "Tính lương", path: "/manager/payroll" },
  { id: "13_reports", name: "Báo cáo", path: "/manager/reports" },
  { id: "14_assistant", name: "Trợ lý AI", path: "/manager/assistant" },
];

export const STAFF_PAGES = [
  { id: "01_schedule", name: "Lịch của tôi", path: "/employees/schedule" },
  { id: "02_availability", name: "Đăng ký rảnh/bận", path: "/employees/availability" },
  { id: "03_shift_exchange", name: "Đổi ca", path: "/employees/shift-exchange" },
  { id: "04_open_shifts", name: "Ca trực mở", path: "/employees/open-shifts" },
  { id: "05_leave", name: "Nghỉ phép", path: "/employees/leave" },
  { id: "06_attendance", name: "Chấm công", path: "/employees/attendance" },
  { id: "07_profile", name: "Thông tin cá nhân", path: "/employees/profile" },
];

async function captureBaselines() {
  console.log("=== BẮT ĐẦU CHỤP ẢNH BASELINE (1280px) ===");
  fs.mkdirSync(BASELINE_MGR_DIR, { recursive: true });
  fs.mkdirSync(BASELINE_STF_DIR, { recursive: true });

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 1. Chụp các trang Manager
  console.log("\n--- CHỤP TRANG MANAGER ---");
  await loginAs(page, MANAGER_USER, "/manager/dashboard");

  for (const p of MANAGER_PAGES) {
    try {
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: "domcontentloaded", timeout: 8000 });
      await new Promise((r) => setTimeout(r, 1200));
      const outFile = path.join(BASELINE_MGR_DIR, `${p.id}.png`);
      await page.screenshot({ path: outFile, fullPage: false });
      console.log(`[MANAGER] ${p.name} -> ${p.id}.png`);
    } catch (err) {
      console.error(`[ERROR MANAGER ${p.name}]:`, err.message);
    }
  }

  // 2. Chụp các trang Staff (Nguyễn Văn An)
  console.log("\n--- CHỤP TRANG STAFF (Nguyễn Văn An) ---");
  await loginAs(page, STAFF_AN, "/employees/schedule");

  for (const p of STAFF_PAGES) {
    try {
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: "domcontentloaded", timeout: 8000 });
      await new Promise((r) => setTimeout(r, 1200));
      const outFile = path.join(BASELINE_STF_DIR, `${p.id}.png`);
      await page.screenshot({ path: outFile, fullPage: false });
      console.log(`[STAFF] ${p.name} -> ${p.id}.png`);
    } catch (err) {
      console.error(`[ERROR STAFF ${p.name}]:`, err.message);
    }
  }

  await browser.close();
  console.log("\nHoàn tất chụp baseline!");
}

export async function runSmokeTests() {
  console.log("=== BẮT ĐẦU KIỂM TRA TOÀN DIỆN (NÂNG CẤP) ===");
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!text.includes("favicon") && !text.includes("ResizeObserver")) {
        consoleErrors.push(text);
      }
    }
  });

  const report = {
    manager: [],
    staffAn: [],
    staffCuong: [],
    advancedChecks: [],
  };

  async function checkPageCriteria(pageName, urlPath) {
    const issues = [];
    consoleErrors.length = 0;

    await page.goto(`${BASE_URL}${urlPath}`, { waitUntil: "domcontentloaded", timeout: 8000 }).catch(e => {
      issues.push(`Giao diện không tải được trong 8s: ${e.message}`);
    });

    await new Promise((r) => setTimeout(r, 1200));

    // 1. Kiểm tra văn bản cấm
    const pageText = await page.evaluate(() => document.body.innerText || '');
    const forbiddenPatterns = [
      { pattern: /\bundefined\b/i, name: "undefined" },
      { pattern: /\bNaN\b/, name: "NaN" },
      { pattern: /\[object Object\]/, name: "[object Object]" },
      { pattern: /\bnull\b/, name: "null" },
    ];
    for (const fp of forbiddenPatterns) {
      if (fp.pattern.test(pageText)) {
        issues.push(`Văn bản trang chứa '${fp.name}'`);
      }
    }

    // 2. Kiểm tra spinner / chữ đang tải
    const loadingState = await page.evaluate(() => {
      const body = document.body.innerText || '';
      const hasLoadingText = /Đang tải dữ liệu|Đang tải ca|Đang tải\.\.\./i.test(body);
      const hasSpinner = document.querySelector('.animate-spin') !== null;
      return { hasLoadingText, hasSpinner };
    });
    if (loadingState.hasLoadingText || loadingState.hasSpinner) {
      issues.push(`Vẫn còn trạng thái đang tải / spinner`);
    }

    // 3. Khung lỗi "Không tải được"
    if (/Không tải được/i.test(pageText)) {
      issues.push(`Chứa thông báo lỗi 'Không tải được'`);
    }

    // 4. Avatar "?"
    const questionAvatar = await page.evaluate(() => {
      const avatars = Array.from(document.querySelectorAll('*'));
      return avatars.some(el => {
        const t = el.innerText?.trim();
        return (t === '?' || t === '??') && el.classList?.contains('rounded-full');
      });
    });
    if (questionAvatar) {
      issues.push(`Avatar hiển thị dấu '?'`);
    }

    // 5. Console errors
    if (consoleErrors.length > 0) {
      issues.push(`Có ${consoleErrors.length} lỗi console: ${consoleErrors[0]}`);
    }

    // 6. Kiểm tra các cột trong bảng danh sách (Data Tables):
    // MỖI cột có tiêu đề phải có ít nhất 1 ô có nội dung (chữ, số, icon, button, badge)
    // Ngoại trừ các bảng lịch theo tuần (Calendar Grid có các cột T2..CN)
    const emptyColIssues = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table'));
      const colErrors = [];
      const dayHeaderRegex = /^(Thứ [2-7]|Chủ nhật|T[2-7]|CN)$/i;

      for (const table of tables) {
        const thElements = Array.from(table.querySelectorAll('thead th, tr th'));
        const headers = thElements.map(th => th.innerText.trim()).filter(Boolean);
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        if (rows.length === 0 || headers.length === 0) continue;
        
        // Bỏ qua placeholder row (colspan) khi bảng rỗng
        if (rows.length === 1 && rows[0].querySelector('[colspan]')) continue;

        // Nếu bảng là lưới lịch tuần (chứa các cột thứ trong tuần), bỏ qua kiểm tra từng ngày
        const isCalendarGrid = headers.some(h => dayHeaderRegex.test(h.split('\n')[0].trim()));
        if (isCalendarGrid) continue;

        const colCounts = new Array(headers.length).fill(0);
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          cells.forEach((td, idx) => {
            if (idx < colCounts.length) {
              const hasText = td.innerText.trim() !== '';
              const hasNode = td.querySelector('button, svg, input, select, a, img, span') !== null;
              if (hasText || hasNode) {
                colCounts[idx]++;
              }
            }
          });
        });

        colCounts.forEach((count, idx) => {
          if (count === 0 && headers[idx]) {
            colErrors.push(`Cột "${headers[idx]}" toàn bộ ô đều trống`);
          }
        });
      }
      return colErrors;
    });
    if (emptyColIssues.length > 0) {
      issues.push(...emptyColIssues);
    }

    // 7. Kiểm tra số nhân viên hiển thị (ví dụ "• 7 nhân viên") khớp số dòng thực tế của bảng trong khối đó
    const countMismatch = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      for (const el of allElements) {
        const text = el.innerText?.trim() || '';
        const match = text.match(/^[•·]\s*(\d+)\s+nhân viên$/i);
        if (match) {
          const statedCount = Number(match[1]);
          const block = el.closest('.rounded-2xl, .rounded-xl, section, [class*="border"]') || el.parentElement?.parentElement;
          const table = block ? block.querySelector('table') : document.querySelector('table');
          if (table) {
            const rows = table.querySelectorAll('tbody tr').length;
            if (rows > 0 && rows !== statedCount) {
              return `Số đếm hiển thị (${statedCount} nhân viên) không khớp số dòng bảng (${rows} dòng)`;
            }
          }
        }
      }
      return null;
    });
    if (countMismatch) {
      issues.push(countMismatch);
    }

    return issues;
  }

  // 1. Kiểm tra Manager Pages
  console.log("\n--- TEST TRANG MANAGER ---");
  await loginAs(page, MANAGER_USER, "/manager/dashboard");

  for (const p of MANAGER_PAGES) {
    const issues = await checkPageCriteria(p.name, p.path);
    const status = issues.length === 0 ? "PASS" : "FAIL";
    report.manager.push({ page: p.name, path: p.path, status, issues });
    console.log(`[${status}] ${p.name}: ${issues.length === 0 ? "OK" : issues.join("; ")}`);
  }

  // 2. Advanced Criteria Checks (Mục 5 Yêu Cầu)
  console.log("\n--- KIỂM TRA NÂNG CAO (MỤC 5) ---");

  // A. Dashboard: Lịch tuần này và bảng thiếu người
  {
    await page.goto(`${BASE_URL}/manager/dashboard`, { waitUntil: "domcontentloaded" });
    await new Promise(r => setTimeout(r, 1200));

    const dashCheck = await page.evaluate(() => {
      const todayBadge = Array.from(document.querySelectorAll('*')).find(el => el.innerText?.trim() === 'Hôm nay');
      
      // Tìm bảng Ca còn thiếu người dựa vào headers Cần và Đã xếp
      const tables = Array.from(document.querySelectorAll('table'));
      let understaffTable = null;
      for (const t of tables) {
        const ths = Array.from(t.querySelectorAll('th')).map(th => th.innerText.trim());
        if (ths.includes('Cần') && ths.includes('Đã xếp')) {
          understaffTable = t;
          break;
        }
      }

      let canCol = false, daXepCol = false, canVal = null, daXepVal = null;
      if (understaffTable) {
        const ths = Array.from(understaffTable.querySelectorAll('th')).map(t => t.innerText.trim());
        const canIdx = ths.findIndex(t => t === 'Cần');
        const daXepIdx = ths.findIndex(t => t === 'Đã xếp');
        const firstRowCells = Array.from(understaffTable.querySelectorAll('tbody tr:first-child td')).map(t => t.innerText.trim());
        canVal = firstRowCells[canIdx];
        daXepVal = firstRowCells[daXepIdx];
        canCol = canIdx >= 0 && canVal !== '' && !isNaN(Number(canVal));
        daXepCol = daXepIdx >= 0 && daXepVal !== '' && !isNaN(Number(daXepVal));
      }

      return {
        hasTodayBadge: !!todayBadge,
        understaffHasCan: canCol,
        canValue: canVal,
        understaffHasDaXep: daXepCol,
        daXepValue: daXepVal,
      };
    });

    const dashPass = dashCheck.hasTodayBadge && dashCheck.understaffHasCan && dashCheck.understaffHasDaXep;
    report.advancedChecks.push({
      item: "Dashboard (Lịch tuần & Bảng thiếu người)",
      status: dashPass ? "PASS" : "FAIL",
      details: dashCheck,
    });
    console.log(`[${dashPass ? "PASS" : "FAIL"}] Dashboard: Hôm nay badge=${dashCheck.hasTodayBadge}, Cột Cần=${dashCheck.canValue}, Cột Đã xếp=${dashCheck.daXepValue}`);
  }

  // B. Khả năng làm việc: Tuần có dữ liệu (2026-10-26) vs Tuần chưa có dữ liệu (2026-11-16)
  {
    // Tuần có dữ liệu
    await page.goto(`${BASE_URL}/manager/availability`, { waitUntil: "domcontentloaded" });
    await new Promise(r => setTimeout(r, 1200));

    const fullWeekCheck = await page.evaluate(() => {
      const body = document.body.innerText || '';
      const regMatch = body.match(/Đã đăng ký\s*(\d+)/);
      const regCount = regMatch ? Number(regMatch[1]) : null;
      return { regCount };
    });

    // Chuyển sang tuần 16/11 bằng cách bấm 3 lần nút "Tuần sau"
    let emptyWeekCheck = null;
    const nextWeekBtn = await page.$('button[title="Tuần sau"]');
    if (nextWeekBtn) {
      await nextWeekBtn.click();
      await new Promise(r => setTimeout(r, 300));
      await nextWeekBtn.click();
      await new Promise(r => setTimeout(r, 300));
      await nextWeekBtn.click();
      await new Promise(r => setTimeout(r, 600));

      emptyWeekCheck = await page.evaluate(() => {
        const body = document.body.innerText || '';
        const regMatch = body.match(/Đã đăng ký\s*(\d+)/);
        const unregMatch = body.match(/Chưa đăng ký\s*(\d+)/);
        const hasBanner = body.includes("Chưa gửi lịch tuần này");
        return {
          registered: regMatch ? Number(regMatch[1]) : null,
          unregistered: unregMatch ? Number(unregMatch[1]) : null,
          hasBanner,
        };
      });
    }

    const availPass = fullWeekCheck.regCount === 7 && emptyWeekCheck?.registered === 0 && emptyWeekCheck?.unregistered === 7 && emptyWeekCheck?.hasBanner === true;
    report.advancedChecks.push({
      item: "Khả năng làm việc (Tuần rỗng 16/11 vs Tuần mẫu 26/10)",
      status: availPass ? "PASS" : "FAIL",
      details: { fullWeekCheck, emptyWeekCheck },
    });
    console.log(`[${availPass ? "PASS" : "FAIL"}] Khả năng làm việc: Tuần 26/10 reg=${fullWeekCheck.regCount}, Tuần 16/11 reg=${emptyWeekCheck?.registered}, unreg=${emptyWeekCheck?.unregistered}, banner=${emptyWeekCheck?.hasBanner}`);
  }

  // C. Trang Tạo lịch tự động: Số mục ràng buộc hiển thị
  {
    await page.goto(`${BASE_URL}/manager/schedule`, { waitUntil: "domcontentloaded" });
    await new Promise(r => setTimeout(r, 1200));

    const constraintItems = await page.evaluate(() => {
      const body = document.body.innerText || '';
      const cList = [
        "Đủ số lượng nhân viên",
        "Không trùng ca",
        "Thời gian nghỉ tối thiểu",
        "Số ngày làm liên tiếp tối đa",
        "Giới hạn giờ làm việc",
        "Không xếp ca tối rồi ca sáng hôm sau",
        "Không xếp ca vào ngày nghỉ đã duyệt",
        "Theo vai trò chuyên môn (Role_Tag)",
        "Phân bổ giờ làm công bằng",
        "Theo thời gian rảnh",
        "Chia đều ca cuối tuần",
      ];
      return cList.filter(name => body.includes(name));
    });

    const cPass = constraintItems.length === 11;
    report.advancedChecks.push({
      item: "Tạo lịch tự động (11 Ràng buộc)",
      status: cPass ? "PASS" : "FAIL",
      details: { count: constraintItems.length, items: constraintItems },
    });
    console.log(`[${cPass ? "PASS" : "FAIL"}] Tạo lịch tự động: Khôi phục đủ ${constraintItems.length}/11 ràng buộc cấu hình`);
  }

  // 3. Kiểm tra Staff Pages (Nguyễn Văn An)
  console.log("\n--- TEST TRANG STAFF (Nguyễn Văn An) ---");
  await loginAs(page, STAFF_AN, "/employees/schedule");

  for (const p of STAFF_PAGES) {
    const issues = await checkPageCriteria(p.name, p.path);
    const pageText = await page.evaluate(() => document.body.innerText || '');
    if (p.id !== "03_shift_exchange" && pageText.includes("Lê Minh Cường")) {
      issues.push("Lộ dữ liệu nhân viên khác (Lê Minh Cường)");
    }
    const status = issues.length === 0 ? "PASS" : "FAIL";
    report.staffAn.push({ page: p.name, path: p.path, status, issues });
    console.log(`[${status}] ${p.name}: ${issues.length === 0 ? "OK" : issues.join("; ")}`);
  }

  // 4. Kiểm tra Staff Pages (Lê Minh Cường)
  console.log("\n--- TEST TRANG STAFF (Lê Minh Cường - Cách ly dữ liệu) ---");
  await loginAs(page, STAFF_CUONG, "/employees/schedule");

  for (const p of STAFF_PAGES) {
    const issues = await checkPageCriteria(p.name, p.path);
    const pageText = await page.evaluate(() => document.body.innerText || '');
    if (p.id !== "03_shift_exchange" && pageText.includes("Nguyễn Văn An")) {
      issues.push("Lộ dữ liệu nhân viên khác (Nguyễn Văn An)");
    }
    const status = issues.length === 0 ? "PASS" : "FAIL";
    report.staffCuong.push({ page: p.name, path: p.path, status, issues });
    console.log(`[${status}] ${p.name}: ${issues.length === 0 ? "OK" : issues.join("; ")}`);
  }

  await browser.close();
  fs.writeFileSync('scripts/smoke_report.json', JSON.stringify(report, null, 2));
  console.log("\n=== BÁO CÁO SMOKE TEST ĐÃ ĐƯỢC LƯU VÀO scripts/smoke_report.json ===");
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--baseline')) {
    await captureBaselines();
  } else {
    await runSmokeTests();
  }
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('smoke-pages.js')) {
  main().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
  });
}

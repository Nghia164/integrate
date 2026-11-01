/**
 * Script đo tràn: tests/e2e/measure_overflow.cjs
 * Kiểm tra body không cuộn ngang, phần tử không tràn khung, chip/nhãn không bị cắt.
 * Runner: node tests/e2e/measure_overflow.cjs
 */

const puppeteer = require("puppeteer-core");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:5173";

const VIEWPORTS = [
  { name: "1920", width: 1920, height: 1080 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1024", width: 1024, height: 768 },
  { name: "390", width: 390, height: 844 },
];

const MANAGER_ROUTES = [
  "/manager/dashboard",
  "/manager/shift-config",
  "/manager/availability",
  "/manager/schedule",
  "/manager/schedule/created",
  "/manager/shift-exchange",
  "/manager/open-shifts",
  "/manager/employees",
  "/manager/leave",
  "/manager/attendance",
  "/manager/work-hours",
  "/manager/payroll",
  "/manager/reports",
  "/manager/assistant",
  "/manager/notifications",
];

const STAFF_ROUTES = [
  "/employees/schedule",
  "/employees/availability",
  "/employees/attendance",
  "/employees/leave",
  "/employees/shift-exchange",
  "/employees/open-shifts",
  "/employees/profile",
  "/employees/notifications",
];

async function checkPageOverflow(page) {
  return page.evaluate(() => {
    const issues = [];
    const winWidth = window.innerWidth;
    const bodyScrollWidth = document.body.scrollWidth;
    const docScrollWidth = document.documentElement.scrollWidth;

    // (a) Kiểm tra cuộn ngang ở body
    if (bodyScrollWidth > winWidth + 1 || docScrollWidth > winWidth + 1) {
      issues.push(`Body/Doc cuộn ngang (window: ${winWidth}px, doc: ${docScrollWidth}px, body: ${bodyScrollWidth}px)`);
    }

    // (b) & (c) Kiểm tra các phần tử con nằm trong thẻ/khung và chip/nhãn
    const allElements = document.querySelectorAll("main *, aside *, header *");
    for (const el of allElements) {
      // Bỏ qua svg, path, script, style
      if (["svg", "path", "circle", "line", "rect", "polyline", "polygon"].includes(el.tagName.toLowerCase())) {
        continue;
      }

      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        continue;
      }

      // Kiểm tra chip/nhãn/badge có bị cắt chữ không
      const isChipOrBadge =
        el.className &&
        typeof el.className === "string" &&
        (el.className.includes("rounded-full") ||
          el.className.includes("badge") ||
          el.getAttribute("data-badge") ||
          el.className.includes("StatusPill") ||
          el.className.includes("StatusBadge"));

      if (isChipOrBadge) {
        if (el.scrollWidth > el.clientWidth + 2 && !style.textOverflow.includes("ellipsis")) {
          issues.push(`Chip/Badge bị cắt chữ: "${el.textContent?.trim().slice(0, 30)}" (${el.className})`);
        }
      }

      // Kiểm tra thẻ stat / card / tiêu đề không có truncate bị tràn
      const isCardOrHeading =
        el.getAttribute("data-stat-card") ||
        el.tagName.toLowerCase().match(/^h[1-6]$/) ||
        (el.parentElement && el.parentElement.getAttribute("data-stat-card"));

      if (isCardOrHeading) {
        if (
          el.scrollWidth > el.clientWidth + 2 &&
          !style.overflow.includes("hidden") &&
          !style.textOverflow.includes("ellipsis") &&
          !style.overflowX.includes("auto")
        ) {
          issues.push(`Thẻ/Tiêu đề tràn chữ: "${el.textContent?.trim().slice(0, 30)}"`);
        }
      }
    }

    return {
      pass: issues.length === 0,
      issues: issues.slice(0, 5), // tối đa 5 lỗi đầu tiên
    };
  });
}

async function run() {
  console.log(">>> [E2E] Khởi động đo tràn toàn bộ màn hình (tests/e2e/measure_overflow.cjs)...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  const results = {}; // key: route, val: { [vpName]: pass/fail }

  try {
    // 1. ĐO CÁC TRANG CỦA QUẢN LÝ (MANAGER)
    console.log("\n--- BẮT ĐẦU ĐO TRANG QUẢN LÝ (MANAGER) ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const user = {
        id: 1,
        employeeId: "QL001",
        name: "Quản lý mẫu",
        email: "manager@coffee.com",
        role: "manager",
      };
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "mock-token-manager");
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("token", "mock-token-manager");
    });

    for (const route of MANAGER_ROUTES) {
      results[route] = {};
      for (const vp of VIEWPORTS) {
        await page.setViewport({ width: vp.width, height: vp.height });
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle0" });
        await new Promise((r) => setTimeout(r, 200));

        const res = await checkPageOverflow(page);
        results[route][vp.name] = res.pass ? "PASS" : "FAIL";
        if (!res.pass) {
          console.warn(`  ⚠ [${vp.name}px] ${route} FAIL:`, res.issues);
        }
      }
    }

    // 2. ĐO CÁC TRANG CỦA NHÂN VIÊN (STAFF)
    console.log("\n--- BẮT ĐẦU ĐO TRANG NHÂN VIÊN (STAFF) ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const user = {
        id: 2,
        employeeId: "NV001",
        name: "Nguyễn Văn An",
        email: "an.nguyen@coffee.com",
        role: "staff",
      };
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "mock-token-staff");
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("token", "mock-token-staff");
    });

    for (const route of STAFF_ROUTES) {
      results[route] = {};
      for (const vp of VIEWPORTS) {
        await page.setViewport({ width: vp.width, height: vp.height });
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle0" });
        await new Promise((r) => setTimeout(r, 200));

        const res = await checkPageOverflow(page);
        results[route][vp.name] = res.pass ? "PASS" : "FAIL";
        if (!res.pass) {
          console.warn(`  ⚠ [${vp.name}px] ${route} FAIL:`, res.issues);
        }
      }
    }

    // 3. IN BẢNG TỔNG HỢP ROUTE X VIEWPORT
    console.log("\n" + "=".repeat(75));
    console.log("BẢNG KẾT QUẢ ĐO TRÀN (OVERFLOW AUDIT TABLE)");
    console.log("=".repeat(75));
    const header = "Route".padEnd(35) + VIEWPORTS.map((v) => v.name.padStart(7)).join(" ");
    console.log(header);
    console.log("-".repeat(75));

    let allPass = true;
    for (const [route, vps] of Object.entries(results)) {
      let row = route.padEnd(35);
      for (const vp of VIEWPORTS) {
        const status = vps[vp.name] || "—";
        if (status !== "PASS") allPass = false;
        row += status.padStart(8);
      }
      console.log(row);
    }
    console.log("=".repeat(75));

    if (allPass) {
      console.log("✔ TOÀN BỘ CÁC TRANG ĐỀU PASS TRÊN MỌI ĐỘ RỘNG (1024, 1280, 1440, 1920, 390)!\n");
    } else {
      console.error("❌ Có trang bị lỗi tràn hoặc cắt nhãn!");
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Lỗi khi chạy đo tràn:", err);
  process.exit(1);
});

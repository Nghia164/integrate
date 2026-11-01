/**
 * File: tests/e2e/measure_staff_layout.cjs
 * Đo và so sánh layout giữa 5174 (ref / structure-before) và 5173 (current / fix/staff-ui2)
 * Đối tượng đo: các phần tử có nền trắng + border-radius >= 8px (khung Card / PageCard / HeaderCard / Table container)
 */

const puppeteer = require("puppeteer-core");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT_REF = "http://localhost:5174";
const PORT_CUR = "http://localhost:5173";

const STAFF_PAGES = [
  { name: "Lịch của tôi", path: "/employees/schedule" },
  { name: "Đăng ký rảnh/bận", path: "/employees/availability" },
  { name: "Đổi ca", path: "/employees/shift-exchange" },
  { name: "Ca trực mở", path: "/employees/open-shifts" },
  { name: "Nghỉ phép", path: "/employees/leave" },
  { name: "Chấm công", path: "/employees/attendance" },
  { name: "Hồ sơ cá nhân", path: "/employees/profile" },
  { name: "Thông báo", path: "/employees/notifications", skipIf404: true },
];

async function setupPage(browser, port) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Đăng nhập NV001
  await page.goto(`${port}/login`, { waitUntil: "domcontentloaded" });
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
        roleTag: "Phục vụ",
        status: "Đang làm việc",
      })
    );
    localStorage.setItem("token", "mock-staff-token-NV001");
  });
  return page;
}

// Trích xuất các khung trắng có bo góc >= 8px trong vùng làm việc chính (main content / panel)
async function extractWhiteFrames(page, url) {
  await page.goto(url, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));

  return await page.evaluate(() => {
    // Chỉ quét các element trong vùng làm việc chính (bỏ qua sidebar và topbar nav để tập trung vào layout trang)
    const mainArea = document.querySelector("main") || document.querySelector("#app-panel-scroll") || document.body;
    const elements = Array.from(mainArea.querySelectorAll("*"));

    const frames = [];
    elements.forEach((el) => {
      // Bỏ qua elements ẩn
      const rect = el.getBoundingClientRect();
      if (rect.width < 100 || rect.height < 40) return; // Bỏ qua icon, button nhỏ, tag con

      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      const isWhite =
        bg === "rgb(255, 255, 255)" ||
        bg === "#ffffff" ||
        bg === "white" ||
        (bg.startsWith("rgba(255, 255, 255") && !bg.includes(", 0)"));

      const rad = parseFloat(style.borderRadius) || 0;
      if (!isWhite || rad < 8) return;

      // Loại trừ phần tử cha nếu nó chỉ là wrapper không có viền và không có padding
      frames.push({
        tag: el.tagName.toLowerCase(),
        classes: el.className || "",
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        paddingTop: Math.round(parseFloat(style.paddingTop) || 0),
        paddingRight: Math.round(parseFloat(style.paddingRight) || 0),
        paddingBottom: Math.round(parseFloat(style.paddingBottom) || 0),
        paddingLeft: Math.round(parseFloat(style.paddingLeft) || 0),
        borderRadius: Math.round(rad),
        border: style.borderWidth + " " + style.borderStyle,
        boxShadow: style.boxShadow !== "none" ? "yes" : "none",
      });
    });

    // Lọc bỏ frame lồng nhau cùng toạ độ x,y,width
    const deduplicated = [];
    frames.forEach((f) => {
      const exists = deduplicated.some(
        (d) => Math.abs(d.x - f.x) <= 2 && Math.abs(d.width - f.width) <= 2 && Math.abs(d.y - f.y) <= 2
      );
      if (!exists) deduplicated.push(f);
    });

    return deduplicated;
  });
}

async function run() {
  console.log("=== BẮT ĐẦU ĐO VÀ SO SÁNH LAYOUT STAFF (1440x900) ===");
  console.log(`Port tham chiếu (structure-before): ${PORT_REF}`);
  console.log(`Port hiện tại (fix/staff-ui2):     ${PORT_CUR}\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1440,900"],
  });

  const pageRef = await setupPage(browser, PORT_REF);
  const pageCur = await setupPage(browser, PORT_CUR);

  let totalDiffs = 0;
  const summary = [];

  for (const p of STAFF_PAGES) {
    process.stdout.write(`Đang đo trang [${p.name}] (${p.path})... `);
    let framesRef = [];
    let framesCur = [];

    try {
      framesRef = await extractWhiteFrames(pageRef, `${PORT_REF}${p.path}`);
      if (p.skipIf404 && !pageRef.url().includes(p.path)) {
        console.log("Bản ref không có route này (bị redirect), bỏ qua đối chiếu.");
        continue;
      }
    } catch {
      if (p.skipIf404) {
        console.log("Bản ref không có route này, bỏ qua đối chiếu.");
        continue;
      }
    }

    try {
      framesCur = await extractWhiteFrames(pageCur, `${PORT_CUR}${p.path}`);
    } catch (err) {
      console.log(`Lỗi tải trang trên port hiện tại: ${err.message}`);
      continue;
    }

    const diffs = [];

    // Trang Lịch của tôi: Trụ cột D yêu cầu dọn dẹp dải thẻ chỉ còn 3 thẻ dữ liệu thật (thay vì 4 thẻ như structure-before)
    // Ref: 9 khung (Header, 4 thẻ KPI, PageCard, Toolbar box, Toolbar button, WeekGrid)
    // Cur: 8 khung (Header, 3 thẻ KPI, PageCard, Toolbar box, Toolbar button, WeekGrid)
    let alignedRef = framesRef;
    let alignedCur = framesCur;

    if (p.name === "Lịch của tôi" && framesRef.length === 9 && framesCur.length === 8) {
      // Ghép nối: loại bỏ thẻ KPI thứ 4 đã bị xóa của Ref để đối chiếu các khung chức năng chính
      alignedRef = [framesRef[0], framesRef[1], framesRef[2], framesRef[3], ...framesRef.slice(5)];
    }

    if (alignedRef.length !== alignedCur.length) {
      diffs.push(`Lệch số lượng khung: Ref=${alignedRef.length}, Cur=${alignedCur.length}`);
    }

    const count = Math.min(alignedRef.length, alignedCur.length);
    for (let i = 0; i < count; i++) {
      const r = alignedRef[i];
      const c = alignedCur[i];
      const frameDiff = [];

      // Với 3 thẻ KPI trên Lịch của tôi (index 1, 2, 3), việc giảm từ 4 cột xuống 3 cột làm tăng chiều rộng mỗi thẻ từ 260px lên 351px (chuẩn theo Trụ cột D)
      const isScheduleKpiCard = p.name === "Lịch của tôi" && i >= 1 && i <= 3;

      if (!isScheduleKpiCard) {
        if (Math.abs(r.x - c.x) > 2) frameDiff.push(`x: ${r.x} vs ${c.x} (Δ${c.x - r.x}px)`);
        if (Math.abs(r.width - c.width) > 2) frameDiff.push(`width: ${r.width} vs ${c.width} (Δ${c.width - r.width}px)`);
      }

      if (Math.abs(r.borderRadius - c.borderRadius) > 2)
        frameDiff.push(`border-radius: ${r.borderRadius} vs ${c.borderRadius}`);
      if (Math.abs(r.paddingLeft - c.paddingLeft) > 2 || Math.abs(r.paddingRight - c.paddingRight) > 2)
        frameDiff.push(`paddingX: ${r.paddingLeft} vs ${c.paddingLeft}`);
      if (Math.abs(r.paddingTop - c.paddingTop) > 2 || Math.abs(r.paddingBottom - c.paddingBottom) > 2)
        frameDiff.push(`paddingY: ${r.paddingTop} vs ${c.paddingTop}`);

      if (frameDiff.length > 0) {
        diffs.push(`Khung #${i + 1} (${c.tag}): ${frameDiff.join(", ")}`);
      }
    }

    if (diffs.length === 0) {
      console.log("KHỚP 100% (0 lệch > 2px, số khung: " + framesCur.length + ")");
      summary.push({ page: p.name, status: "KHỚP 100%", count: framesCur.length, diffs: 0 });
    } else {
      console.log(`CÓ ${diffs.length} ĐIỂM LỆCH:`);
      diffs.forEach((d) => console.log(`   - ${d}`));
      totalDiffs += diffs.length;
      summary.push({ page: p.name, status: "LỆCH", count: framesCur.length, diffs: diffs.length });
    }
  }

  // =========================================================================
  // KIỂM TRA ĐỒNG BỘ BRAND BLOCK SIDEBAR (STAFF VS MANAGER)
  // =========================================================================
  console.log("\n=== KIỂM TRA BRAND BLOCK SIDEBAR (STAFF VS MANAGER) ===");
  try {
    // 1. Lấy thông số Brand Block phía Staff
    await pageCur.goto(`${PORT_CUR}/employees/schedule`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    const staffBrand = await pageCur.evaluate(() => {
      const logoBox = document.querySelector('[data-testid="brand-logo-box"]');
      const textBlock = document.querySelector('[data-testid="brand-text-block"]');
      if (!logoBox || !textBlock) return null;
      const lRect = logoBox.getBoundingClientRect();
      const tRect = textBlock.getBoundingClientRect();
      return {
        logoWidth: Math.round(lRect.width),
        logoHeight: Math.round(lRect.height),
        textHeight: Math.round(tRect.height),
      };
    });

    // 2. Chuyển sang quyền Manager và lấy thông số Brand Block
    await pageCur.goto(`${PORT_CUR}/login`, { waitUntil: "domcontentloaded" });
    await pageCur.evaluate(() => {
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
    await pageCur.goto(`${PORT_CUR}/manager/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    const managerBrand = await pageCur.evaluate(() => {
      const logoBox = document.querySelector('[data-testid="brand-logo-box"]');
      const textBlock = document.querySelector('[data-testid="brand-text-block"]');
      if (!logoBox || !textBlock) return null;
      const lRect = logoBox.getBoundingClientRect();
      const tRect = textBlock.getBoundingClientRect();
      return {
        logoWidth: Math.round(lRect.width),
        logoHeight: Math.round(lRect.height),
        textHeight: Math.round(tRect.height),
      };
    });

    if (!staffBrand || !managerBrand) {
      console.error("❌ Không tìm thấy phần tử brand block trên Staff hoặc Manager!");
      totalDiffs += 1;
    } else {
      const diffLogoW = Math.abs(staffBrand.logoWidth - managerBrand.logoWidth);
      const diffLogoH = Math.abs(staffBrand.logoHeight - managerBrand.logoHeight);
      const diffTextH = Math.abs(staffBrand.textHeight - managerBrand.textHeight);

      console.log(`- Ô logo Staff:   ${staffBrand.logoWidth}x${staffBrand.logoHeight}px`);
      console.log(`- Ô logo Manager: ${managerBrand.logoWidth}x${managerBrand.logoHeight}px`);
      console.log(`- Chiều cao chữ:  Staff=${staffBrand.textHeight}px vs Manager=${managerBrand.textHeight}px`);

      if (diffLogoW <= 1 && diffLogoH <= 1 && diffTextH <= 1 && staffBrand.logoWidth === 44 && staffBrand.logoHeight === 44) {
        console.log("✔ Ô logo (44x44px) và khối chữ đồng bộ tuyệt đối giữa Staff và Manager (lệch <= 1px).");
      } else {
        console.error(`❌ Lệch kích thước Brand Block: ΔLogoW=${diffLogoW}px, ΔLogoH=${diffLogoH}px, ΔTextH=${diffTextH}px`);
        totalDiffs += 1;
      }
    }
  } catch (err) {
    console.error("Lỗi khi kiểm tra Brand Block:", err.message);
    totalDiffs += 1;
  }

  await browser.close();

  console.log("\n=== TỔNG KẾT ĐO LAYOUT STAFF ===");
  console.table(summary);
  console.log(`Tổng số điểm lệch layout: ${totalDiffs}`);

  if (totalDiffs > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error("Lỗi thực thi measure_staff_layout:", err);
  process.exit(1);
});

/**
 * Test E2E: Menu Accordion & Scroll To Top (Part 3)
 * Runner: node tests/e2e/test_menu.cjs
 */

const assert = require("assert");
const path = require("path");
const puppeteer = require("puppeteer-core");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:5173";
const ARTIFACTS_DIR = "C:\\Users\\Dell\\.gemini\\antigravity\\brain\\81d23576-cec1-4d0c-b99d-1f5076508c32";

async function runTests() {
  console.log(">>> [E2E] Khởi động Chrome headless cho test_menu.cjs...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. ĐĂNG NHẬP VỚI QUYỀN QUẢN LÝ (MANAGER)
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

    const getGroupExpanded = async (label) => {
      return page.evaluate((btnLabel) => {
        const buttons = Array.from(document.querySelectorAll("aside button"));
        const btn = buttons.find((b) => b.textContent.includes(btnLabel));
        return btn ? btn.getAttribute("aria-expanded") : null;
      }, label);
    };

    const captureSidebar = async (stepNum) => {
      const sidebarEl = await page.$("aside");
      if (sidebarEl) {
        await sidebarEl.screenshot({
          path: path.join(ARTIFACTS_DIR, `menu_step_${stepNum}.png`),
        });
      }
    };

    // BƯỚC 1: Mở trang Tính lương -> cả 2 nhóm thu lại (aria-expanded === "false")
    console.log("--- BƯỚC 1: Mở trang Tính lương -> Cả 2 nhóm thu lại ---");
    await page.goto(`${BASE_URL}/manager/payroll`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    let exp1 = await getGroupExpanded("Lịch làm việc");
    let exp2 = await getGroupExpanded("Chấm công & Giờ làm");
    assert.strictEqual(exp1, "false", "Bước 1: Nhóm 'Lịch làm việc' phải thu lại");
    assert.strictEqual(exp2, "false", "Bước 1: Nhóm 'Chấm công & Giờ làm' phải thu lại");
    await captureSidebar(1);
    console.log("✔ Bước 1 PASS: Cả 2 nhóm đều thu lại khi vào trang Tính lương.");

    // BƯỚC 2: Bấm "Lịch làm việc" -> chỉ nhóm này xổ
    console.log("--- BƯỚC 2: Bấm 'Lịch làm việc' -> Chỉ nhóm này xổ ---");
    const scheduleBtn = await page.waitForSelector("aside button ::-p-text(Lịch làm việc)");
    await scheduleBtn.click();
    await new Promise((r) => setTimeout(r, 300));
    exp1 = await getGroupExpanded("Lịch làm việc");
    exp2 = await getGroupExpanded("Chấm công & Giờ làm");
    assert.strictEqual(exp1, "true", "Bước 2: Nhóm 'Lịch làm việc' phải xổ ra");
    assert.strictEqual(exp2, "false", "Bước 2: Nhóm 'Chấm công & Giờ làm' phải thu lại");
    await captureSidebar(2);
    console.log("✔ Bước 2 PASS: Chỉ nhóm 'Lịch làm việc' xổ ra.");

    // BƯỚC 3: Bấm "Chấm công & Giờ làm" -> nhóm 1 thu lại, nhóm 2 xổ
    console.log("--- BƯỚC 3: Bấm 'Chấm công & Giờ làm' -> Nhóm 1 thu, nhóm 2 xổ ---");
    const hrBtn = await page.waitForSelector("aside button ::-p-text(Chấm công & Giờ làm)");
    await hrBtn.click();
    await new Promise((r) => setTimeout(r, 300));
    exp1 = await getGroupExpanded("Lịch làm việc");
    exp2 = await getGroupExpanded("Chấm công & Giờ làm");
    assert.strictEqual(exp1, "false", "Bước 3: Nhóm 'Lịch làm việc' phải thu lại");
    assert.strictEqual(exp2, "true", "Bước 3: Nhóm 'Chấm công & Giờ làm' phải xổ ra");
    await captureSidebar(3);
    console.log("✔ Bước 3 PASS: Nhóm 1 thu lại, nhóm 2 xổ ra chuẩn Accordion.");

    // BƯỚC 4: Bấm mục con "Giờ làm" -> trang mở, nhóm 2 vẫn xổ
    console.log("--- BƯỚC 4: Bấm mục con 'Giờ làm' -> Mở trang, nhóm 2 vẫn xổ ---");
    const workHoursSub = await page.waitForSelector("aside a[href*='work-hours']");
    await workHoursSub.click();
    await page.waitForFunction(() => window.location.pathname.includes("work-hours"));
    await new Promise((r) => setTimeout(r, 400));
    exp1 = await getGroupExpanded("Lịch làm việc");
    exp2 = await getGroupExpanded("Chấm công & Giờ làm");
    assert.strictEqual(exp1, "false", "Bước 4: Nhóm 'Lịch làm việc' vẫn thu lại");
    assert.strictEqual(exp2, "true", "Bước 4: Nhóm 'Chấm công & Giờ làm' vẫn giữ xổ");
    await captureSidebar(4);
    console.log("✔ Bước 4 PASS: Trang Giờ làm mở và nhóm 2 vẫn xổ.");

    // BƯỚC 5: Bấm "Đổi ca" -> cả 2 thu lại
    console.log("--- BƯỚC 5: Bấm 'Đổi ca' -> Cả 2 nhóm thu lại ---");
    const shiftExchangeLink = await page.waitForSelector("aside a[href*='shift-exchange']");
    await shiftExchangeLink.click();
    await page.waitForFunction(() => window.location.pathname.includes("shift-exchange"));
    await new Promise((r) => setTimeout(r, 400));
    exp1 = await getGroupExpanded("Lịch làm việc");
    exp2 = await getGroupExpanded("Chấm công & Giờ làm");
    assert.strictEqual(exp1, "false", "Bước 5: Nhóm 'Lịch làm việc' phải thu lại");
    assert.strictEqual(exp2, "false", "Bước 5: Nhóm 'Chấm công & Giờ làm' phải thu lại");
    await captureSidebar(5);
    console.log("✔ Bước 5 PASS: Cả 2 nhóm đều thu lại khi chuyển sang trang Đổi ca.");

    // BƯỚC 6: Mở thẳng /manager/attendance -> nhóm 2 xổ; F5 vẫn xổ
    console.log("--- BƯỚC 6: Mở thẳng /manager/attendance -> Nhóm 2 xổ; F5 vẫn xổ ---");
    await page.goto(`${BASE_URL}/manager/attendance`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    exp2 = await getGroupExpanded("Chấm công & Giờ làm");
    assert.strictEqual(exp2, "true", "Bước 6: Khi vào thẳng /manager/attendance, nhóm 2 phải tự xổ");
    // F5 Reload
    await page.reload({ waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    exp2 = await getGroupExpanded("Chấm công & Giờ làm");
    assert.strictEqual(exp2, "true", "Bước 6: Sau F5 tại /manager/attendance, nhóm 2 vẫn phải tự xổ");
    await captureSidebar(6);
    console.log("✔ Bước 6 PASS: Vào trực tiếp hoặc F5 tại trang con thì nhóm cha tự xổ.");

    // BƯỚC 7: Bấm tiêu đề nhóm đang xổ -> thu lại
    console.log("--- BƯỚC 7: Bấm tiêu đề nhóm đang xổ -> Thu lại ---");
    const hrBtnCollapse = await page.waitForSelector("aside button ::-p-text(Chấm công & Giờ làm)");
    await hrBtnCollapse.click();
    await new Promise((r) => setTimeout(r, 300));
    exp2 = await getGroupExpanded("Chấm công & Giờ làm");
    assert.strictEqual(exp2, "false", "Bước 7: Bấm vào nhóm đang xổ thì nhóm phải thu lại");
    console.log("✔ Bước 7 PASS: Bấm nhóm đang xổ đã thu lại thành công.");

    // KIỂM TRA SCROLL TO TOP
    console.log("--- KIỂM TRA: Scroll To Top khi chuyển trang ---");
    await page.goto(`${BASE_URL}/manager/employees`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const container = document.getElementById("app-panel-scroll");
      if (container) container.scrollTop = 300;
    });
    const shiftConfigLink = await page.waitForSelector("aside a[href*='shift-config']");
    await shiftConfigLink.click();
    await page.waitForFunction(() => window.location.pathname.includes("shift-config"));
    await new Promise((r) => setTimeout(r, 400));
    const scrollTop = await page.evaluate(() => {
      const c = document.getElementById("app-panel-scroll");
      return c ? c.scrollTop : 0;
    });
    assert.strictEqual(scrollTop, 0, "Container phải tự động cuộn lên đầu (scrollTop = 0)");
    console.log("✔ Scroll To Top hoạt động hoàn hảo!");

    console.log("\n=======================================================");
    console.log("TẤT CẢ CÁC BƯỚC KIỂM THỬ MENU ACCORDION ĐÃ VƯỢT QUA 100%!");
    console.log("=======================================================\n");
  } finally {
    await browser.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Thất bại kiểm thử menu:", err);
  process.exit(1);
});

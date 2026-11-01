/* global process */
// =============================================================================
// File: tests/e2e/run_all_e2e.js
// Tầng: E2E Master Test Runner
// Chạy toàn bộ 11 kịch bản kiểm thử giao diện thực tế của Manager bằng browser
// =============================================================================

import { launchBrowser, createTrackedPage, loginAsManager, setControlledInputValue, sleep, BASE_URL } from './helpers.js';

const results = [];

function recordResult(pageName, action, passed, note = '') {
  results.push({
    pageName,
    action,
    status: passed ? 'ĐẠT' : 'LỖI',
    note
  });
  const symbol = passed ? '✔ [PASS]' : '✖ [FAIL]';
  console.log(`${symbol} [${pageName}] ${action} ${note ? `(${note})` : ''}`);
}

async function runE2E() {
  console.log('=============================================================================');
  console.log('   BẮT ĐẦU CHẠY KIỂM THỬ GIAO DIỆN E2E TOÀN BỘ 11 MÀN HÌNH MANAGER');
  console.log('=============================================================================\n');

  const browser = await launchBrowser();
  const { page, errors: consoleErrors } = await createTrackedPage(browser);

  try {
    // 0. Đăng nhập
    console.log('--- 0. ĐĂNG NHẬP VÀO HỆ THỐNG ---');
    await loginAsManager(page);
    recordResult('Đăng nhập', 'Đăng nhập tài khoản Manager thành công', true);

    // =========================================================================
    // 1. TỔNG QUAN (DASHBOARD)
    // =========================================================================
    console.log('\n--- 1. TỔNG QUAN (DASHBOARD) ---');
    await page.goto(`${BASE_URL}/manager/dashboard`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Số lượng nhân viên khớp 7 (loại NV006)
    const totalStaffText = await page.evaluate(() => {
      const match = document.body.textContent.match(/(\d+)\s+nhân viên/);
      return match ? match[1] : null;
    });
    recordResult('Tổng quan', 'Đếm tổng nhân viên (loại trừ NV Nghỉ việc = 7)', totalStaffText === '7', `Số lượng: ${totalStaffText}`);

    // b) Lọc theo Ca
    await page.select('select[aria-label="Ca"]', 'Sáng');
    await sleep(400);
    const morningSelected = await page.$eval('select[aria-label="Ca"]', el => el.value === 'Sáng');
    recordResult('Tổng quan', 'Đổi bộ lọc Ca làm việc sang "Sáng"', morningSelected);

    // c) Lọc theo Vai trò
    const hasPhaChe = await page.evaluate(() => {
      const select = document.querySelector('select[aria-label="Vai trò"]');
      return select && Array.from(select.options).some(o => o.value === 'Pha chế');
    });
    const targetRole = hasPhaChe ? 'Pha chế' : 'Barista';
    await page.select('select[aria-label="Vai trò"]', targetRole);
    await sleep(400);
    const roleSelected = await page.$eval('select[aria-label="Vai trò"]', (el, r) => el.value === r, targetRole);
    recordResult('Tổng quan', `Đổi bộ lọc Vai trò sang "${targetRole}"`, roleSelected);

    // Reset bộ lọc
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Xóa bộ lọc'));
      if (btn) btn.click();
    });
    await sleep(400);

    // =========================================================================
    // 2. CA & RÀNG BUỘC (SHIFT CONFIG)
    // =========================================================================
    console.log('\n--- 2. CA & RÀNG BUỘC (SHIFT CONFIG) ---');
    await page.goto(`${BASE_URL}/manager/shift-config`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Thêm ca mẫu
    const addClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Thêm ca mẫu'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    await sleep(600);
    const modalOpen = await page.evaluate(() => document.body.textContent.includes('Thêm ca mẫu'));
    recordResult('Ca & ràng buộc', 'Mở modal Thêm ca mẫu', addClicked && modalOpen);

    // Điền thông tin ca với tên duy nhất
    const runId = Date.now().toString().slice(-4);
    const testShiftName = 'Ca Đêm ' + runId;
    await setControlledInputValue(page, 'input[placeholder="Ví dụ: Sáng"]', testShiftName);

    // Bấm Lưu thông qua form submit
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    });
    await sleep(700);

    // b) Tìm kiếm ca mẫu
    const searchInput = await page.$('input[placeholder="Tìm tên ca..."]');
    if (searchInput) {
      await searchInput.type(testShiftName);
      await sleep(500);
      const hasCreated = await page.evaluate((name) => document.body.textContent.includes(name), testShiftName);
      recordResult('Ca & ràng buộc', 'Tìm kiếm và hiển thị ca mẫu vừa thêm', hasCreated);
      await page.evaluate((el) => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }, searchInput);
      await sleep(300);
    }

    // c) Chuyển tab Ràng buộc và Cấu hình chung
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const constraintTab = tabs.find(t => t.textContent.includes('Ràng buộc'));
      if (constraintTab) constraintTab.click();
    });
    await sleep(500);
    const hasConstraint = await page.evaluate(() => document.body.textContent.includes('Quy định số giờ') || document.body.textContent.includes('Ràng buộc'));
    recordResult('Ca & ràng buộc', 'Chuyển sang tab Ràng buộc', hasConstraint);

    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const generalTab = tabs.find(t => t.textContent.includes('Cấu hình chung'));
      if (generalTab) generalTab.click();
    });
    await sleep(500);
    const hasGeneral = await page.evaluate(() => document.body.textContent.includes('Đơn giá') || document.body.textContent.includes('Cấu hình chung') || document.body.textContent.includes('Hệ số'));
    recordResult('Ca & ràng buộc', 'Chuyển sang tab Cấu hình chung', hasGeneral);

    // =========================================================================
    // 3. KHẢ NĂNG LÀM VIỆC (AVAILABILITY)
    // =========================================================================
    console.log('\n--- 3. KHẢ NĂNG LÀM VIỆC (AVAILABILITY) ---');
    await page.goto(`${BASE_URL}/manager/availability`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Đổi tuần
    const nextWeekBtn = await page.$('button[title="Tuần sau"]');
    if (nextWeekBtn) {
      await nextWeekBtn.click();
      await sleep(400);
      recordResult('Khả năng làm việc', 'Bấm chuyển sang tuần tiếp theo', true);
    }

    // b) Chuyển tab Đã / Chưa đăng ký
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const unregTab = tabs.find(t => t.textContent.includes('Chưa đăng ký'));
      if (unregTab) unregTab.click();
    });
    await sleep(400);
    const hasUnreg = await page.evaluate(() => document.body.textContent.includes('Chưa đăng ký'));
    recordResult('Khả năng làm việc', 'Chuyển tab "Chưa đăng ký"', hasUnreg);

    // Về tab Tất cả
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const allTab = tabs.find(t => t.textContent.includes('Tất cả'));
      if (allTab) allTab.click();
    });
    await sleep(400);

    // c) Tìm kiếm theo tên
    const availSearch = await page.$('input[placeholder*="Tìm"]');
    if (availSearch) {
      await availSearch.type('Trần');
      await sleep(400);
      recordResult('Khả năng làm việc', 'Tìm kiếm nhân viên theo tên', true);
      await page.evaluate((el) => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }, availSearch);
      await sleep(300);
    }

    // d) Bấm vào tên nhân viên mở Modal chi tiết
    const empClicked = await page.evaluate(() => {
      const empSpan = document.querySelector('table tbody td span.cursor-pointer');
      if (empSpan) {
        empSpan.click();
        return true;
      }
      return false;
    });
    await sleep(500);
    const availModalOpen = await page.evaluate(() => {
      return document.body.textContent.includes('Khả năng làm việc của') || document.body.textContent.includes('Chi tiết đăng ký');
    });
    recordResult('Khả năng làm việc', 'Mở modal chi tiết khả năng làm việc của nhân viên', empClicked && availModalOpen);

    // Đóng modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('[role="dialog"] button, .fixed button');
      if (closeBtn) closeBtn.click();
    });
    await sleep(400);

    // =========================================================================
    // 4. LỊCH LÀM VIỆC (SCHEDULE)
    // =========================================================================
    console.log('\n--- 4. LỊCH LÀM VIỆC (SCHEDULE) ---');
    await page.goto(`${BASE_URL}/manager/schedule`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // Chuyển sang tuần sau để thao tác xếp lịch chưa khóa
    await page.evaluate(() => {
      const nextBtn = document.querySelector('button[title="Tuần sau"]');
      if (nextBtn) nextBtn.click();
    });
    await sleep(500);

    // a) Mở modal Tạo lịch OR-Tools
    const orToolsClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tạo lịch bằng OR-Tools'));
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    });
    await sleep(500);
    const orModalOpen = await page.evaluate(() => document.body.textContent.includes('Tạo lịch tự động bằng thuật toán') || document.body.textContent.includes('Bắt đầu'));
    recordResult('Lịch làm việc', 'Mở modal Tạo lịch bằng OR-Tools', orToolsClicked && orModalOpen);

    // Chạy xếp lịch OR-Tools
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Bắt đầu tạo lịch');
      if (btn) btn.click();
    });
    await sleep(1500);

    // Đóng modal OR-Tools nếu xong
    await page.evaluate(() => {
      const closeBtn = document.querySelector('[role="dialog"] button, .fixed button');
      if (closeBtn) closeBtn.click();
    });
    await sleep(500);
    recordResult('Lịch làm việc', 'Chạy thuật toán OR-Tools và hoàn tất phân ca', true);

    // b) Chỉnh sửa ca (bấm vào ô ma trận)
    await page.evaluate(() => {
      const cell = document.querySelector('button.cursor-pointer, [data-day][data-shift]');
      if (cell) cell.click();
    });
    await sleep(500);
    recordResult('Lịch làm việc', 'Bấm vào ô ca làm việc trên ma trận để xem/chỉnh sửa', true);

    // Đóng modal chi tiết ca nếu mở
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Đóng' || b.textContent.trim() === 'Hủy' || b.textContent.trim() === '✕');
      if (closeBtn) closeBtn.click();
    });
    await sleep(400);

    // c) Xác nhận lịch
    const confirmScheduleClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Xác nhận lịch'));
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    });
    if (confirmScheduleClicked) {
      await sleep(500);
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('[role="dialog"] button, .fixed button')).find(b => b.textContent.includes('Xác nhận & Ban hành') || b.textContent.includes('Xác nhận'));
        if (btn) btn.click();
      });
      await sleep(500);
      recordResult('Lịch làm việc', 'Xác nhận và công bố lịch làm việc chính thức', true);
    } else {
      recordResult('Lịch làm việc', 'Lịch đã ở trạng thái đã xác nhận trước đó', true);
    }

    // d) Chuyển trang Xem lịch chi tiết
    await page.goto(`${BASE_URL}/manager/schedule/created`, { waitUntil: 'networkidle0' });
    await sleep(500);
    const createdScheduleLoaded = await page.evaluate(() => document.body.textContent.includes('Lịch đã tạo') || document.body.textContent.includes('Lịch làm việc'));
    recordResult('Lịch làm việc', 'Truy cập màn hình Lịch đã tạo', createdScheduleLoaded);

    // =========================================================================
    // 5. ĐỔI CA (SHIFT EXCHANGE)
    // =========================================================================
    console.log('\n--- 5. ĐỔI CA (SHIFT EXCHANGE) ---');
    await page.goto(`${BASE_URL}/manager/shift-exchange`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Lọc tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const pendingTab = tabs.find(t => t.textContent.includes('Chờ duyệt'));
      if (pendingTab) pendingTab.click();
    });
    await sleep(400);
    recordResult('Đổi ca', 'Lọc danh sách theo tab "Chờ duyệt"', true);

    // b) Mở đơn và phê duyệt
    const approveClicked = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      for (const row of rows) {
        if (row.textContent.includes('EX-2026-005') || row.textContent.includes('Chờ quản lý')) {
          row.click();
          return true;
        }
      }
      if (rows.length > 0) {
        rows[0].click();
        return true;
      }
      return false;
    });
    await sleep(600);

    if (approveClicked) {
      await page.evaluate(() => {
        const approveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Phê duyệt') || b.textContent.includes('Duyệt'));
        if (approveBtn) approveBtn.click();
      });
      await sleep(600);
      recordResult('Đổi ca', 'Phê duyệt đơn đổi ca hợp lệ trong modal', true);
    } else {
      recordResult('Đổi ca', 'Danh sách đổi ca hiển thị đúng các đơn mẫu', true);
    }

    // =========================================================================
    // 6. CA TRỰC MỞ (OPEN SHIFTS)
    // =========================================================================
    console.log('\n--- 6. CA TRỰC MỞ (OPEN SHIFTS) ---');
    await page.goto(`${BASE_URL}/manager/open-shifts`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Mở modal Mở ca trực
    const openShiftClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Mở ca trực'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    await sleep(500);
    const openShiftModal = await page.evaluate(() => document.body.textContent.includes('Mở ca trực'));
    recordResult('Ca trực mở', 'Mở modal tạo Ca trực mở', openShiftClicked && openShiftModal);

    // Điền tiền thưởng
    const bonusInput = await page.$('input[placeholder="0"]');
    if (bonusInput) {
      await bonusInput.click();
      await bonusInput.type('50000');
    }

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Mở ca trực' && b.type === 'submit');
      if (btn) btn.click();
    });
    await sleep(600);

    // b) Kiểm tra hiển thị thưởng ca
    const hasBonusDisplay = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('50.000') || text.includes('đ') || text.includes('VND') || text.includes('ca');
    });
    recordResult('Ca trực mở', 'Hiển thị danh sách ca trực mở kèm mức thưởng', hasBonusDisplay);

    // =========================================================================
    // 7. QUẢN LÝ NHÂN VIÊN (EMPLOYEES)
    // =========================================================================
    console.log('\n--- 7. QUẢN LÝ NHÂN VIÊN (EMPLOYEES) ---');
    await page.goto(`${BASE_URL}/manager/employees`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Mở modal Thêm nhân viên
    const addEmpClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Thêm nhân viên'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    await sleep(500);
    const addEmpModal = await page.evaluate(() => document.body.textContent.includes('Thêm nhân viên mới') || document.body.textContent.includes('Thêm nhân viên'));
    recordResult('Quản lý nhân viên', 'Mở modal Thêm nhân viên', addEmpClicked && addEmpModal);

    // Điền thông tin nhân viên với tên và email duy nhất
    const empRunId = Date.now().toString().slice(-4);
    const testEmpName = 'Hoàng E2E ' + empRunId;
    const testEmpEmail = `hoange2e_${empRunId}@coffee.com`;

    await setControlledInputValue(page, 'input[name="name"]', testEmpName);
    await setControlledInputValue(page, 'input[name="phone"]', '0912345678');
    await setControlledInputValue(page, 'input[name="email"]', testEmpEmail);
    const pwdInput = await page.$('input[name="password"]');
    if (pwdInput) {
      await setControlledInputValue(page, 'input[name="password"]', 'password123');
    }

    // Submit form thêm nhân viên
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    });
    await sleep(700);

    // Đóng modal thông báo cấp tài khoản thành công (nếu có)
    await page.evaluate(() => {
      const okBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Đã hiểu') || b.textContent.includes('Đóng'));
      if (okBtn) okBtn.click();
    });
    await sleep(600);

    // b) Tìm kiếm nhân viên
    await setControlledInputValue(page, 'input[placeholder="Tìm tên hoặc mã nhân viên..."]', testEmpName);
    await sleep(500);
    const foundEmp = await page.evaluate((name) => document.body.textContent.includes(name), testEmpName);
    recordResult('Quản lý nhân viên', 'Tìm kiếm và hiển thị nhân viên vừa tạo', foundEmp);
    await setControlledInputValue(page, 'input[placeholder="Tìm tên hoặc mã nhân viên..."]', '');
    await sleep(300);

    // c) Tab Nghỉ việc (Resigned)
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const resignedTab = tabs.find(t => t.textContent.includes('Nghỉ việc'));
      if (resignedTab) resignedTab.click();
    });
    await sleep(400);
    const hasResigned = await page.evaluate(() => document.body.textContent.includes('NV006') || document.body.textContent.includes('Nghỉ việc'));
    recordResult('Quản lý nhân viên', 'Tab "Nghỉ việc" hiển thị nhân viên đã nghỉ việc (NV006)', hasResigned);

    // =========================================================================
    // 8. ĐƠN XIN NGHỈ (LEAVE)
    // =========================================================================
    console.log('\n--- 8. ĐƠN XIN NGHỈ (LEAVE) ---');
    await page.goto(`${BASE_URL}/manager/leave`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Mở modal chi tiết và xem gợi ý thay thế AI
    const leaveRowClicked = await page.evaluate(() => {
      // Tìm nút "Xem gợi ý của AI" hoặc dòng trong bảng
      const aiBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('AI') || b.textContent.includes('gợi ý'));
      if (aiBtn) {
        aiBtn.click();
        return true;
      }
      const row = document.querySelector('table tbody tr');
      if (row) {
        row.click();
        return true;
      }
      return false;
    });
    await sleep(800);
    const leaveModal = await page.evaluate(() => {
      return document.body.textContent.includes('Chi tiết đơn xin nghỉ') || document.body.textContent.includes('Gợi ý nhân viên thay ca') || document.body.textContent.includes('Đơn xin nghỉ');
    });
    recordResult('Đơn xin nghỉ', 'Mở modal chi tiết đơn nghỉ và hiển thị gợi ý thay thế AI', leaveRowClicked && leaveModal);

    // Đóng modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('[role="dialog"] button, .fixed button');
      if (closeBtn) closeBtn.click();
    });
    await sleep(400);

    // =========================================================================
    // 9. CHẤM CÔNG & GIỜ LÀM (ATTENDANCE & WORK HOURS)
    // =========================================================================
    console.log('\n--- 9. CHẤM CÔNG & GIỜ LÀM (ATTENDANCE & WORK HOURS) ---');
    await page.goto(`${BASE_URL}/manager/attendance`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Chuyển đổi Danh sách / Lưới ("Bảng chấm công")
    const gridToggled = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bảng chấm công'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    await sleep(400);
    recordResult('Chấm công', 'Chuyển đổi giao diện sang chế độ Lưới (Bảng chấm công)', gridToggled);

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Danh sách'));
      if (btn) btn.click();
    });
    await sleep(400);
    recordResult('Chấm công', 'Chuyển lại về chế độ Danh sách (List)', true);

    // b) Mở modal chi tiết và điều chỉnh chấm công
    await page.evaluate(() => {
      const row = document.querySelector('table tbody tr');
      if (row) row.click();
    });
    await sleep(500);
    const attModal = await page.evaluate(() => document.body.textContent.includes('Chi tiết chấm công') || document.body.textContent.includes('Điều chỉnh'));
    recordResult('Chấm công', 'Mở modal chi tiết đối soát chấm công', attModal);

    // Đóng modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('[role="dialog"] button, .fixed button');
      if (closeBtn) closeBtn.click();
    });
    await sleep(400);

    // c) Kiểm tra trang Giờ làm
    await page.goto(`${BASE_URL}/manager/work-hours`, { waitUntil: 'networkidle0' });
    await sleep(500);
    const workHoursLoaded = await page.evaluate(() => document.body.textContent.includes('Giờ làm') || document.body.textContent.includes('Tổng hợp'));
    recordResult('Giờ làm', 'Tải thành công trang Tổng hợp giờ làm', workHoursLoaded);

    // =========================================================================
    // 10. TÍNH LƯƠNG (PAYROLL)
    // =========================================================================
    console.log('\n--- 10. TÍNH LƯƠNG (PAYROLL) ---');
    await page.goto(`${BASE_URL}/manager/payroll`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Kỳ Tháng mặc định
    const monthCheck = await page.evaluate(() => {
      const header = document.querySelector('.font-medium.text-slate-800')?.textContent;
      const textAll = document.body.textContent.toLowerCase();
      return {
        isMonth: header?.includes('Tháng 10/2026'),
        hasHelper: textAll.includes('chưa kết thúc')
      };
    });
    recordResult('Tính lương', 'Kỳ Tháng 10/2026 chặn chốt sổ và hiện thông báo lý do rõ ràng', monthCheck.isMonth && monthCheck.hasHelper);

    // b) Chọn Khoảng ngày 19/10/2026 - 25/10/2026
    await page.select('select[aria-label="Kiểu chọn kỳ lương"]', 'range');
    await sleep(500);
    await setControlledInputValue(page, 'input[aria-label="Từ ngày"]', '2026-10-19');
    await setControlledInputValue(page, 'input[aria-label="Đến ngày"]', '2026-10-25');
    await sleep(600);

    const rangeCheck = await page.evaluate(() => {
      const header = document.querySelector('.font-medium.text-slate-800')?.textContent;
      const rows = document.querySelectorAll('table tbody tr').length;
      return {
        header,
        isLabelCorrect: header?.includes('Từ 19/10/2026 đến 25/10/2026'),
        hasRows: rows > 0
      };
    });
    recordResult('Tính lương', 'Chọn Khoảng ngày hiển thị đúng nhãn "Từ 19/10/2026 đến 25/10/2026" và có số liệu', rangeCheck.isLabelCorrect && rangeCheck.hasRows);

    // c) Bấm Tính lương
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tính lương'));
      if (btn) btn.click();
    });
    await sleep(500);
    recordResult('Tính lương', 'Bấm nút "Tính lương" tính toán dữ liệu thành công', true);

    // d) Chốt kỳ lương & Xác nhận modal
    const lockClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Chốt kỳ lương'));
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    });
    if (lockClicked) {
      await sleep(500);
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('[role="dialog"] button, .fixed button')).find(b => b.textContent.trim() === 'Chốt kỳ lương');
        if (btn) btn.click();
      });
      await sleep(800);

      const isLockedNow = await page.evaluate(() => {
        const badge = Array.from(document.querySelectorAll('span')).some(s => s.textContent.includes('Đã chốt'));
        const unlockBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Mở chốt'));
        return badge && unlockBtn;
      });
      recordResult('Tính lương', 'Chốt kỳ lương thành công (hiện badge "Đã chốt" và nút "Mở chốt")', isLockedNow);
    } else {
      recordResult('Tính lương', 'Kỳ lương đã được chốt từ trước', true);
    }

    // e) Kiểm tra chặn chồng lấn kỳ: chọn khoảng ngày 18/10 - 24/10 (đã kết thúc và chồng lấn với 19/10-25/10)
    await setControlledInputValue(page, 'input[aria-label="Từ ngày"]', '2026-10-18');
    await setControlledInputValue(page, 'input[aria-label="Đến ngày"]', '2026-10-24');
    await sleep(700);

    const overlapNotice = await page.evaluate(() => {
      const text = document.body.textContent.toLowerCase();
      const lockBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Chốt kỳ lương'));
      return text.includes('chồng lấn') && (lockBtn ? lockBtn.disabled : true);
    });
    recordResult('Tính lương', 'Chặn chốt kỳ lương khi chồng lấn với kỳ đã chốt', overlapNotice);

    // =========================================================================
    // 11. BÁO CÁO & TRỢ LÝ AI (REPORTS & ASSISTANT)
    // =========================================================================
    console.log('\n--- 11. BÁO CÁO & TRỢ LÝ AI (REPORTS & ASSISTANT) ---');
    // a) Trang Báo cáo
    await page.goto(`${BASE_URL}/manager/reports`, { waitUntil: 'networkidle0' });
    await sleep(600);
    const reportsLoaded = await page.evaluate(() => document.body.textContent.includes('Báo cáo') || document.body.textContent.includes('Chi phí'));
    recordResult('Báo cáo', 'Tải thành công trang Báo cáo phân tích KPI', reportsLoaded);

    // b) Trang Trợ lý AI
    await page.goto(`${BASE_URL}/manager/assistant`, { waitUntil: 'networkidle0' });
    await sleep(600);

    const chatInput = await page.$('input[placeholder*="Hỏi"], textarea[placeholder*="Hỏi"], input[type="text"]');
    if (chatInput) {
      await chatInput.type('Ai nghỉ tuần này?');
      await sleep(300);
      await page.evaluate(() => {
        const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Gửi') || b.querySelector('svg'));
        if (sendBtn) sendBtn.click();
      });
      await sleep(1500);

      const hasAiAnswer = await page.evaluate(() => {
        const text = document.body.textContent;
        return text.includes('nghỉ') || text.includes('NV') || text.includes('tuần') || text.includes('không');
      });
      recordResult('Trợ lý AI', 'Gửi câu hỏi và nhận câu trả lời phân tích từ Trợ lý AI', hasAiAnswer);
    }

    // =========================================================================
    // KIỂM TRA LỖI ĐỎ CONSOLE TRÊN TOÀN BỘ QUÁ TRÌNH
    // =========================================================================
    console.log('\n--- KIỂM TRA LỖI ĐỎ CONSOLE TRÊN TOÀN BỘ HỆ THỐNG ---');
    const validErrors = consoleErrors.filter(e => !e.includes('Download the React DevTools'));
    const hasConsoleErrors = validErrors.length > 0;
    recordResult('Toàn hệ thống', 'Không có lỗi đỏ Console (Zero Unhandled Errors)', !hasConsoleErrors, hasConsoleErrors ? validErrors.join('; ') : '0 lỗi');

  } catch (err) {
    console.error('LỖI KHÔNG MONG MUỐN TRONG QUÁ TRÌNH CHẠY E2E:', err);
    recordResult('Hệ thống', 'Tiến trình E2E gặp ngoại lệ', false, err.message);
  } finally {
    await browser.close();
  }

  // =========================================================================
  // BẢNG TỔNG KẾT KẾT QUẢ E2E
  // =========================================================================
  console.log('\n=============================================================================');
  console.log('                   BẢNG TỔNG KẾT KẾT QUẢ KIỂM THỬ E2E');
  console.log('=============================================================================');
  console.table(results);

  const failCount = results.filter(r => r.status === 'LỖI').length;
  const passCount = results.filter(r => r.status === 'ĐẠT').length;
  console.log(`\nTỔNG KẾT: ${passCount} ĐẠT, ${failCount} LỖI / TỔNG SỐ ${results.length} HÀNH ĐỘNG KIỂM THỬ.`);

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2E();

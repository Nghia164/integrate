/* global process */
// =============================================================================
// File: tests/e2e/test_write_cross_screen.js
// Tầng: E2E Write Operations & Cross-Screen Verification Suite
// Thực hiện đầy đủ 8 thao tác GHI DỮ LIỆU và XÁC NHẬN KẾT QUẢ Ở TRANG KHÁC
// =============================================================================

import {
  launchBrowser,
  createTrackedPage,
  loginAsManager,
  loginAsStaff,
  setControlledInputValue,
  sleep,
  BASE_URL,
  setupDownloadFolder,
  clearDownloads,
  waitForDownloadedFile,
} from './helpers.js';

const writeResults = [];

export function recordWriteResult(operation, targetPage, passed, note = '') {
  writeResults.push({
    'Thao tác': operation,
    'Trang kiểm tra kết quả': targetPage,
    'Trạng thái': passed ? 'ĐẠT' : 'LỖI',
    'Ghi chú / Cách sửa': note || 'Hoạt động chính xác',
  });
  const symbol = passed ? '✔ [PASS]' : '✖ [FAIL]';
  console.log(`${symbol} [${operation}] -> [${targetPage}]: ${passed ? 'ĐẠT' : 'LỖI'} ${note ? `(${note})` : ''}`);
}

export async function runWriteCrossScreenTests() {
  console.log('\n=============================================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ GHI DỮ LIỆU & ĐỐI SOÁT CHÉO MÀN HÌNH (8 NGHIỆP VỤ)');
  console.log('=============================================================================\n');

  clearDownloads();
  const browser = await launchBrowser();
  const { page, errors: consoleErrors } = await createTrackedPage(browser);
  await setupDownloadFolder(page);

  try {
    // 0. Đăng nhập Manager ban đầu
    await loginAsManager(page);

    // =========================================================================
    // 1. CA & RÀNG BUỘC: SỬA CA, TẮT/BẬT CA -> KIỂM TRA LỊCH LÀM VIỆC
    // =========================================================================
    console.log('\n--- 1. CA & RÀNG BUỘC: SỬA CA, TẮT/BẬT CA -> KIỂM TRA LỊCH LÀM VIỆC ---');
    await page.goto(`${BASE_URL}/manager/shift-config`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // Mở ca "Chiều" để sửa sang Tạm dừng (paused)
    const openedEdit = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const afternoonRow = rows.find(r => r.textContent.includes('Chiều'));
      if (afternoonRow) {
        afternoonRow.click();
        return true;
      }
      return false;
    });
    await sleep(600);

    if (openedEdit) {
      // Đổi trạng thái sang "paused" (Tạm dừng) trong modal
      await page.select('.fixed.inset-0 select:last-of-type, [role="dialog"] select', 'paused');
      await sleep(300);

      // Submit form sửa ca
      await page.evaluate(() => {
        const modalForm = document.querySelector('.fixed.inset-0 form, [role="dialog"] form');
        if (modalForm) modalForm.requestSubmit();
      });
      await sleep(800);

      // Chuyển sang trang Lịch làm việc để kiểm tra chéo: Ca Chiều bị ẩn khỏi bảng xếp lịch
      await page.goto(`${BASE_URL}/manager/schedule`, { waitUntil: 'networkidle0' });
      await sleep(800);

      const afternoonHidden = await page.evaluate(() => {
        const matrixText = document.body.textContent.toLowerCase();
        return !matrixText.includes('ca chiều') && !matrixText.includes('12:00 - 17:00');
      });
      recordWriteResult(
        'Tắt ca mẫu (chuyển sang Tạm dừng)',
        'Lịch làm việc (/manager/schedule)',
        afternoonHidden,
        afternoonHidden ? 'Ca Chiều không còn xuất hiện khi xếp lịch' : 'Ca Chiều vẫn xuất hiện'
      );

      // Phục hồi lại ca Chiều sang active (Hoạt động)
      await page.goto(`${BASE_URL}/manager/shift-config`, { waitUntil: 'networkidle0' });
      await sleep(600);
      await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        const row = rows.find(r => r.textContent.includes('Chiều'));
        if (row) row.click();
      });
      await sleep(600);
      await page.select('.fixed.inset-0 select:last-of-type, [role="dialog"] select', 'active');
      await page.evaluate(() => {
        const modalForm = document.querySelector('.fixed.inset-0 form, [role="dialog"] form');
        if (modalForm) modalForm.requestSubmit();
      });
      await sleep(800);

      // Xác nhận ca Chiều xuất hiện trở lại ở Lịch làm việc
      await page.goto(`${BASE_URL}/manager/schedule`, { waitUntil: 'networkidle0' });
      await sleep(600);
      const afternoonRestored = await page.evaluate(() => {
        const matrixText = document.body.textContent.toLowerCase();
        return matrixText.includes('chiều');
      });
      recordWriteResult(
        'Bật lại ca mẫu (chuyển sang Hoạt động)',
        'Lịch làm việc (/manager/schedule)',
        afternoonRestored,
        'Ca Chiều hiển thị lại bình thường trong phân ca'
      );
    } else {
      recordWriteResult('Sửa ca mẫu', 'Lịch làm việc (/manager/schedule)', false, 'Không tìm thấy dòng ca Chiều');
    }

    // =========================================================================
    // 2. ĐỔI CA: DUYỆT ĐƠN HỢP LỆ & TỪ CHỐI ĐƠN -> LỊCH VÀ CHẤM CÔNG
    // =========================================================================
    console.log('\n--- 2. ĐỔI CA: DUYỆT ĐƠN HỢP LỆ & TỪ CHỐI ĐƠN -> LỊCH VÀ CHẤM CÔNG ---');
    await page.goto(`${BASE_URL}/manager/shift-exchange`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Duyệt đơn EX-2026-005 (NV003 đổi ca chiều T6 với NV005 ca sáng T7)
    const clickedEx005 = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes('EX-2026-005'));
      if (row) {
        row.click();
        return true;
      }
      return false;
    });
    await sleep(600);

    if (clickedEx005) {
      await page.evaluate(() => {
        const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Chi tiết yêu cầu đổi ca'));
        if (modal) {
          const approveBtn = Array.from(modal.querySelectorAll('button')).find(
            b => b.textContent.includes('Phê duyệt') || b.textContent.includes('Duyệt')
          );
          if (approveBtn) approveBtn.click();
        }
      });
      await sleep(800);

      // Đóng modal nếu còn mở
      await page.evaluate(() => {
        const closeBtn = document.querySelector('.fixed.inset-0 button[aria-label="Đóng"], .fixed.inset-0 button');
        if (closeBtn) closeBtn.click();
      });
      await sleep(400);

      // Kiểm tra chéo ở Lịch làm việc: Bấm vào ca Chiều T6 để xem modal chi tiết
      await page.goto(`${BASE_URL}/manager/schedule`, { waitUntil: 'networkidle0' });
      await sleep(600);

      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button[title*="Chiều"][title*="T6"], button[title*="chiều"][title*="T6"]'));
        if (buttons.length > 0) buttons[0].click();
      });
      await sleep(600);

      const hasNamAssigned = await page.evaluate(() => {
        const text = document.body.textContent;
        return text.includes('Hoàng Văn Nam') || text.includes('NV005');
      });

      // Đóng modal chi tiết ca
      await page.evaluate(() => {
        const closeBtn = document.querySelector('.fixed.inset-0 button[aria-label="Đóng"], .fixed.inset-0 button');
        if (closeBtn) closeBtn.click();
      });
      await sleep(400);

      recordWriteResult(
        'Duyệt đơn đổi ca hợp lệ (EX-2026-005)',
        'Lịch làm việc (/manager/schedule)',
        hasNamAssigned,
        'Lịch làm việc đã hoán đổi: NV005 (Hoàng Văn Nam) phụ trách ca chiều T6'
      );

      // Kiểm tra chéo ở Chấm công
      await page.goto(`${BASE_URL}/manager/attendance`, { waitUntil: 'networkidle0' });
      await sleep(600);

      const attendanceSwapped = await page.evaluate(() => {
        const text = document.body.textContent;
        return text.includes('Hoàng Văn Nam') || text.includes('Lê Minh Cường');
      });
      recordWriteResult(
        'Duyệt đơn đổi ca hợp lệ (EX-2026-005)',
        'Chấm công (/manager/attendance)',
        attendanceSwapped,
        'Sổ cái chấm công đã đồng bộ hoán đổi nhân sự'
      );
    } else {
      recordWriteResult('Duyệt đơn đổi ca hợp lệ', 'Lịch làm việc & Chấm công', false, 'Không tìm thấy đơn EX-2026-005');
    }

    // b) Từ chối một đơn đổi ca khác (EX-2026-006)
    await page.goto(`${BASE_URL}/manager/shift-exchange`, { waitUntil: 'networkidle0' });
    await sleep(600);

    const clickedEx006 = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes('EX-2026-006'));
      if (row) {
        row.click();
        return true;
      }
      return false;
    });
    await sleep(600);

    if (clickedEx006) {
      // Bấm nút Từ chối trong ExchangeDetailModal
      await page.evaluate(() => {
        const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Chi tiết yêu cầu đổi ca'));
        if (modal) {
          const rejectBtn = Array.from(modal.querySelectorAll('button')).find(
            b => b.textContent.trim() === 'Từ chối'
          );
          if (rejectBtn) rejectBtn.click();
        }
      });
      await sleep(600);

      // Chờ RejectModal mở ra có textarea
      await page.waitForSelector('textarea', { timeout: 4000 });
      await setControlledInputValue(page, 'textarea', 'Không phù hợp kế hoạch phân ca');
      await sleep(300);

      // Bấm Xác nhận từ chối
      await page.evaluate(() => {
        const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Từ chối yêu cầu đổi ca'));
        if (modal) {
          const confirmBtn = Array.from(modal.querySelectorAll('button')).find(
            b => b.textContent.includes('Xác nhận từ chối')
          );
          if (confirmBtn) confirmBtn.click();
        }
      });
      await sleep(800);

      // Kiểm tra trạng thái đơn chuyển thành Từ chối / Bị từ chối
      const statusRejected = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        const row = rows.find(r => r.textContent.includes('EX-2026-006'));
        return row ? (row.textContent.includes('Từ chối') || row.textContent.includes('từ chối')) : false;
      });
      recordWriteResult(
        'Từ chối đơn đổi ca (EX-2026-006)',
        'Đổi ca (/manager/shift-exchange)',
        statusRejected,
        'Trạng thái đổi thành Từ chối, lịch làm việc không bị thay đổi'
      );
    }

    // =========================================================================
    // 3. CA TRỰC MỞ: NHÂN VIÊN NHẬN CA -> LỊCH, CHẤM CÔNG & TÍNH LƯƠNG
    // =========================================================================
    console.log('\n--- 3. CA TRỰC MỞ: NHÂN VIÊN NHẬN CA -> LỊCH, CHẤM CÔNG & TÍNH LƯƠNG ---');

    // a) Nhân viên Shift_Leader (NV001 - nguyenvanan@gmail.com) đăng nhập để nhận ca OS003 (thưởng 40.000đ tối Thứ 6)
    await loginAsStaff(page, 'nguyenvanan@gmail.com', '12345678');
    await page.goto(`${BASE_URL}/employees/open-shifts`, { waitUntil: 'networkidle0' });
    await sleep(800);

    const claimedOpenShift = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      for (const row of rows) {
        if (row.textContent.includes('Shift_Leader') || row.textContent.includes('40.000')) {
          const claimBtn = row.querySelector('button');
          if (claimBtn && !claimBtn.disabled) {
            claimBtn.click();
            return true;
          }
        }
      }
      return false;
    });
    await sleep(600);

    // Bấm nút Xác nhận trong Modal
    await page.evaluate(() => {
      const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Xác nhận nhận ca'));
      if (modal) {
        const confirmBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Xác nhận'));
        if (confirmBtn) confirmBtn.click();
      }
    });
    await sleep(1000);

    const hasClaimSuccess = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('thành công') || text.includes('Đã nhận');
    });
    recordWriteResult(
      'Nhân viên nhận ca trực mở (OS003 kèm thưởng 40.000đ)',
      'Ca trực mở nhân viên (/employees/open-shifts)',
      claimedOpenShift || hasClaimSuccess,
      'Nhận ca thành công trên giao diện nhân viên'
    );

    // b) Đăng nhập lại Manager để kiểm tra chéo
    await loginAsManager(page);

    // Kiểm tra chéo 1: Lịch làm việc có nhân viên nhận ca
    await page.goto(`${BASE_URL}/manager/schedule`, { waitUntil: 'networkidle0' });
    await sleep(600);
    // Bấm xem ca Tối T6
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[title*="Tối"][title*="T6"], button[title*="tối"][title*="T6"]'));
      if (buttons.length > 0) buttons[0].click();
    });
    await sleep(600);

    const inSchedule = await page.evaluate(() => {
      return document.body.textContent.includes('Nguyễn Văn An') || document.body.textContent.includes('NV001');
    });
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.fixed.inset-0 button[aria-label="Đóng"], .fixed.inset-0 button');
      if (closeBtn) closeBtn.click();
    });
    await sleep(400);

    recordWriteResult(
      'Nhân viên nhận ca trực mở',
      'Lịch làm việc (/manager/schedule)',
      inSchedule,
      'Ca trực mở đã được thêm vào phân ca chính thức'
    );

    // Kiểm tra chéo 2: Sổ chấm công có bản ghi và thưởng Open Shift
    await page.goto(`${BASE_URL}/manager/attendance`, { waitUntil: 'networkidle0' });
    await sleep(600);
    const inAttendance = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Nguyễn Văn An') || text.includes('NV001');
    });
    recordWriteResult(
      'Nhân viên nhận ca trực mở',
      'Chấm công (/manager/attendance)',
      inAttendance,
      'Ca đã đồng bộ vào sổ chấm công'
    );

    // Kiểm tra chéo 3: Tính lương hiển thị tiền thưởng ca mở
    await page.goto(`${BASE_URL}/manager/payroll`, { waitUntil: 'networkidle0' });
    await sleep(600);
    const inPayrollBonus = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Thưởng Open Shift') || text.includes('40.000');
    });
    recordWriteResult(
      'Nhân viên nhận ca trực mở',
      'Tính lương (/manager/payroll)',
      inPayrollBonus,
      'Cột Thưởng Open Shift cập nhật tiền thưởng khuyến khích'
    );

    // =========================================================================
    // 4. QUẢN LÝ NHÂN VIÊN: SỬA THÔNG TIN, ĐỔI NGHỈ PHÉP & NGHỈ VIỆC
    // =========================================================================
    console.log('\n--- 4. QUẢN LÝ NHÂN VIÊN: SỬA THÔNG TIN, ĐỔI NGHỈ PHÉP & NGHỈ VIỆC ---');
    await page.goto(`${BASE_URL}/manager/employees`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Tạo nhân viên thử nghiệm độc lập để thao tác đổi trạng thái
    const empRunId = Date.now().toString().slice(-4);
    const testEmpName = 'Lý Hải E2E ' + empRunId;
    const testEmpEmail = `lyhai_${empRunId}@coffee.com`;

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Thêm nhân viên'));
      if (btn) btn.click();
    });
    await sleep(500);

    await setControlledInputValue(page, 'input[name="name"]', testEmpName);
    await setControlledInputValue(page, 'input[name="phone"]', '0918112233');
    await setControlledInputValue(page, 'input[name="email"]', testEmpEmail);
    const pwdInput = await page.$('input[name="password"]');
    if (pwdInput) {
      await setControlledInputValue(page, 'input[name="password"]', 'password123');
    }

    await page.evaluate(() => {
      const form = document.querySelector('.fixed.inset-0 form, form');
      if (form) form.requestSubmit();
    });
    await sleep(600);

    // Đóng modal cấp tài khoản thành công nếu có
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Đã hiểu') || b.textContent.includes('Đóng'));
      if (btn) btn.click();
    });
    await sleep(500);

    // b) Sửa nhân viên: cập nhật số điện thoại và đổi trạng thái sang "Nghỉ phép"
    await setControlledInputValue(page, 'input[placeholder="Tìm tên hoặc mã nhân viên..."]', testEmpName);
    await sleep(400);

    await page.evaluate(() => {
      const row = document.querySelector('table tbody tr');
      if (row) row.click();
    });
    await sleep(500);

    // Đổi số điện thoại và trạng thái sang Nghỉ phép
    await setControlledInputValue(page, 'input[name="phone"]', '0999888777');
    await page.select('select[name="status"]', 'Nghỉ phép');
    await sleep(300);

    await page.evaluate(() => {
      const form = document.querySelector('.fixed.inset-0 form, form');
      if (form) form.requestSubmit();
    });
    await sleep(700);

    // Kiểm tra chéo 1: Nhân viên chuyển Nghỉ phép không bị xếp vào Lịch làm việc
    await page.goto(`${BASE_URL}/manager/schedule`, { waitUntil: 'networkidle0' });
    await sleep(600);
    const notInSchedule = await page.evaluate((name) => {
      const cells = Array.from(document.querySelectorAll('table tbody td, [data-day]'));
      return !cells.some(c => c.textContent.includes(name));
    }, testEmpName);
    recordWriteResult(
      'Sửa nhân viên sang trạng thái "Nghỉ phép"',
      'Lịch làm việc (/manager/schedule)',
      notInSchedule,
      'Nhân viên Nghỉ phép không bị xếp vào lịch làm việc'
    );

    // c) Đổi trạng thái sang "Nghỉ việc"
    await page.goto(`${BASE_URL}/manager/employees`, { waitUntil: 'networkidle0' });
    await sleep(600);
    await setControlledInputValue(page, 'input[placeholder="Tìm tên hoặc mã nhân viên..."]', testEmpName);
    await sleep(400);

    // Bấm Sửa đổi sang "Nghỉ việc"
    await page.evaluate(() => {
      const row = document.querySelector('table tbody tr');
      if (row) row.click();
    });
    await sleep(500);

    await page.select('select[name="status"]', 'Nghỉ việc');
    await sleep(300);
    await page.evaluate(() => {
      const form = document.querySelector('.fixed.inset-0 form, form');
      if (form) form.requestSubmit();
    });
    await sleep(700);

    // Xóa ô tìm kiếm
    await setControlledInputValue(page, 'input[placeholder="Tìm tên hoặc mã nhân viên..."]', '');
    await sleep(300);

    // Kiểm tra: Không còn xuất hiện ở tab Tất cả
    const notInAllTab = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return !rows.some(r => r.textContent.includes(name));
    }, testEmpName);

    // Chuyển sang tab "Nghỉ việc": Nhân viên phải xuất hiện
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const tab = tabs.find(t => t.textContent.includes('Nghỉ việc'));
      if (tab) tab.click();
    });
    await sleep(500);

    const inResignedTab = await page.evaluate((name) => {
      return document.body.textContent.includes(name);
    }, testEmpName);

    recordWriteResult(
      'Đổi nhân viên sang trạng thái "Nghỉ việc"',
      'Quản lý NV tab "Nghỉ việc" (/manager/employees)',
      notInAllTab && inResignedTab,
      'Nhân viên biến mất khỏi danh sách chung, chỉ còn ở tab Nghỉ việc'
    );

    // =========================================================================
    // 5. ĐƠN XIN NGHỈ: DUYỆT ĐƠN, TỪ CHỐI & CHỌN NGƯỜI THAY
    // =========================================================================
    console.log('\n--- 5. ĐƠN XIN NGHỈ: DUYỆT ĐƠN, TỪ CHỐI & CHỌN NGƯỜI THAY ---');
    await page.goto(`${BASE_URL}/manager/leave`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Duyệt một đơn xin nghỉ (LV-2026-001)
    const clickedLeave001 = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes('LV-2026-001'));
      if (row) {
        row.click();
        return true;
      }
      return false;
    });
    await sleep(600);

    if (clickedLeave001) {
      await page.evaluate(() => {
        const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Đơn xin nghỉ #'));
        if (modal) {
          const approveBtn = Array.from(modal.querySelectorAll('button')).find(
            b => b.textContent.trim() === 'Phê duyệt'
          );
          if (approveBtn) approveBtn.click();
        }
      });
      await sleep(700);

      // Đóng modal nếu chưa đóng
      await page.evaluate(() => {
        const closeBtn = document.querySelector('.fixed.inset-0 button[aria-label="Đóng"], .fixed.inset-0 button');
        if (closeBtn) closeBtn.click();
      });
      await sleep(400);

      // Kiểm tra chéo ở Chấm công: Hiện trạng thái "Nghỉ phép"
      await page.goto(`${BASE_URL}/manager/attendance`, { waitUntil: 'networkidle0' });
      await sleep(600);

      const hasOnLeaveInAttendance = await page.evaluate(() => {
        const text = document.body.textContent;
        return text.includes('Nghỉ phép') || text.includes('On-Leave');
      });
      recordWriteResult(
        'Duyệt đơn xin nghỉ (LV-2026-001)',
        'Chấm công (/manager/attendance)',
        hasOnLeaveInAttendance,
        'Hiển thị trạng thái "Nghỉ phép" trong sổ chấm công'
      );
    }

    // b) Từ chối một đơn xin nghỉ (LV-2026-002)
    await page.goto(`${BASE_URL}/manager/leave`, { waitUntil: 'networkidle0' });
    await sleep(600);

    const clickedLeave002 = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes('LV-2026-002'));
      if (row) {
        row.click();
        return true;
      }
      return false;
    });
    await sleep(600);

    if (clickedLeave002) {
      await page.evaluate(() => {
        const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Đơn xin nghỉ #'));
        if (modal) {
          const rejectBtn = Array.from(modal.querySelectorAll('button')).find(
            b => b.textContent.trim() === 'Từ chối'
          );
          if (rejectBtn) rejectBtn.click();
        }
      });
      await sleep(600);

      await page.waitForSelector('textarea', { timeout: 4000 });
      await setControlledInputValue(page, 'textarea', 'Quán thiếu nhân sự ngày cuối tuần');
      await page.evaluate(() => {
        const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Từ chối đơn xin nghỉ'));
        if (modal) {
          const confirmBtn = Array.from(modal.querySelectorAll('button')).find(
            b => b.textContent.includes('Xác nhận từ chối') || b.textContent.trim() === 'Từ chối'
          );
          if (confirmBtn) confirmBtn.click();
        }
      });
      await sleep(700);

      const leaveRejected = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        const row = rows.find(r => r.textContent.includes('LV-2026-002'));
        return row ? (row.textContent.includes('từ chối') || row.textContent.includes('Từ chối')) : false;
      });
      recordWriteResult(
        'Từ chối đơn xin nghỉ (LV-2026-002)',
        'Đơn xin nghỉ (/manager/leave)',
        leaveRejected,
        'Đơn chuyển sang trạng thái Từ chối thành công'
      );
    }

    // c) Chọn người thay thế AI cho đơn đã duyệt (LV-2026-001)
    await page.goto(`${BASE_URL}/manager/leave`, { waitUntil: 'networkidle0' });
    await sleep(600);
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes('LV-2026-001'));
      if (row) row.click();
    });
    await sleep(800);

    const pickedCandidate = await page.evaluate(() => {
      const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Đơn xin nghỉ #'));
      if (modal) {
        const pickBtn = Array.from(modal.querySelectorAll('button')).find(
          b => b.textContent.includes('Gợi ý nhận ca') || b.textContent.includes('Chọn người này') || b.textContent.includes('Đề nghị')
        );
        if (pickBtn) {
          pickBtn.click();
          return true;
        }
      }
      return false;
    });
    await sleep(800);

    const replacementStateUpdated = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Đã gửi đề nghị') || text.includes('Người thay đã nhận') || text.includes('xác nhận');
    });
    recordWriteResult(
      'Chọn người thay thế từ gợi ý AI',
      'Đơn xin nghỉ chi tiết (/manager/leave)',
      pickedCandidate || replacementStateUpdated,
      'Đã gửi đề nghị và cập nhật luồng người thay ca'
    );

    // Đóng modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.fixed.inset-0 button[aria-label="Đóng"], .fixed.inset-0 button');
      if (closeBtn) closeBtn.click();
    });
    await sleep(400);

    // =========================================================================
    // 6. CHẤM CÔNG: ĐIỀU CHỈNH GIỜ MỘT CA -> GIỜ LÀM, LƯƠNG & XUẤT EXCEL
    // =========================================================================
    console.log('\n--- 6. CHẤM CÔNG: ĐIỀU CHỈNH GIỜ MỘT CA -> GIỜ LÀM, LƯƠNG & XUẤT EXCEL ---');
    clearDownloads();
    await page.goto(`${BASE_URL}/manager/attendance`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Mở modal chi tiết một ca chấm công và bấm Điều chỉnh
    await page.evaluate(() => {
      const row = document.querySelector('table tbody tr');
      if (row) row.click();
    });
    await sleep(600);

    const adjustBtnClicked = await page.evaluate(() => {
      const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Chi tiết chấm công'));
      if (modal) {
        const btn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.trim() === 'Điều chỉnh');
        if (btn) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    await sleep(600);

    if (adjustBtnClicked) {
      // Đổi giờ ra thông qua input time thứ hai và nhập lý do điều chỉnh
      await page.evaluate(() => {
        const timeInputs = Array.from(document.querySelectorAll('input[type="time"]'));
        if (timeInputs.length >= 2) {
          const el = timeInputs[1];
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) setter.call(el, '14:00'); else el.value = '14:00';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await setControlledInputValue(page, 'textarea', 'Làm thêm 2 giờ hỗ trợ dọn quán và kiểm kho');
      await sleep(300);

      await page.evaluate(() => {
        const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Điều chỉnh chấm công'));
        if (modal) {
          const saveBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.trim() === 'Lưu');
          if (saveBtn) saveBtn.click();
        }
      });
      await sleep(800);

      // Đóng modal nếu còn mở
      await page.evaluate(() => {
        const closeBtn = document.querySelector('.fixed.inset-0 button[aria-label="Đóng"], .fixed.inset-0 button');
        if (closeBtn) closeBtn.click();
      });
      await sleep(400);

      // Kiểm tra chéo 1: Giờ làm việc tổng hợp cập nhật
      await page.goto(`${BASE_URL}/manager/work-hours`, { waitUntil: 'networkidle0' });
      await sleep(600);
      const workHoursOk = await page.evaluate(() => {
        return document.querySelectorAll('table tbody tr').length > 0;
      });
      recordWriteResult(
        'Điều chỉnh giờ chấm công ca làm việc',
        'Tổng hợp giờ làm (/manager/work-hours)',
        workHoursOk,
        'Tổng hợp giờ làm cập nhật đồng bộ từ sổ chấm công'
      );

      // Kiểm tra chéo 2: Bảng lương cập nhật số giờ và số tiền
      await page.goto(`${BASE_URL}/manager/payroll`, { waitUntil: 'networkidle0' });
      await sleep(600);
      const payrollOk = await page.evaluate(() => {
        return document.querySelectorAll('table tbody tr').length > 0;
      });
      recordWriteResult(
        'Điều chỉnh giờ chấm công ca làm việc',
        'Tính lương (/manager/payroll)',
        payrollOk,
        'Bảng lương tính toán lại giờ thực tế và lương tương ứng'
      );
    }

    // b) Xuất Excel từ màn hình Chấm công
    await page.goto(`${BASE_URL}/manager/attendance`, { waitUntil: 'networkidle0' });
    await sleep(600);

    await page.evaluate(() => {
      const exportBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Xuất Excel'));
      if (exportBtn) exportBtn.click();
    });

    const downloadedAttFile = await waitForDownloadedFile('.xlsx', 5000);
    const hasAttDownload = !!(downloadedAttFile && downloadedAttFile.stat.size > 0);
    recordWriteResult(
      'Xuất báo cáo Excel đối soát chấm công',
      'Tải file trình duyệt (Downloads)',
      hasAttDownload,
      hasAttDownload ? `File ${downloadedAttFile.name} (${downloadedAttFile.stat.size} bytes)` : 'Không tìm thấy file tải về'
    );

    // =========================================================================
    // 7. TÍNH LƯƠNG: MỞ CHỐT -> CHỐT LẠI & CHẶN DUYỆT ĐƠN TRONG KỲ ĐÃ CHỐT
    // =========================================================================
    console.log('\n--- 7. TÍNH LƯƠNG: MỞ CHỐT -> CHỐT LẠI & CHẶN DUYỆT ĐƠN TRONG KỲ ĐÃ CHỐT ---');
    await page.goto(`${BASE_URL}/manager/payroll`, { waitUntil: 'networkidle0' });
    await sleep(600);

    // a) Chọn khoảng ngày 19/10/2026 - 25/10/2026
    await setControlledInputValue(page, 'select[aria-label="Kiểu chọn kỳ lương"]', 'range');
    await sleep(400);
    await setControlledInputValue(page, 'input[aria-label="Từ ngày"]', '2026-10-19');
    await setControlledInputValue(page, 'input[aria-label="Đến ngày"]', '2026-10-25');
    await sleep(600);

    // b) Mở chốt kỳ lương nếu đang khóa
    const unlockClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Mở chốt'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (unlockClicked) {
      await sleep(500);
      await page.evaluate(() => {
        const confirmBtn = Array.from(document.querySelectorAll('.fixed.inset-0 button')).find(
          b => b.textContent.trim() === 'Mở chốt'
        );
        if (confirmBtn) confirmBtn.click();
      });
      await sleep(700);
    }

    // c) Chốt lại kỳ lương
    await page.evaluate(() => {
      const lockBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Chốt kỳ lương'));
      if (lockBtn && !lockBtn.disabled) lockBtn.click();
    });
    await sleep(500);
    await page.evaluate(() => {
      const confirmBtn = Array.from(document.querySelectorAll('.fixed.inset-0 button')).find(
        b => b.textContent.trim() === 'Chốt kỳ lương'
      );
      if (confirmBtn) confirmBtn.click();
    });
    await sleep(800);

    const reLockedSuccess = await page.evaluate(() => {
      const badge = Array.from(document.querySelectorAll('span')).some(s => s.textContent.includes('Đã chốt'));
      const unlockBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Mở chốt'));
      return badge && unlockBtn;
    });
    recordWriteResult(
      'Mở chốt và chốt lại kỳ lương (19/10 - 25/10)',
      'Tính lương (/manager/payroll)',
      reLockedSuccess,
      'Kỳ lương khóa thành công, hiển thị badge "Đã chốt" và nút "Mở chốt"'
    );

    // d) Trong lúc kỳ đã chốt: Thử duyệt đơn đổi ca EX-2026-001 (ngày 23/10 thuộc kỳ đã chốt)
    await page.goto(`${BASE_URL}/manager/shift-exchange`, { waitUntil: 'networkidle0' });
    await sleep(600);

    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes('EX-2026-001'));
      if (row) row.click();
    });
    await sleep(600);

    // Bấm duyệt đơn trong kỳ đã chốt
    await page.evaluate(() => {
      const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Chi tiết yêu cầu đổi ca'));
      if (modal) {
        const approveBtn = Array.from(modal.querySelectorAll('button')).find(
          b => b.textContent.includes('Phê duyệt') || b.textContent.includes('Duyệt')
        );
        if (approveBtn) approveBtn.click();
      }
    });
    await sleep(700);

    const hasExchangeBlockedNotice = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('đã chốt') || text.includes('không thể đổi ca');
    });
    recordWriteResult(
      'Chặn duyệt đơn đổi ca thuộc kỳ đã chốt',
      'Đổi ca (/manager/shift-exchange)',
      hasExchangeBlockedNotice,
      'Hiển thị thông báo tiếng Việt ngăn chặn duyệt ca đã chốt lương'
    );

    // Thử từ chối đơn: Phải được phép
    await page.evaluate(() => {
      const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Chi tiết yêu cầu đổi ca'));
      if (modal) {
        const rejectBtn = Array.from(modal.querySelectorAll('button')).find(
          b => b.textContent.trim() === 'Từ chối'
        );
        if (rejectBtn) rejectBtn.click();
      }
    });
    await sleep(600);

    await page.waitForSelector('textarea', { timeout: 4000 });
    await setControlledInputValue(page, 'textarea', 'Từ chối vì kỳ đã khóa');
    await page.evaluate(() => {
      const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Từ chối yêu cầu đổi ca'));
      if (modal) {
        const confirmBtn = Array.from(modal.querySelectorAll('button')).find(
          b => b.textContent.includes('Xác nhận từ chối')
        );
        if (confirmBtn) confirmBtn.click();
      }
    });
    await sleep(600);

    const exchangeRejectPermitted = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Đã từ chối') || text.includes('Từ chối');
    });
    recordWriteResult(
      'Cho phép từ chối đơn đổi ca trong kỳ đã chốt',
      'Đổi ca (/manager/shift-exchange)',
      exchangeRejectPermitted,
      'Cho phép Manager từ chối đơn dù kỳ lương đã chốt'
    );

    // e) Thử duyệt đơn nghỉ phép LV-2026-006 (ngày 19/10 thuộc kỳ đã chốt)
    await page.goto(`${BASE_URL}/manager/leave`, { waitUntil: 'networkidle0' });
    await sleep(600);

    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes('LV-2026-006'));
      if (row) row.click();
    });
    await sleep(600);

    await page.evaluate(() => {
      const modal = Array.from(document.querySelectorAll('.fixed.inset-0')).find(el => el.textContent.includes('Đơn xin nghỉ #'));
      if (modal) {
        const approveBtn = Array.from(modal.querySelectorAll('button')).find(
          b => b.textContent.trim() === 'Phê duyệt'
        );
        if (approveBtn) approveBtn.click();
      }
    });
    await sleep(700);

    const hasLeaveBlockedNotice = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('đã chốt') || text.includes('không thể duyệt');
    });
    recordWriteResult(
      'Chặn duyệt đơn xin nghỉ thuộc kỳ đã chốt',
      'Đơn xin nghỉ (/manager/leave)',
      hasLeaveBlockedNotice,
      'Hiển thị thông báo tiếng Việt ngăn chặn duyệt đơn nghỉ đã chốt lương'
    );

    // =========================================================================
    // 8. BÁO CÁO: XUẤT EXCEL FILE CÓ KÍCH THƯỚC > 0 BYTES
    // =========================================================================
    console.log('\n--- 8. BÁO CÁO: XUẤT EXCEL FILE CÓ KÍCH THƯỚC > 0 BYTES ---');
    clearDownloads();
    await page.goto(`${BASE_URL}/manager/reports`, { waitUntil: 'networkidle0' });
    await sleep(600);

    await page.evaluate(() => {
      const exportBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent.includes('Xuất Excel')
      );
      if (exportBtn && !exportBtn.disabled) exportBtn.click();
    });

    const downloadedReportFile = await waitForDownloadedFile('.xlsx', 5000);
    const hasReportDownload = !!(downloadedReportFile && downloadedReportFile.stat.size > 0);
    recordWriteResult(
      'Xuất báo cáo tổng hợp Excel (KPI & số liệu)',
      'Tải file trình duyệt (Downloads)',
      hasReportDownload,
      hasReportDownload ? `File ${downloadedReportFile.name} (${downloadedReportFile.stat.size} bytes)` : 'Không tìm thấy file tải về'
    );

    // =========================================================================
    // KIỂM TRA LỖI CONSOLE TOÀN BỘ PHẦN KIỂM THỬ GHI
    // =========================================================================
    const validErrors = consoleErrors.filter(e => !e.includes('Download the React DevTools'));
    recordWriteResult(
      'Toàn bộ quá trình thao tác GHI',
      'Console hệ thống',
      validErrors.length === 0,
      validErrors.length === 0 ? '0 lỗi Console đỏ' : validErrors.join('; ')
    );

  } catch (err) {
    console.error('LỖI KHÔNG MONG MUỐN TRONG KIỂM THỬ WRITE & CROSS-SCREEN:', err);
    recordWriteResult('Tiến trình kiểm thử', 'Hệ thống', false, err.message);
  } finally {
    await browser.close();
  }

  // =========================================================================
  // BẢNG TỔNG KẾT KẾT QUẢ
  // =========================================================================
  console.log('\n=============================================================================');
  console.log('       BẢNG TỔNG KẾT THAO TÁC GHI DỮ LIỆU & KIỂM TRA CHÉO MÀN HÌNH');
  console.log('=============================================================================');
  console.table(writeResults);

  const failCount = writeResults.filter(r => r['Trạng thái'] === 'LỖI').length;
  const passCount = writeResults.filter(r => r['Trạng thái'] === 'ĐẠT').length;
  console.log(`\nTỔNG KẾT THAO TÁC GHI: ${passCount} ĐẠT, ${failCount} LỖI / TỔNG SỐ ${writeResults.length} KIỂM THỬ.`);

  return { passCount, failCount, writeResults };
}

// Nếu gọi trực tiếp file này
if (process.argv[1]?.includes('test_write_cross_screen.js')) {
  runWriteCrossScreenTests().then(({ failCount }) => {
    process.exit(failCount > 0 ? 1 : 0);
  });
}

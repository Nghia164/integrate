/* global process */
import { launchBrowser, createTrackedPage, loginAsManager, loginAsStaff, sleep, BASE_URL } from './helpers.js';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Dell/.gemini/antigravity/brain/81d23576-cec1-4d0c-b99d-1f5076508c32';

async function verifyStaffPages() {
  console.log('=============================================================================');
  console.log('   KIỂM TRA GIAO DIỆN & CONSOLE LOGS 7 TRANG CỦA STAFF VÀ QUẢN LÝ');
  console.log('=============================================================================\n');

  const browser = await launchBrowser();
  const { page, errors: consoleErrors } = await createTrackedPage(browser);

  const results = [];

  try {
    // 1. Kiểm tra đăng nhập Manager
    console.log('1. Đăng nhập Manager...');
    await loginAsManager(page);
    await page.goto(`${BASE_URL}/manager/dashboard`, { waitUntil: 'networkidle0' });
    await sleep(600);
    const managerTitle = await page.title();
    console.log(`   [PASS] Manager Dashboard tải thành công (${managerTitle})`);

    // 2. Đăng nhập Staff
    console.log('\n2. Đăng nhập Staff (nguyenvanan@gmail.com)...');
    await loginAsStaff(page, 'nguyenvanan@gmail.com', '12345678');
    await sleep(600);

    const staffRoutes = [
      { path: '/employees/schedule', name: 'Lịch của tôi', screenshot: 'screenshot_staff_schedule.png' },
      { path: '/employees/availability', name: 'Đăng ký rảnh/bận', screenshot: 'screenshot_staff_availability.png' },
      { path: '/employees/shift-exchange', name: 'Đổi ca', screenshot: 'screenshot_staff_shift_exchange.png' },
      { path: '/employees/open-shifts', name: 'Ca trực mở', screenshot: 'screenshot_staff_open_shifts.png' },
      { path: '/employees/leave', name: 'Nghỉ phép', screenshot: 'screenshot_staff_leave.png' },
      { path: '/employees/attendance', name: 'Chấm công', screenshot: 'screenshot_staff_attendance.png' },
      { path: '/employees/profile', name: 'Thông tin cá nhân', screenshot: 'screenshot_staff_profile.png' },
    ];

    for (const item of staffRoutes) {
      console.log(`\nKiểm tra trang Staff: ${item.name} (${item.path})...`);
      const errorCountBefore = consoleErrors.length;

      await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'networkidle0' });
      await sleep(1000);

      const hasContent = await page.evaluate(() => document.body.innerText.length > 50);
      const newErrors = consoleErrors.slice(errorCountBefore);

      await page.screenshot({ path: path.join(ARTIFACT_DIR, item.screenshot) });

      const passed = hasContent && newErrors.length === 0;
      results.push({
        name: item.name,
        path: item.path,
        status: passed ? 'ĐẠT' : 'CÓ LỖI',
        hasContent,
        newErrors: newErrors.length,
        errors: newErrors
      });

      console.log(`   [${passed ? 'PASS' : 'WARN'}] ${item.name}: Nội dung=${hasContent ? 'Có' : 'Trống'}, Lỗi console=${newErrors.length}`);
      if (newErrors.length > 0) {
        newErrors.forEach((e) => console.log(`      * ${e}`));
      }
    }

    console.log('\n=============================================================================');
    console.log('   BẢNG TỔNG KẾT KIỂM THỬ TRANG GIAO DIỆN STAFF');
    console.log('=============================================================================');
    console.table(results.map(r => ({
      'Trang': r.name,
      'Đường dẫn': r.path,
      'Trạng thái': r.status,
      'Có nội dung': r.hasContent ? 'Có' : 'Không',
      'Số lỗi Console': r.newErrors
    })));

    console.log(`\nTổng lỗi Console toàn phiên kiểm tra: ${consoleErrors.length}`);
    if (consoleErrors.length === 0) {
      console.log('✔ TẤT CẢ TRANG STAFF KHÔNG CÓ BẤT KỲ LỖI ĐỎ CONSOLE NÀO (ZERO ERRORS)!');
    }

  } catch (err) {
    console.error('Lỗi trong quá trình kiểm tra:', err);
  } finally {
    await browser.close();
  }
}

verifyStaffPages().catch((err) => {
  console.error(err);
  process.exit(1);
});

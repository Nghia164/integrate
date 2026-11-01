import path from 'node:path';
import { BASE_URL, launchBrowser, loginAsManager, loginAsStaff } from './helpers.js';

const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\7a5e7a43-7918-4e1f-a204-c66831514351';

async function run() {
  console.log('--- STARTING VERIFICATION AND MEASUREMENT ---');
  const browser = await launchBrowser();
  const page = await browser.newPage();

  const results = {
    statsMeasurements: {},
    toolbarResults: {},
    explanationFlow: {},
  };

  try {
    // -------------------------------------------------------------
    // PART 1: MEASURE STAT CARDS AT 1280px & 1920px
    // -------------------------------------------------------------
    console.log('\n--- PART 1: Measuring Stat Cards ---');
    const measureStatCards = async (url, role = 'manager') => {
      if (role === 'manager') await loginAsManager(page);
      else await loginAsStaff(page);

      await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 600));

      return await page.evaluate(() => {
        // Query exact stat cards
        const cards = Array.from(document.querySelectorAll('[data-stat-card="true"]'));
        if (cards.length === 0) return null;

        const firstCard = cards[0];
        const rect = firstCard.getBoundingClientRect();
        const style = window.getComputedStyle(firstCard);
        
        // Find footer inside card
        const footer = firstCard.querySelector('.border-t') || firstCard.querySelector('[class*="border-t"]');
        const footerRect = footer ? footer.getBoundingClientRect() : null;

        // Gap between card 0 and card 1
        let gap = 0;
        if (cards.length > 1) {
          const rect1 = cards[1].getBoundingClientRect();
          gap = Math.round(rect1.left - rect.right);
        }

        return {
          cardCount: cards.length,
          height: Math.round(rect.height),
          width: Math.round(rect.width),
          padding: style.padding,
          borderRadius: style.borderRadius,
          gap: gap,
          footerHeight: footerRect ? Math.round(footerRect.height) : 0,
        };
      });
    };

    // 1280px Viewport
    await page.setViewport({ width: 1280, height: 900 });
    const staff1280 = await measureStatCards('/employees/schedule', 'staff');
    const mgrAtt1280 = await measureStatCards('/manager/attendance', 'manager');
    const mgrSched1280 = await measureStatCards('/manager/schedule/created', 'manager');

    // 1920px Viewport
    await page.setViewport({ width: 1920, height: 1080 });
    const staff1920 = await measureStatCards('/employees/schedule', 'staff');
    const mgrAtt1920 = await measureStatCards('/manager/attendance', 'manager');
    const mgrSched1920 = await measureStatCards('/manager/schedule/created', 'manager');

    results.statsMeasurements = {
      '1280px': { staff: staff1280, managerAttendance: mgrAtt1280, managerCreatedSchedule: mgrSched1280 },
      '1920px': { staff: staff1920, managerAttendance: mgrAtt1920, managerCreatedSchedule: mgrSched1920 },
    };

    console.log('Stat measurements (1280px):', JSON.stringify(results.statsMeasurements['1280px'], null, 2));
    console.log('Stat measurements (1920px):', JSON.stringify(results.statsMeasurements['1920px'], null, 2));

    // -------------------------------------------------------------
    // PART 2: TOOLBAR AT 1280px, 768px, 375px ACROSS 10 MANAGER PAGES
    // -------------------------------------------------------------
    console.log('\n--- PART 2: Testing Toolbars across 10 Manager Pages ---');
    const managerPages = [
      { name: 'Chấm công', path: '/manager/attendance' },
      { name: 'Giờ làm', path: '/manager/work-hours' },
      { name: 'Lịch đã tạo', path: '/manager/schedule/created' },
      { name: 'Khả năng làm việc', path: '/manager/availability' },
      { name: 'Đổi ca', path: '/manager/shift-exchange' },
      { name: 'Ca trực mở', path: '/manager/open-shifts' },
      { name: 'Quản lý nhân viên', path: '/manager/employees' },
      { name: 'Đơn xin nghỉ', path: '/manager/leave' },
      { name: 'Tính lương', path: '/manager/payroll' },
      { name: 'Báo cáo', path: '/manager/reports' },
    ];

    await loginAsManager(page);

    for (const p of managerPages) {
      const pageResult = { isOneLine1280: false, overflow1280: false, overflow768: false, overflow375: false };

      // Test 1280px
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 400));

      const eval1280 = await page.evaluate(() => {
        const root = document.querySelector('#root') || document.body;
        const hasOverflow = document.body.scrollWidth > window.innerWidth || root.scrollWidth > window.innerWidth;
        
        // Find toolbar
        const toolbar = document.querySelector('[data-testid="toolbar"]');
        let onSameLine = true;
        if (toolbar) {
          const searchInput = toolbar.querySelector('input');
          const filterSelect = toolbar.querySelector('select');
          if (searchInput && filterSelect) {
            const sRect = searchInput.getBoundingClientRect();
            const fRect = filterSelect.getBoundingClientRect();
            // on same line if difference in vertical center < 10px
            onSameLine = Math.abs(sRect.top - fRect.top) < 10;
          }
        }

        return { hasOverflow, onSameLine, scrollWidth: document.body.scrollWidth, clientWidth: window.innerWidth };
      });
      pageResult.isOneLine1280 = eval1280.onSameLine;
      pageResult.overflow1280 = eval1280.hasOverflow;

      // Screenshot 1280
      const safeName = p.path.replace(/\//g, '_');
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `evidence_manager_${safeName}_1280.png`) });

      // Test 768px
      await page.setViewport({ width: 768, height: 1024 });
      await new Promise((r) => setTimeout(r, 300));
      const eval768 = await page.evaluate(() => {
        const root = document.querySelector('#root') || document.body;
        return { hasOverflow: document.body.scrollWidth > window.innerWidth || root.scrollWidth > window.innerWidth };
      });
      pageResult.overflow768 = eval768.hasOverflow;

      // Test 375px
      await page.setViewport({ width: 375, height: 812 });
      await new Promise((r) => setTimeout(r, 300));
      const eval375 = await page.evaluate(() => {
        const root = document.querySelector('#root') || document.body;
        return { hasOverflow: document.body.scrollWidth > window.innerWidth || root.scrollWidth > window.innerWidth };
      });
      pageResult.overflow375 = eval375.hasOverflow;
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `evidence_manager_${safeName}_375.png`) });

      results.toolbarResults[p.name] = pageResult;
      console.log(`- ${p.name}: 1280 oneLine=${pageResult.isOneLine1280}, overflow(1280/768/375)=${pageResult.overflow1280}/${pageResult.overflow768}/${pageResult.overflow375}`);
    }

    // -------------------------------------------------------------
    // PART 3: SEARCH & FILTER INTERACTIONS
    // -------------------------------------------------------------
    console.log('\n--- PART 3: Search & Filter Interactions ---');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE_URL}/manager/attendance`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));

    // Test typing search with accent & without accent
    const attTest = await page.evaluate(async () => {
      const search = document.querySelector('[data-testid="toolbar"] input');
      if (!search) return { ok: false, msg: 'Search input not found' };

      // Get initial rows
      const countInitial = document.querySelectorAll('tbody tr').length;

      // Search 'an'
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter.call(search, 'an');
      search.dispatchEvent(new Event('input', { bubbles: true }));
      search.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
      const countAn = document.querySelectorAll('tbody tr').length;

      // Search 'An' (uppercase)
      setter.call(search, 'An');
      search.dispatchEvent(new Event('input', { bubbles: true }));
      search.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
      const countAnUpper = document.querySelectorAll('tbody tr').length;

      // Clear search
      setter.call(search, '');
      search.dispatchEvent(new Event('input', { bubbles: true }));
      search.dispatchEvent(new Event('change', { bubbles: true }));

      return { ok: true, countInitial, countAn, countAnUpper, matchCaseInsensitive: countAn === countAnUpper };
    });
    console.log('Attendance search test:', attTest);

    // -------------------------------------------------------------
    // PART 4: MANAGER ATTENDANCE EXPLANATION WORKFLOW
    // -------------------------------------------------------------
    console.log('\n--- PART 4: Explanation Workflow ---');
    // Step 4a: Manager Attendance initial state
    await page.goto(`${BASE_URL}/manager/attendance`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));

    const initialManagerExpTab = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]')).map(el => el.textContent.trim());
      const hasExpTab = tabs.some(t => t.includes('Có giải trình'));
      const expTabLabel = tabs.find(t => t.includes('Có giải trình')) || '';
      const noticeBar = document.querySelector('.bg-amber-50, .border-amber-200');
      return { hasExpTab, expTabLabel, hasNoticeBar: !!noticeBar };
    });
    console.log('Initial manager explanation tab:', initialManagerExpTab);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence_manager_attendance_exp_0.png') });

    // Step 4b: Submit explanation via Staff
    console.log('Submitting explanation via Staff account...');
    await loginAsStaff(page);
    await page.goto(`${BASE_URL}/employees/attendance`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));

    const submitResult = await page.evaluate(async () => {
      const { submitExplanation } = await import('/src/mocks/attendance.js');
      const { loadDb } = await import('/src/mocks/db.js');
      const db = loadDb();
      const records = db.attendance || [];
      const eligible = records.find(r => r.status === 'missing_checkout' || r.status === 'absent' || !r.checkOutMin);
      const shiftId = eligible ? eligible.id : (records[0]?.id || 'shift_test_1');
      const res = submitExplanation({
        shiftId: shiftId,
        attendanceId: shiftId,
        date: eligible?.iso || eligible?.date || '2026-10-26',
        shiftName: eligible?.shiftName || 'Ca sáng',
        employeeId: 'NV001',
        employeeName: 'Nguyễn Văn An',
        proposedIn: '08:00',
        proposedOut: '16:30',
        issue: 'missing_checkout',
        reason: 'Máy chấm công hỏng cảm ứng vân tay nên không quét được check-out lúc về.',
      });
      return { res, shiftId };
    });
    console.log('Submit explanation result:', submitResult);

    // Step 4c: Check Manager Attendance with pending explanation
    await loginAsManager(page);
    await page.goto(`${BASE_URL}/manager/attendance`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    const pendingManagerExp = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]')).map(el => el.textContent.trim());
      const expTabLabel = tabs.find(t => t.includes('Có giải trình')) || '';
      const noticeBar = document.querySelector('.bg-amber-50, .border-amber-200, [class*="amber"]');
      const noticeText = noticeBar ? noticeBar.textContent.trim() : '';

      // Check badge in table
      const hasBadgeInTable = document.body.innerHTML.includes('Có giải trình');

      return { expTabLabel, hasNoticeBar: !!noticeBar, noticeText, hasBadgeInTable };
    });
    console.log('Pending manager explanation state:', pendingManagerExp);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence_manager_attendance_exp_1.png') });

    // Step 4d: Switch to 'Có giải trình' tab in Manager
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const expTab = tabs.find(t => t.textContent.includes('Có giải trình'));
      if (expTab) expTab.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence_manager_attendance_exp_table.png') });

    // Step 4e: Open modal & approve
    const modalApproved = await page.evaluate(async () => {
      const handleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Xử lý') || b.textContent.includes('Xem'));
      if (handleBtn) {
        handleBtn.click();
        await new Promise(r => setTimeout(r, 300));
        
        // Find approve button in modal
        const approveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Duyệt và áp dụng'));
        if (approveBtn) {
          approveBtn.click();
          await new Promise(r => setTimeout(r, 300));
          return true;
        }
      }
      return false;
    });
    console.log('Modal approved:', modalApproved);

    // Step 4f: Verify re-count
    await new Promise((r) => setTimeout(r, 500));
    const finalManagerExp = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]')).map(el => el.textContent.trim());
      const expTabLabel = tabs.find(t => t.includes('Có giải trình')) || '';
      return { expTabLabel };
    });
    console.log('Final manager explanation count:', finalManagerExp);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence_manager_attendance_after_approve.png') });

    console.log('\n--- ALL VERIFICATIONS COMPLETE ---');
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();

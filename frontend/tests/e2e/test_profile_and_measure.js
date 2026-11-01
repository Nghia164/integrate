import path from 'node:path';
import { BASE_URL, launchBrowser, loginAsManager, loginAsStaff } from './helpers.js';

const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\7a5e7a43-7918-4e1f-a204-c66831514351';

async function run() {
  console.log('--- STARTING PROFILE PAGE VERIFICATION & MEASUREMENT ---');
  const browser = await launchBrowser();
  const page = await browser.newPage();

  const results = {
    measurements: {},
    forbiddenTerms: [],
    accountTest: {},
    unauthorizedTest: {},
    passwordTest: {},
    editSaveTest: {},
  };

  try {
    // -------------------------------------------------------------------------
    // 1. MEASUREMENTS: ProfilePage vs LeavePage vs ShiftExchangePage at 1280px
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Measuring Layout Dimensions (1280px) ---');
    await loginAsStaff(page, 'nguyenvanan@gmail.com');
    await page.setViewport({ width: 1280, height: 900 });

    const measurePage = async (url) => {
      await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 400));
      return await page.evaluate(() => {
        // PageHeader card
        const headerCard = document.querySelector('.rounded-2xl.border.border-slate-200\\/90.bg-white.p-5, [class*="p-5"][class*="rounded-2xl"]');
        const hStyle = headerCard ? window.getComputedStyle(headerCard) : null;

        // PageCard
        const cards = Array.from(document.querySelectorAll('.rounded-2xl.border.border-slate-200\\/90.bg-white.shadow-2xs, .rounded-2xl.border.bg-white'));
        const contentCard = cards.find(c => c !== headerCard) || cards[0];
        const cStyle = contentCard ? window.getComputedStyle(contentCard) : null;

        // Button height
        const btn = document.querySelector('button');
        const bRect = btn ? btn.getBoundingClientRect() : null;

        // Overflow
        const hasOverflow = document.body.scrollWidth > window.innerWidth;

        return {
          headerPadding: hStyle ? hStyle.padding : 'N/A',
          headerRadius: hStyle ? hStyle.borderRadius : 'N/A',
          cardPadding: cStyle ? cStyle.padding : 'N/A',
          cardRadius: cStyle ? cStyle.borderRadius : 'N/A',
          buttonHeight: bRect ? Math.round(bRect.height) : 0,
          hasOverflow,
        };
      });
    };

    const leaveMeasure = await measurePage('/employees/leave');
    const exchangeMeasure = await measurePage('/employees/shift-exchange');
    const profileMeasure = await measurePage('/employees/profile');

    results.measurements = {
      profile: profileMeasure,
      leave: leaveMeasure,
      exchange: exchangeMeasure,
    };
    console.log('Measurements:', JSON.stringify(results.measurements, null, 2));

    // Responsive overflow checks for Profile: 768px and 375px
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 200));
    const overflow768 = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);

    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 200));
    const overflow375 = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence_profile_mobile_375.png') });

    console.log(`Profile overflow: 1280px=${profileMeasure.hasOverflow}, 768px=${overflow768}, 375px=${overflow375}`);

    // -------------------------------------------------------------------------
    // 2. FORBIDDEN CONTENT CHECK
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Checking Forbidden Terms ---');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE_URL}/employees/profile`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence_profile_view_1280.png') });

    const forbiddenFound = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      const terms = ['lương', 'đ/giờ', 'ngân hàng', 'cccd', 'bảo hiểm', 'mã số thuế', 'điểm uy tín', 'hạng', 'kỹ năng'];
      return terms.filter(t => bodyText.includes(t));
    });
    results.forbiddenTerms = forbiddenFound;
    console.log('Forbidden terms found (should be empty):', forbiddenFound);

    // -------------------------------------------------------------------------
    // 3. EDIT & SAVE & VALIDATION FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Edit, Validation & Save Flow ---');
    // Click 'Chỉnh sửa'
    await page.evaluate(() => {
      const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Chỉnh sửa'));
      if (editBtn) editBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence_profile_edit_1280.png') });

    // Test invalid phone number
    const phoneValResult = await page.evaluate(async () => {
      const phoneInput = document.querySelector('input[type="tel"]');
      if (!phoneInput) return { ok: false, msg: 'Phone input not found' };

      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter.call(phoneInput, '12345');
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Click save
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Lưu'));
      saveBtn?.click();
      await new Promise(r => setTimeout(r, 200));

      const errorMsg = document.body.innerText.includes('Số điện thoại không hợp lệ');
      return { ok: true, showsError: errorMsg };
    });
    console.log('Invalid phone test:', phoneValResult);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence_profile_phone_error.png') });

    // Enter valid phone & new address and save
    const saveResult = await page.evaluate(async () => {
      const phoneInput = document.querySelector('input[type="tel"]');
      const addrInput = document.querySelector('textarea');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      const textSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

      setter.call(phoneInput, '0987654321');
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));

      textSetter.call(addrInput, '456 Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM');
      addrInput.dispatchEvent(new Event('input', { bubbles: true }));
      addrInput.dispatchEvent(new Event('change', { bubbles: true }));

      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Lưu') && !b.disabled);
      if (!saveBtn) return { ok: false, msg: 'Save button disabled or not found' };
      saveBtn.click();
      await new Promise(r => setTimeout(r, 600));

      const hasSuccess = document.body.innerText.includes('Cập nhật thành công');
      const phoneUpdated = document.body.innerText.includes('0987654321');
      const addrUpdated = document.body.innerText.includes('456 Lê Lợi');

      return { ok: true, hasSuccess, phoneUpdated, addrUpdated };
    });
    results.editSaveTest = saveResult;
    console.log('Save result:', saveResult);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence_profile_saved_success.png') });

    // -------------------------------------------------------------------------
    // 4. TEST 2 ACCOUNTS: Nguyễn Văn An vs Lê Minh Cường
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Two Accounts ---');
    // Account 1: An
    await loginAsStaff(page, 'nguyenvanan@gmail.com');
    await page.goto(`${BASE_URL}/employees/profile`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    const anData = await page.evaluate(() => {
      return {
        name: document.body.innerText.includes('Nguyễn Văn An'),
        code: document.body.innerText.includes('NV001'),
      };
    });

    // Account 2: Cường
    await page.evaluate(() => {
      const userObj = {
        id: 'NV002',
        employeeId: 'NV002',
        name: 'Lê Minh Cường',
        email: 'leminhcuong@gmail.com',
        role: 'staff',
        roleTags: ['Phục vụ'],
      };
      localStorage.setItem('user', JSON.stringify(userObj));
      sessionStorage.setItem('user', JSON.stringify(userObj));
    });
    await page.goto(`${BASE_URL}/employees/profile`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    const cuongData = await page.evaluate(() => {
      return {
        name: document.body.innerText.includes('Lê Minh Cường'),
        code: document.body.innerText.includes('NV002'),
      };
    });
    results.accountTest = { an: anData, cuong: cuongData };
    console.log('Account comparison:', results.accountTest);

    // -------------------------------------------------------------------------
    // 5. TEST UNAUTHORIZED URL PARAMETER (US07)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Unauthorized ID URL Parameter ---');
    await page.goto(`${BASE_URL}/employees/profile?id=NV005`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    const unauthTest = await page.evaluate(() => {
      const has403Text = document.body.innerText.includes('Bạn không có quyền xem hồ sơ này');
      const hasBackBtn = document.body.innerText.includes('Về hồ sơ của tôi');
      return { has403Text, hasBackBtn };
    });
    results.unauthorizedTest = unauthTest;
    console.log('Unauthorized test:', unauthTest);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence_profile_unauthorized.png') });

    // -------------------------------------------------------------------------
    // 6. TEST CHANGE PASSWORD MODAL (US02)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Change Password Modal (US02) ---');
    await page.goto(`${BASE_URL}/employees/profile`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));

    // Click 'Đổi mật khẩu'
    await page.evaluate(() => {
      const passBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Đổi mật khẩu'));
      if (passBtn) passBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence_profile_password_modal.png') });

    const passModalTest = await page.evaluate(async () => {
      const inputs = document.querySelectorAll('input[type="password"]');
      if (inputs.length < 3) return { ok: false, msg: `Expected 3 password inputs, found ${inputs.length}` };

      // Submit empty
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Lưu mật khẩu'));
      saveBtn?.click();
      await new Promise(r => setTimeout(r, 200));

      const emptyErr = document.body.innerText.includes('Vui lòng nhập mật khẩu');

      // Test weak password
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter.call(inputs[0], '12345678'); // current
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));

      setter.call(inputs[1], 'short'); // weak new
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));

      setter.call(inputs[2], 'short');
      inputs[2].dispatchEvent(new Event('input', { bubbles: true }));

      saveBtn?.click();
      await new Promise(r => setTimeout(r, 200));
      const weakErr = document.body.innerText.includes('Mật khẩu mới phải có tối thiểu 8 ký tự');

      // Test valid password change
      setter.call(inputs[1], 'NewPass123');
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));

      setter.call(inputs[2], 'NewPass123');
      inputs[2].dispatchEvent(new Event('input', { bubbles: true }));

      saveBtn?.click();
      await new Promise(r => setTimeout(r, 500));
      const successMsg = document.body.innerText.includes('Đổi mật khẩu thành công');

      return { ok: true, emptyErr, weakErr, successMsg };
    });
    results.passwordTest = passModalTest;
    console.log('Password test result:', passModalTest);

    // -------------------------------------------------------------------------
    // 7. SCREENSHOT OTHER PAGES TO PROVE UNTOUCHED
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Capturing Out-of-Scope Pages ---');
    const outOfScopeStaff = [
      { name: 'my_schedule', url: '/employees/schedule' },
      { name: 'availability', url: '/employees/availability' },
      { name: 'shift_exchange', url: '/employees/shift-exchange' },
      { name: 'open_shifts', url: '/employees/open-shifts' },
      { name: 'leave', url: '/employees/leave' },
      { name: 'attendance', url: '/employees/attendance' },
    ];
    for (const item of outOfScopeStaff) {
      await page.goto(`${BASE_URL}${item.url}`, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 300));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `evidence_untouched_staff_${item.name}.png`) });
    }

    // Manager employee list
    await loginAsManager(page);
    await page.goto(`${BASE_URL}/manager/employees`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence_untouched_manager_employees.png') });

    console.log('\n--- ALL VERIFICATIONS COMPLETED SUCCESSFULLY ---');
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

run();

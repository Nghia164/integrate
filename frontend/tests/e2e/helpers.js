// =============================================================================
// File: tests/e2e/helpers.js
// Tầng: E2E Automation Helpers
// Sử dụng puppeteer-core kết nối Chrome headless trên Windows
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

export const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const BASE_URL = 'http://localhost:5173';
export const DOWNLOADS_DIR = path.resolve('tests/e2e/downloads');

/**
 * Khởi động Chrome headless cho kiểm thử E2E
 */
export async function launchBrowser() {
  return await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1440,900'
    ]
  });
}

/**
 * Tạo một trang mới có gắn trình theo dõi lỗi console đỏ
 */
export async function createTrackedPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('pageerror', (err) => {
    console.error('>>> [BROWSER PAGEERROR]:', err.message, '\nStack:', err.stack);
    errors.push(`PAGEERROR: ${err.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Bỏ qua cảnh báo React DevTools hoặc favicon không ảnh hưởng
      if (!text.includes('React DevTools') && !text.includes('favicon')) {
        errors.push(`CONSOLE.ERROR: ${text}`);
      }
    }
  });

  return { page, errors };
}

/**
 * Đăng nhập tài khoản Manager
 */
export async function loginAsManager(page) {
  if (page.url() === 'about:blank' || !page.url().startsWith(BASE_URL)) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  }
  await page.evaluate(() => {
    const userObj = {
      id: 1,
      employeeId: 'QL001',
      name: 'Manager (mock)',
      email: 'manager@coffee.com',
      role: 'manager',
    };
    localStorage.setItem('user', JSON.stringify(userObj));
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('rememberMe', 'true');
    sessionStorage.setItem('user', JSON.stringify(userObj));
    sessionStorage.setItem('token', 'mock-jwt-token');
  });
  await page.goto(`${BASE_URL}/manager/schedule`, { waitUntil: 'networkidle0' });
}

/**
 * Gán giá trị an toàn cho input có kiểm soát của React (Controlled Input)
 */
export async function setControlledInputValue(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Element not found: ${sel}`);
    const proto = el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? window.HTMLSelectElement.prototype
        : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) {
      setter.call(el, val);
    } else {
      el.value = val;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

/**
 * Đăng nhập tài khoản Staff
 */
export async function loginAsStaff(page, email = 'nguyenvanan@gmail.com') {
  if (page.url() === 'about:blank' || !page.url().startsWith(BASE_URL)) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  }
  await page.evaluate((mail) => {
    const userObj = {
      id: 'NV001',
      employeeId: 'NV001',
      name: 'Nguyễn Văn An',
      email: mail,
      role: 'staff',
      roleTags: ['Shift_Leader', 'Phục vụ'],
    };
    localStorage.setItem('user', JSON.stringify(userObj));
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('rememberMe', 'true');
    sessionStorage.setItem('user', JSON.stringify(userObj));
    sessionStorage.setItem('token', 'mock-jwt-token');
  }, email);
  await page.goto(`${BASE_URL}/employees/open-shifts`, { waitUntil: 'networkidle0' });
}

/**
 * Cấu hình thư mục tải file qua Chrome DevTools Protocol
 */
export async function setupDownloadFolder(page) {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  }
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOADS_DIR,
  });
  return DOWNLOADS_DIR;
}

/**
 * Xóa sạch thư mục tải file trước khi test
 */
export function clearDownloads() {
  if (fs.existsSync(DOWNLOADS_DIR)) {
    const files = fs.readdirSync(DOWNLOADS_DIR);
    for (const f of files) {
      try {
        fs.unlinkSync(path.join(DOWNLOADS_DIR, f));
      } catch {
        // bỏ qua
      }
    }
  }
}

/**
 * Chờ và lấy file tải về có kích thước > 0
 */
export async function waitForDownloadedFile(ext = '.xlsx', timeoutMs = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(DOWNLOADS_DIR)) {
      const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.endsWith(ext) && !f.endsWith('.crdownload'));
      if (files.length > 0) {
        const latest = files
          .map(f => ({ name: f, path: path.join(DOWNLOADS_DIR, f), stat: fs.statSync(path.join(DOWNLOADS_DIR, f)) }))
          .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)[0];
        if (latest.stat.size > 0) {
          return latest;
        }
      }
    }
    await sleep(250);
  }
  return null;
}

/**
 * Chờ một khoảng thời gian ms
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

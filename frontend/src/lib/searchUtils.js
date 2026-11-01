/**
 * FILE NÀY LÀM GÌ: Bộ hàm tìm kiếm và chuẩn hóa chuỗi tiếng Việt (Search Utils SSOT)
 * Loại: Thư viện nền tảng (Shared Library)
 * Tính năng:
 * - normalizeText(s): Bỏ dấu tiếng Việt (NFD), chuyển chữ thường, bỏ khoảng trắng thừa
 * - matchesSearch(query, fields): Tách từ khóa theo dấu cách, logic AND giữa các từ, an toàn với ký tự đặc biệt
 * - debounce / useDebounce: Hỗ trợ độ trễ khi tìm kiếm (250ms)
 */

import { useEffect, useState } from "react";

/**
 * Chuẩn hóa chuỗi văn bản:
 * - Loại bỏ dấu tiếng Việt theo chuẩn NFD
 * - Chuyển sang chữ thường (lowercase)
 * - Xóa khoảng trắng thừa ở đầu, cuối và giữa các từ
 */
export function normalizeText(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Kiểm tra xem một đối tượng có khớp với truy vấn tìm kiếm không:
 * - Tách query thành các từ đơn (theo khoảng trắng)
 * - TẤT CẢ các từ trong query phải cùng xuất hiện trong chuỗi tổng hợp của các trường (AND logic giữa các từ)
 * - An toàn với các ký tự đặc biệt như regex meta-characters (+, *, ?, [, ], (, ), ...) vì dùng String.prototype.includes
 *
 * @param {string} query Chuỗi tìm kiếm nhập từ người dùng
 * @param {Array<string|number|null|undefined>} fields Danh sách các giá trị trường cần tìm
 * @returns {boolean}
 */
export function matchesSearch(query, fields = []) {
  if (query === null || query === undefined) return true;
  const normQuery = normalizeText(query);
  if (!normQuery) return true;

  const words = normQuery.split(" ").filter(Boolean);
  if (words.length === 0) return true;

  if (!Array.isArray(fields) || fields.length === 0) return false;

  // Ghép các trường thành một chuỗi chuẩn hóa duy nhất
  const combined = fields
    .map((f) => normalizeText(f))
    .filter(Boolean)
    .join(" ");

  if (!combined) return false;

  // Mọi từ trong từ khóa đều phải xuất hiện trong chuỗi tổng hợp
  return words.every((word) => combined.includes(word));
}

/**
 * Hàm debounce thuần túy
 */
export function debounce(func, wait = 250) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * React Hook tạo giá trị trễ debounce (mặc định 250ms)
 */
export function useDebounce(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

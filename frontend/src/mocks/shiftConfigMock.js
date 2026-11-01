/**
 * File: src/mocks/shiftConfigMock.js
 * Cấu hình ca làm việc & Danh mục vai trò duy nhất (Static Mock Data)
 */

import { mockEmployees } from "./employeeMock.js";

// Danh mục vai trò DUY NHẤT toàn hệ thống
export let mockRoleTags = ["Phục vụ", "Pha chế", "Thu ngân"];
export const STANDARD_ROLES = mockRoleTags;

export function getRoleTags() {
  return [...mockRoleTags];
}

export function addRoleTag(roleName) {
  const trimmed = (roleName || "").trim();
  if (!trimmed) throw new Error("Tên vai trò không được để trống.");
  if (mockRoleTags.includes(trimmed)) throw new Error("Role_Tag đã tồn tại.");
  mockRoleTags.push(trimmed);
  return [...mockRoleTags];
}

export function updateRoleTag(oldRole, newRole) {
  const trimmed = (newRole || "").trim();
  if (!trimmed) throw new Error("Tên vai trò không được để trống.");
  const idx = mockRoleTags.indexOf(oldRole);
  if (idx === -1) throw new Error("Không tìm thấy vai trò.");
  mockRoleTags[idx] = trimmed;
  mockEmployees.forEach((e) => {
    if (e.roles && e.roles.includes(oldRole)) {
      e.roles = e.roles.map((r) => (r === oldRole ? trimmed : r));
      e.role = e.roles[0];
    }
  });
  return [...mockRoleTags];
}

export function deleteRoleTag(roleName) {
  // Kiểm tra vai trò đang được nhân viên hoặc nhu cầu ca sử dụng
  const isUsedByEmployee = mockEmployees.some((e) => (e.roles || [e.role]).includes(roleName));
  const isUsedByDemand = mockShiftConfigs.some((s) => s.role === roleName || s.name?.includes(roleName));
  if (isUsedByEmployee || isUsedByDemand) {
    throw new Error("Role_Tag đang được sử dụng");
  }
  mockRoleTags = mockRoleTags.filter((r) => r !== roleName);
  return [...mockRoleTags];
}

export const mockShiftConfigs = [
  {
    id: "shift_1",
    name: "Sáng",
    start: "06:00",
    end: "12:00",
    night: false,
    multiplier: 1.0,
    minStaff: 2,
    maxStaff: 4,
  },
  {
    id: "shift_2",
    name: "Chiều",
    start: "12:00",
    end: "17:00",
    night: false,
    multiplier: 1.0,
    minStaff: 2,
    maxStaff: 4,
  },
  {
    id: "shift_3",
    name: "Tối",
    start: "17:00",
    end: "22:00",
    night: true,
    multiplier: 1.2,
    minStaff: 2,
    maxStaff: 5,
  },
];

export const mockGeneralConfig = {
  maxHoursPerWeek: 48,
  minRestHoursBetweenShifts: 12,
  allowOvertime: true,
};

let savedConfigStore = null;

export function getSavedShiftConfig() {
  if (savedConfigStore) {
    return JSON.parse(JSON.stringify(savedConfigStore));
  }
  return {
    shifts: JSON.parse(JSON.stringify(mockShiftConfigs)),
    general: { ...mockGeneralConfig },
  };
}

export function saveShiftConfigData(data) {
  // BACKEND: Lưu cấu hình ca vào bảng shift_configs
  savedConfigStore = JSON.parse(JSON.stringify(data));
  return { success: true, data };
}

export default {
  mockShiftConfigs,
  mockGeneralConfig,
  getSavedShiftConfig,
  saveShiftConfigData,
};
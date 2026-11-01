// =============================================================================
// File: src/services/workHoursService.js
// Tầng: Dịch Vụ Tổng Hợp Giờ Làm (US14 - Manager)
// =============================================================================

import {
  mockEmployees,
  mockRoleTags,
  buildSummary,
  buildDetail,
} from "../mocks/workHoursMock.js";
import { getEmployeeById as mockGetEmployeeById } from "../mocks/employeeMock.js";

export const getEmployeeById = (id) => mockGetEmployeeById(id);

export const subscribeWorkHours = () => {
  return () => {};
};

// Danh sách nhân viên + Role_Tag để đổ vào 2 bộ lọc
export async function getEmployeeOptions() {
  return { employees: mockEmployees || [], roleTags: mockRoleTags || [] };
}

// Bảng tổng hợp theo kỳ + bộ lọc. params: { period: "week"|"month"|"range", from, to, employeeId, roleTag }
export async function getWorkHoursSummary(params) {
  return buildSummary(params);
}

// Chi tiết từng ca của một nhân viên trong kỳ đang xem
export async function getEmployeeShiftDetail(employeeId, params) {
  return buildDetail(employeeId, params);
}

export default {
  getEmployeeById,
  subscribeWorkHours,
  getEmployeeOptions,
  getWorkHoursSummary,
  getEmployeeShiftDetail,
};

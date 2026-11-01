/**
 * File: src/mocks/availabilityMock.js
 * Dữ liệu đăng ký khả năng làm việc mẫu (Static Mock Data)
 */

import { mockEmployees } from "./employeeMock.js";
import { mockShiftConfigs } from "./shiftConfigMock.js";
import { mondayOf, addDays, toISO, toVN, getNow } from "../lib/dateUtils.js";

const makeSlots = (availKeys = []) => {
  const shifts = ["Sáng", "Chiều", "Tối"];
  const res = {};
  for (let d = 0; d < 7; d++) {
    for (const s of shifts) {
      const k = `${d}_${s}`;
      res[k] = availKeys.includes(k) ? "available" : "busy";
    }
  }
  return res;
};

// Đăng ký khả năng làm việc tuần 26/10/2026 (6 nhân viên hoạt động đăng ký, NV004 Tạm nghỉ)
const week2610Slots = {
  NV001: makeSlots(["0_Sáng", "0_Chiều", "1_Sáng", "2_Sáng", "2_Chiều", "3_Chiều", "4_Sáng", "4_Chiều", "5_Chiều", "6_Sáng"]),
  NV002: makeSlots(["0_Sáng", "0_Chiều", "1_Chiều", "2_Sáng", "2_Tối", "3_Sáng", "4_Sáng", "5_Sáng", "5_Chiều", "6_Chiều"]),
  NV003: makeSlots(["0_Chiều", "1_Chiều", "1_Tối", "2_Sáng", "2_Chiều", "3_Tối", "4_Chiều", "5_Sáng"]),
  NV005: makeSlots(["0_Chiều", "1_Sáng", "2_Sáng", "2_Chiều", "3_Chiều", "3_Tối", "4_Chiều", "4_Tối", "5_Chiều", "5_Tối", "6_Sáng"]),
  NV007: makeSlots(["0_Sáng", "0_Chiều", "1_Sáng", "1_Chiều", "2_Chiều", "3_Sáng", "4_Sáng", "4_Chiều", "5_Chiều", "6_Sáng"]),
  NV008: makeSlots(["0_Sáng", "1_Sáng", "2_Chiều", "3_Chiều", "4_Chiều", "5_Tối", "6_Tối"]),
};

// Đăng ký khả năng làm việc tuần 02/11/2026 (viết tay khác tuần trước)
const week0211Slots = {
  NV001: makeSlots(["0_Sáng", "1_Sáng", "1_Chiều", "2_Chiều", "3_Sáng", "4_Sáng", "5_Chiều", "6_Chiều"]),
  NV002: makeSlots(["0_Sáng", "1_Chiều", "2_Sáng", "3_Chiều", "4_Sáng", "5_Sáng", "6_Sáng"]),
  NV003: makeSlots(["0_Chiều", "1_Chiều", "2_Chiều", "3_Tối", "4_Chiều", "5_Chiều", "6_Tối"]),
  NV005: makeSlots(["0_Chiều", "1_Tối", "2_Sáng", "3_Chiều", "4_Tối", "5_Chiều", "5_Tối", "6_Sáng"]),
  NV007: makeSlots(["0_Chiều", "1_Sáng", "2_Sáng", "3_Sáng", "4_Chiều", "5_Sáng", "6_Chiều"]),
  NV008: makeSlots(["0_Tối", "1_Sáng", "2_Chiều", "3_Chiều", "4_Tối", "5_Tối", "6_Chiều"]),
};

// Đăng ký khả năng làm việc tuần 09/11/2026 (có đúng 2 nhân viên chưa đăng ký: NV007 và NV008, NV004 tạm nghỉ không tính)
const week0911Slots = {
  NV001: makeSlots(["0_Sáng", "1_Sáng", "2_Chiều", "3_Sáng", "4_Sáng", "5_Chiều"]),
  NV002: makeSlots(["0_Sáng", "1_Chiều", "2_Sáng", "3_Sáng", "4_Sáng", "5_Sáng"]),
  NV003: makeSlots(["1_Chiều", "2_Chiều", "3_Tối", "4_Chiều", "5_Chiều"]),
  NV005: makeSlots(["0_Chiều", "1_Tối", "2_Sáng", "3_Chiều", "4_Tối", "5_Tối"]),
};

// Kho lưu trữ đăng ký khả năng làm việc theo tuần (Single Source of Truth)
const savedAvailabilityStore = {
  "2026-10-26": week2610Slots,
  "2026-11-02": week0211Slots,
  "2026-11-09": week0911Slots,
};

export function getMockWeeklyAvailability(weekMondayIso) {
  const currentMonday = mondayOf(getNow());
  const targetMondayIso = weekMondayIso || toISO(addDays(currentMonday, 7));
  const targetMonday = new Date(targetMondayIso);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(targetMonday, i);
    const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
    const dIso = toISO(d);
    return {
      dayIndex: i,
      dayName: dayNames[i],
      dateIso: dIso,
      dateVn: toVN(dIso).slice(0, 5),
    };
  });

  // Chỉ tính nhân viên đang làm việc (NV006 Nghỉ việc và NV004 Tạm nghỉ không tính vào đăng ký rảnh/bận)
  const activeEmployees = mockEmployees.filter((e) => e.status === "Đang làm việc");
  const weekStore = savedAvailabilityStore[targetMondayIso] || {};

  let totalAvailable = 0;
  let totalBusy = 0;
  let registeredCount = 0;

  const employees = activeEmployees.map((emp) => {
    const empSlots = weekStore[emp.id];
    const registered = Boolean(empSlots && Object.keys(empSlots).length > 0);

    if (registered) {
      registeredCount++;
      days.forEach((day) => {
        mockShiftConfigs.forEach((shift) => {
          const val = empSlots[`${day.dayIndex}_${shift.name}`];
          if (val === "available") totalAvailable++;
          else if (val === "busy") totalBusy++;
        });
      });
    }

    return {
      ...emp,
      registered,
      submittedAt: registered ? "2026-10-23T14:30:00Z" : null,
      slots: registered ? empSlots : {},
    };
  });

  const unregisteredCount = activeEmployees.length - registeredCount;
  const sunday = addDays(targetMonday, 6);
  const weekLabel = `Tuần ${toVN(targetMondayIso)} – ${toVN(toISO(sunday))}`;

  return {
    weekMonday: targetMondayIso,
    weekLabel,
    weekRange: `${days[0].dateVn} - ${days[6].dateVn}`,
    shifts: mockShiftConfigs,
    days,
    employees,
    summary: {
      registeredCount,
      unregisteredCount,
      totalEmployees: activeEmployees.length,
      totalAvailable,
      totalBusy,
    },
  };
}

export function getMockAvailability(employeeId, weekMondayIso) {
  const currentMonday = mondayOf(getNow());
  const targetMondayIso = weekMondayIso || toISO(addDays(currentMonday, 7));
  const targetMonday = new Date(targetMondayIso);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(targetMonday, i);
    const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
    const dIso = toISO(d);
    return {
      dayIndex: i,
      dayName: dayNames[i],
      dateIso: dIso,
      dateVn: toVN(dIso).slice(0, 5),
    };
  });

  const weekStore = savedAvailabilityStore[targetMondayIso] || {};
  const slots = weekStore[employeeId] || {};
  const isRegistered = Object.keys(slots).length > 0;
  const sunday = addDays(targetMonday, 6);
  const weekLabel = `Tuần ${toVN(targetMondayIso)} – ${toVN(toISO(sunday))}`;

  return {
    id: `avail_${employeeId}_${targetMondayIso}`,
    type: "availability",
    employeeId,
    weekMonday: targetMondayIso,
    weekLabel,
    deadlineAt: "2026-10-23T23:59:59.999Z",
    status: isRegistered ? "submitted" : "draft",
    version: 1,
    submittedAt: isRegistered ? "2026-10-23T14:30:00Z" : null,
    updatedAt: isRegistered ? "2026-10-23T14:30:00Z" : null,
    slots,
    shifts: mockShiftConfigs,
    days,
    logs: [],
  };
}

export function saveMockAvailability(employeeId, weekMonday, slots, options = {}) {
  if (!savedAvailabilityStore[weekMonday]) {
    savedAvailabilityStore[weekMonday] = {};
  }
  savedAvailabilityStore[weekMonday][employeeId] = {
    ...(savedAvailabilityStore[weekMonday][employeeId] || {}),
    ...slots,
  };
  return {
    id: `avail_${employeeId}_${weekMonday}`,
    employeeId,
    weekMonday,
    slots: savedAvailabilityStore[weekMonday][employeeId],
    status: "submitted",
    version: (options.expectedVersion || 1) + 1,
  };
}

export function isMockEmployeeAvailable(empId, dayIndex, shiftName, weekMonday) {
  const targetMonIso = weekMonday || toISO(mondayOf(getNow()));
  const weekStore = savedAvailabilityStore[targetMonIso];
  if (!weekStore || !weekStore[empId]) return true;
  return weekStore[empId][`${dayIndex}_${shiftName}`] === "available";
}

export const saveMockStaffAvailability = saveMockAvailability;

export default {
  getMockWeeklyAvailability,
  saveMockStaffAvailability,
  getMockAvailability,
  saveMockAvailability,
  isMockEmployeeAvailable,
};



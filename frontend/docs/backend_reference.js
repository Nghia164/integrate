/* eslint-disable no-unused-vars */
/**
 * BACKEND REFERENCE CODE - SMART SCHEDULING 2026
 * File: docs/backend_reference.js
 * 
 * TÀI LIỆU THAM KHẢO DÀNH CHO BACKEND DEVELOPER (PHP/LARAVEL).
 * TUYỆT ĐỐI KHÔNG IMPORT FILE NÀY VÀO SRC/.
 * 
 * File này gom toàn bộ code quy tắc nghiệp vụ, giải thuật xếp lịch tự động,
 * kiểm tra ràng buộc ca, khóa bảng lương bất biến, đồng bộ chéo giữa các màn hình
 * đã được loại bỏ khỏi Frontend.
 */

// =============================================================================
// 1. RÀNG BUỘC XẾP LỊCH & THỜI GIAN NGHỈ (SCHEDULING CONSTRAINTS)
// =============================================================================

/**
 * Kiểm tra 2 khoảng thời gian ca có bị chồng chéo hay không
 */
export function isShiftOverlapping(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Kiểm tra thời gian nghỉ giữa 2 ca tối thiểu 12 giờ
 * @param {string} prevShiftEndDateTime - ISO chuỗi kết thúc ca trước
 * @param {string} nextShiftStartDateTime - ISO chuỗi bắt đầu ca sau
 * @param {number} minRestHours - Mặc định 12 giờ
 */
export function validateMinimumRestPeriod(prevShiftEndDateTime, nextShiftStartDateTime, minRestHours = 12) {
  const prevEnd = new Date(prevShiftEndDateTime).getTime();
  const nextStart = new Date(nextShiftStartDateTime).getTime();
  const diffHours = (nextStart - prevEnd) / (1000 * 60 * 60);
  return {
    valid: diffHours >= minRestHours,
    restHours: diffHours,
    error: diffHours < minRestHours ? `Thời gian nghỉ giữa 2 ca chỉ có ${diffHours.toFixed(1)}h (yêu cầu tối thiểu ${minRestHours}h).` : null,
  };
}

/**
 * Giải thuật xếp ca tự động cơ bản (Greedy Schedule Solver)
 * @param {Array} employees - Danh sách nhân viên khả dụng (loại trừ 'Nghỉ việc')
 * @param {Array} shiftConfigs - Danh mục ca (Sáng, Chiều, Tối)
 * @param {Object} availabilities - Bản đồ đăng ký lịch rảnh theo nhân viên và ngày/ca
 * @param {Object} currentSchedule - Lịch tuần hiện tại
 */
export function autoScheduleSolver({ employees, shiftConfigs, availabilities, weekDays }) {
  const resultSchedule = {};
  const activeEmployees = employees.filter(e => e.status !== "Nghỉ việc");

  weekDays.forEach(dateStr => {
    resultSchedule[dateStr] = {};
    shiftConfigs.forEach(shift => {
      const needed = shift.minStaff || 1;
      const assigned = [];

      // 1. Lọc ứng viên có đăng ký rảnh (available)
      const candidates = activeEmployees.filter(emp => {
        const empAvail = availabilities[emp.id]?.[dateStr]?.[shift.name];
        return empAvail === "available" || empAvail === "rảnh";
      });

      // 2. Sắp xếp ưu tiên người có ít giờ làm hơn trong tuần (cân bằng tải)
      candidates.sort((a, b) => (a.weeklyHoursAssigned || 0) - (b.weeklyHoursAssigned || 0));

      for (const cand of candidates) {
        if (assigned.length >= needed) break;
        // Kiểm tra không trùng ca trong cùng 1 ngày
        const alreadyWorkingToday = Object.values(resultSchedule[dateStr]).some(sh => sh.includes(cand.id));
        if (!alreadyWorkingToday) {
          assigned.push(cand.id);
          cand.weeklyHoursAssigned = (cand.weeklyHoursAssigned || 0) + (shift.durationHours || 5);
        }
      }

      resultSchedule[dateStr][shift.name] = assigned;
    });
  });

  return resultSchedule;
}

// =============================================================================
// 2. QUY TRÌNH DUYỆT & ĐỒNG BỘ NGHỈ PHÉP (LEAVE REQUEST WORKFLOW)
// =============================================================================

/**
 * Logic đồng bộ khi duyệt đơn nghỉ phép
 * Khi Manager bấm APPROVE đơn nghỉ:
 * 1. Chuyển trạng thái đơn -> APPROVED
 * 2. Cập nhật tất cả ca trong ngày nghỉ của nhân viên trong bảng schedules -> 'On-Leave'
 * 3. Đánh dấu bản ghi attendance của ngày đó -> onLeave: true, absent: false
 * 4. Tự động sinh thông báo gửi cho nhân viên
 */
export function processLeaveApproval({ leaveRequest, schedules, attendanceList }) {
  // Cập nhật trạng thái đơn
  leaveRequest.status = "APPROVED";
  leaveRequest.handledAt = new Date().toISOString();

  // Đồng bộ ca làm việc
  const employeeShifts = schedules.filter(s => s.employeeId === leaveRequest.employeeId && s.date >= leaveRequest.startDate && s.date <= leaveRequest.endDate);
  employeeShifts.forEach(shift => {
    shift.status = "On-Leave";
  });

  // Đồng bộ chấm công (không tính là vắng)
  const attendanceRecords = attendanceList.filter(a => a.employeeId === leaveRequest.employeeId && a.date >= leaveRequest.startDate && a.date <= leaveRequest.endDate);
  attendanceRecords.forEach(att => {
    att.onLeave = true;
    att.status = "Nghỉ phép";
  });

  // Tạo thông báo
  const notification = {
    recipientUserId: leaveRequest.userId,
    title: "Đơn xin nghỉ phép đã được duyệt",
    content: `Đơn xin nghỉ từ ${leaveRequest.startDate} đến ${leaveRequest.endDate} của bạn đã được quản lý phê duyệt.`,
    type: "leave_approved",
    createdAt: new Date().toISOString(),
  };

  return { leaveRequest, affectedShifts: employeeShifts, notification };
}

// =============================================================================
// 3. QUY TRÌNH ĐỔI CA 2 BƯỚC (SHIFT EXCHANGE WORKFLOW)
// =============================================================================

/**
 * Hoán đổi ca trực giữa 2 nhân viên khi Quản lý duyệt
 */
export function processExchangeApproval({ exchangeRequest, schedulesTable, attendanceTable }) {
  if (exchangeRequest.status !== "PENDING_MANAGER") {
    throw new Error("Yêu cầu đổi ca chưa được nhân viên đối tác xác nhận.");
  }

  // Hoán đổi trong CSDL lịch làm việc
  const shiftA = schedulesTable.find(s => s.id === exchangeRequest.shiftAId);
  const shiftB = schedulesTable.find(s => s.id === exchangeRequest.shiftBId);

  if (!shiftA || !shiftB) {
    throw new Error("Không tìm thấy một trong hai ca trực cần hoán đổi.");
  }

  const originalEmpA = shiftA.employeeId;
  const originalEmpB = shiftB.employeeId;

  shiftA.employeeId = originalEmpB;
  shiftB.employeeId = originalEmpA;

  exchangeRequest.status = "APPROVED";
  exchangeRequest.resolvedAt = new Date().toISOString();

  // Tạo thông báo gửi cho cả 2 nhân viên
  const notifications = [
    {
      recipientUserId: exchangeRequest.userAId,
      title: "Đổi ca thành công",
      content: `Quản lý đã duyệt yêu cầu đổi ca ngày ${shiftA.date} với đồng nghiệp.`,
    },
    {
      recipientUserId: exchangeRequest.userBId,
      title: "Đổi ca thành công",
      content: `Quản lý đã duyệt yêu cầu đổi ca ngày ${shiftB.date} với đồng nghiệp.`,
    },
  ];

  return { shiftA, shiftB, exchangeRequest, notifications };
}

// =============================================================================
// 4. QUY TRÌNH CA TRỰC MỞ & BONUS (OPEN SHIFT CLAIMING)
// =============================================================================

/**
 * Xử lý nhận ca trực mở với khóa chống tranh chấp (Optimistic / Pessimistic Locking)
 */
export function claimOpenShift({ openShift, employee, existingEmployeeShifts }) {
  // 1. Kiểm tra trạng thái ca
  if (openShift.status !== "OPEN" || (openShift.claimedCount || 0) >= (openShift.neededCount || 1)) {
    throw new Error("ALREADY_CLAIMED: Ca trực mở đã đủ người nhận hoặc đã bị đóng.");
  }

  // 2. Kiểm tra vai trò phù hợp
  if (openShift.roleTag && employee.roleTag !== openShift.roleTag) {
    throw new Error("ROLE_MISMATCH: Vị trí của bạn không phù hợp với yêu cầu của ca này.");
  }

  // 3. Kiểm tra không trùng ca trong ngày
  const hasConflict = existingEmployeeShifts.some(s => s.date === openShift.date);
  if (hasConflict) {
    throw new Error("SHIFT_CONFLICT: Bạn đã có ca làm việc trong ngày này.");
  }

  // 4. Gán nhận ca
  openShift.claimedBy = openShift.claimedBy || [];
  openShift.claimedBy.push(employee.id);
  openShift.claimedCount = openShift.claimedBy.length;
  if (openShift.claimedCount >= openShift.neededCount) {
    openShift.status = "CLAIMED";
  }

  return {
    success: true,
    openShift,
    bonusEarned: openShift.bonusAmount || 0,
  };
}

// =============================================================================
// 5. CHẤM CÔNG & PHÂN LOẠI ĐỐI SOÁT (ATTENDANCE RECONCILIATION)
// =============================================================================

/**
 * Phân loại trạng thái ca đối soát: Upcoming, In-Progress, Completed, Absent
 */
export function evaluateAttendanceStatus({ shiftDate, shiftStartTime, shiftEndTime, checkInTime, checkOutTime, now = new Date() }) {
  const shiftStart = new Date(`${shiftDate}T${shiftStartTime}`);
  const shiftEnd = new Date(`${shiftDate}T${shiftEndTime}`);
  const currentTime = new Date(now);

  // Ca tương lai
  if (currentTime < shiftStart) {
    return { status: "Upcoming", isAbsent: false, isCompleted: false };
  }

  // Ca đang diễn ra
  if (currentTime >= shiftStart && currentTime <= shiftEnd) {
    return {
      status: "In-Progress",
      checkedIn: Boolean(checkInTime),
      isAbsent: false,
      isCompleted: false,
    };
  }

  // Ca đã qua giờ kết thúc
  if (currentTime > shiftEnd) {
    if (!checkInTime) {
      return { status: "Absent", isAbsent: true, isCompleted: true };
    }
    const checkIn = new Date(`${shiftDate}T${checkInTime}`);
    const isLate = checkIn > shiftStart;
    return {
      status: isLate ? "Late" : "On-Time",
      isAbsent: false,
      isCompleted: true,
      lateMinutes: isLate ? Math.round((checkIn - shiftStart) / 60000) : 0,
    };
  }

  return { status: "Unknown", isAbsent: false, isCompleted: false };
}

// =============================================================================
// 6. KHÓA BẢNG LƯƠNG BẤT BIẾN (PAYROLL LOCKING & SNAPSHOT)
// =============================================================================

/**
 * Khóa kỳ lương và đóng băng dữ liệu
 */
export function lockPayrollPeriod({ periodKey, payrollRecords, managerUserId }) {
  const snapshotData = {
    periodKey,
    lockedAt: new Date().toISOString(),
    lockedBy: managerUserId,
    totalEmployees: payrollRecords.length,
    totalGrossAmount: payrollRecords.reduce((sum, r) => sum + (r.netSalary || 0), 0),
    records: JSON.parse(JSON.stringify(payrollRecords)), // Bất biến hoàn toàn
  };

  return {
    status: "LOCKED",
    snapshot: snapshotData,
  };
}

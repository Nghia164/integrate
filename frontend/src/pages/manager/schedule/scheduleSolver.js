/**
 * Tầng: Xử lý logic nghiệp vụ xếp lịch (Schedule Solver / US11)
 * Mô phỏng thuật toán xếp lịch tự động OR-Tools tôn trọng lịch rảnh (US08/US09).
 * Ràng buộc:
 * 1. Đúng định biên vai trò (Role / Role_Tag).
 * 2. Chỉ chọn nhân viên có status "Đang làm việc" (loại bỏ "Nghỉ việc", "Nghỉ phép").
 * 3. Chỉ chọn nhân viên có đăng ký "available" trong tuần (isEmployeeAvailable === true).
 * 4. Nhân viên "Chưa đăng ký" coi như không rảnh (không xếp).
 * 5. Ca không có ai đủ điều kiện: để trống, đánh dấu thiếu người, không tự gán bừa.
 */
import { isEmployeeAvailable } from "../../../services/availabilityService.js";

/**
 * Kiểm tra nhân viên có khớp vai trò yêu cầu hay không
 * @param {object} emp - Đối tượng nhân viên
 * @param {string|null} roleName - Tên vai trò ("Phục vụ", "Pha chế", "Thu ngân")
 * @returns {boolean}
 */
export function isRoleMatch(emp, roleName) {
  if (!roleName) return true;
  if (!emp) return false;
  const roles = emp.roles || [emp.role || emp.roleTag];
  return roles.includes(roleName);
}

/**
 * Xếp lịch tự động bằng thuật toán OR-Tools mô phỏng (US11)
 *
 * @param {object} params
 * @param {object} params.currentSchedules - Bản đồ lịch hiện tại
 * @param {Array} params.shiftDemands - Cấu hình định biên nhu cầu từng ca
 * @param {Array} params.employeeRoster - Danh sách hồ sơ nhân sự
 * @param {string|Date} [params.weekKey] - Ngày Thứ 2 của tuần cần xếp lịch
 * @returns {object} Bản đồ lịch đã được xếp tự động
 */
export function autoScheduleORTools({ currentSchedules = {}, shiftDemands = [], employeeRoster = [], weekKey }) {
  const next = {};
  const dayKeys = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const shiftTypes = ["morning", "afternoon", "evening"];

  dayKeys.forEach((d) => {
    shiftTypes.forEach((sId) => {
      const key = `${sId}_${d}`;
      next[key] = {
        shiftId: sId,
        dayId: d,
        assigned: currentSchedules?.[key]?.assigned ? [...currentSchedules[key].assigned] : [],
      };
    });
  });

  Object.keys(next).forEach((key) => {
    const [sId, dayId] = key.split("_");
    const dayIndex = dayKeys.indexOf(dayId);
    const shiftName = sId === "morning" ? "Sáng" : sId === "afternoon" ? "Chiều" : "Tối";
    const demand = shiftDemands.find((d) => d.id === sId) || { phucVu: 1, phaChe: 1, thuNgan: 0, total: 2 };

    // 1. Lọc lại người đã gán sẵn: Phải "Đang làm việc" VÀ Rảnh (available) ca này
    next[key].assigned = next[key].assigned.filter((emp) => {
      if (!emp || emp.status !== "Đang làm việc") return false;
      return isEmployeeAvailable(emp.id, weekKey, dayIndex, shiftName);
    });

    // 2. Tính số lượng từng vai trò còn thiếu theo định biên
    const pvCurrent = next[key].assigned.filter((e) => isRoleMatch(e, "Phục vụ")).length;
    const pcCurrent = next[key].assigned.filter((e) => isRoleMatch(e, "Pha chế")).length;
    const tnCurrent = next[key].assigned.filter((e) => isRoleMatch(e, "Thu ngân")).length;

    const neededRoles = [];
    for (let i = pvCurrent; i < (demand.phucVu || 0); i++) neededRoles.push("Phục vụ");
    for (let i = pcCurrent; i < (demand.phaChe || 0); i++) neededRoles.push("Pha chế");
    for (let i = tnCurrent; i < (demand.thuNgan || 0); i++) neededRoles.push("Thu ngân");

    const remainingSlots = Math.max(0, demand.total - (next[key].assigned.length + neededRoles.length));
    for (let i = 0; i < remainingSlots; i++) neededRoles.push(null);

    // 3. Tìm ứng viên thỏa mãn: đúng vai trò, Đang làm việc, chưa có trong ca, và Rảnh
    for (const role of neededRoles) {
      const candidate = employeeRoster.find((r) => {
        if (!r || r.status !== "Đang làm việc") return false;
        if (!isRoleMatch(r, role)) return false;
        if (next[key].assigned.some((a) => a.id === r.id)) return false;
        return isEmployeeAvailable(r.id, weekKey, dayIndex, shiftName);
      });

      if (candidate) {
        next[key].assigned.push(candidate);
      }
      // Nếu không có ứng viên: vị trí này để trống, tự động thành "thiếu người"
    }
  });

  return next;
}

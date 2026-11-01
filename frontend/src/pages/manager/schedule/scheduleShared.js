// ==========================================
// DỮ LIỆU & TIỆN ÍCH DÙNG CHUNG CHO LỊCH LÀM VIỆC
// Tái xuất từ tầng Service & Mock chuẩn hóa
// ==========================================

export { SCHEDULE_TABS } from "../../../components/PageKit";

export {
  employeeRoster,
  getWeekDays,
  getCurrentWeekLabel,
  initialDays,
  initialShiftDemands,
  initialConstraints,
  DAILY_SHIFT_REQUIREMENTS,
  generateInitialSchedules,
  getSavedSchedules,
  saveSchedules,
  confirmSchedule,
  isScheduleConfirmed,
  getShiftInfo,
  roleBadgeClass,
  mergeConfigConstraints,
  mergeConfigShifts,
  WEEK_LABEL,
} from "../../../services/scheduleService";

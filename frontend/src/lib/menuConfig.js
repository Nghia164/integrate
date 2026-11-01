/**
 * File: src/lib/menuConfig.js
 * Cấu hình menu điều hướng cho Manager và Staff
 */

export const MENU_GROUPS = [
  {
    title: "Chính",
    items: [
      { to: "/manager/dashboard", icon: "home", label: "Tổng quan" },
    ],
  },
  {
    title: "Lịch và ca",
    items: [
      { to: "/manager/shift-config", icon: "sliders", label: "Ca & ràng buộc" },
      { to: "/manager/availability", icon: "calendarClock", label: "Khả năng làm việc" },
      {
        label: "Lịch làm việc",
        icon: "calendar",
        matchPaths: ["/manager/schedule", "/manager/schedule/created"],
        children: [
          { to: "/manager/schedule", label: "Tạo lịch tự động" },
          { to: "/manager/schedule/created", label: "Lịch đã tạo" },
        ],
      },
      { to: "/manager/shift-exchange", icon: "swap", label: "Đổi ca" },
      { to: "/manager/open-shifts", icon: "userPlus", label: "Ca trực mở" },
    ],
  },
  {
    title: "Nhân sự",
    items: [
      { to: "/manager/employees", icon: "users", label: "Quản lý nhân viên" },
      { to: "/manager/leave", icon: "fileText", label: "Đơn xin nghỉ" },
      {
        label: "Chấm công & Giờ làm",
        icon: "clipboardCheck",
        matchPaths: ["/manager/attendance", "/manager/work-hours"],
        children: [
          { to: "/manager/attendance", label: "Chấm công" },
          { to: "/manager/work-hours", label: "Giờ làm" },
        ],
      },
    ],
  },
  {
    title: "Tài chính",
    items: [
      { to: "/manager/payroll", icon: "wallet", label: "Tính lương" },
      { to: "/manager/reports", icon: "chart", label: "Báo cáo" },
    ],
  },
  {
    title: "Công cụ",
    items: [
      { to: "/manager/assistant", icon: "sparkles", label: "Trợ lý AI" },
    ],
  },
];

export const SCHEDULE_TABS = [
  { to: "/manager/schedule", label: "Tạo lịch tự động" },
  { to: "/manager/schedule/created", label: "Lịch đã tạo" },
];

export const ATTENDANCE_TABS = [
  { to: "/manager/attendance", label: "Chấm công" },
  { to: "/manager/work-hours", label: "Giờ làm" },
];

export const HR_TABS = ATTENDANCE_TABS;

export function getPageTitle(pathname) {
  if (pathname.startsWith("/manager/availability")) return "Khả năng làm việc";
  if (pathname === "/manager/schedule" || pathname === "/manager/schedule/") return "Tạo lịch tự động";
  if (pathname.startsWith("/manager/schedule/created")) return "Lịch đã tạo";
  if (pathname.startsWith("/manager/attendance")) return "Chấm công";
  if (pathname.startsWith("/manager/work-hours")) return "Giờ làm";
  if (pathname.startsWith("/manager/shift-config")) return "Ca & ràng buộc";
  if (pathname.startsWith("/manager/shift-exchange")) return "Đổi ca";
  if (pathname.startsWith("/manager/open-shifts")) return "Ca trực mở";
  if (pathname.startsWith("/manager/employees")) return "Quản lý nhân viên";
  if (pathname.startsWith("/manager/leave")) return "Đơn xin nghỉ";
  if (pathname.startsWith("/manager/payroll")) return "Tính lương";
  if (pathname.startsWith("/manager/reports")) return "Báo cáo";
  if (pathname.startsWith("/manager/assistant")) return "Trợ lý AI";
  if (pathname.startsWith("/manager/notifications") || pathname.startsWith("/employees/notifications")) return "Thông báo";
  if (pathname.startsWith("/manager/dashboard") || pathname === "/manager" || pathname === "/manager/") return "Tổng quan";
  return "Tổng quan";
}

export function getBreadcrumbItems(pathname) {
  if (pathname.startsWith("/manager/availability")) {
    return [{ label: "Khả năng làm việc" }];
  }
  if (pathname === "/manager/schedule" || pathname === "/manager/schedule/") {
    return [
      { label: "Lịch làm việc", to: "/manager/schedule" },
      { label: "Tạo lịch tự động" },
    ];
  }
  if (pathname === "/manager/schedule/created" || pathname.startsWith("/manager/schedule/created")) {
    return [
      { label: "Lịch làm việc", to: "/manager/schedule" },
      { label: "Lịch đã tạo" },
    ];
  }
  if (pathname === "/manager/attendance" || pathname.startsWith("/manager/attendance/")) {
    return [
      { label: "Chấm công & Giờ làm", to: "/manager/attendance" },
      { label: "Chấm công" },
    ];
  }
  if (pathname === "/manager/work-hours" || pathname.startsWith("/manager/work-hours/")) {
    return [
      { label: "Chấm công & Giờ làm", to: "/manager/attendance" },
      { label: "Giờ làm" },
    ];
  }

  const SINGLE_PAGES = {
    "/manager/dashboard": "Tổng quan",
    "/manager/availability": "Khả năng làm việc",
    "/manager/shift-config": "Ca & ràng buộc",
    "/manager/shift-exchange": "Đổi ca",
    "/manager/open-shifts": "Ca trực mở",
    "/manager/employees": "Quản lý nhân viên",
    "/manager/leave": "Đơn xin nghỉ",
    "/manager/payroll": "Tính lương",
    "/manager/reports": "Báo cáo",
    "/manager/assistant": "Trợ lý AI",
    "/manager/notifications": "Thông báo",
  };

  const matched = Object.entries(SINGLE_PAGES).find(
    ([path]) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (matched) {
    return [{ label: matched[1] }];
  }

  return [{ label: "Tổng quan" }];
}

export const MANAGER_MENU = MENU_GROUPS;

export const EMPLOYEE_MENU = [
  { path: "/employees/schedule", label: "Lịch của tôi", icon: "schedule" },
  { path: "/employees/availability", label: "Đăng ký lịch rảnh", icon: "availability" },
  { path: "/employees/shift-exchange", label: "Đổi ca", icon: "shiftExchange" },
  { path: "/employees/open-shifts", label: "Ca trực mở", icon: "openShifts" },
  { path: "/employees/leave", label: "Nghỉ phép", icon: "leave" },
  { path: "/employees/attendance", label: "Chấm công của tôi", icon: "attendance" },
  { path: "/employees/profile", label: "Hồ sơ cá nhân", icon: "profile" },
];

export default {
  MENU_GROUPS,
  SCHEDULE_TABS,
  ATTENDANCE_TABS,
  HR_TABS,
  getPageTitle,
  getBreadcrumbItems,
  MANAGER_MENU,
  EMPLOYEE_MENU,
};

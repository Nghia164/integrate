# BẢN ĐỒ TÍCH HỢP TÍNH NĂNG VÀ API (FEATURE MAP)

> **Mục tiêu**: Bảng đối chiếu dành cho Dev Backend nhận bàn giao frontend. Nhìn vào bảng này, backend biết chính xác cần triển khai những REST API / Controller nào cho từng trang Manager và Staff, kết nối tương ứng với file Service và Mock mẫu hiện tại.

---

## BẢNG ÁNH XẠ CHỨC NĂNG (FEATURE TO API MATRIX)

| Mã US | Tính năng (Feature) | Manager Page | Staff Page | Service (`src/services/`) | Mock File (`src/mocks/`) | Gợi ý REST API Backend |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **US01 - US03** | Xác thực & Tài khoản (Login, Logout, Change Password) | `src/pages/login/LoginPage.jsx` | `src/pages/login/LoginPage.jsx` | `authService.js` | `authMock.js` | `POST /api/login`<br>`POST /api/logout`<br>`POST /api/change-password`<br>`GET /api/me` |
| **US04, US05** | Quản lý nhân viên (CRUD, Hồ sơ, Khóa NV nghỉ việc) | `src/pages/manager/employees/EmployeeListPage.jsx` | `src/pages/employees/profile/ProfilePage.jsx` | `employeeService.js` | `employeeMock.js` | `GET /api/employees`<br>`POST /api/employees`<br>`PUT /api/employees/:id`<br>`GET /api/profile` |
| **US06, US07** | Cấu hình ca & Ràng buộc (Shift Catalog, Constraints) | `src/pages/manager/shiftconfig/ShiftConfigPage.jsx` | — | `shiftConfigService.js` | `shiftConfigMock.js` | `GET /api/shift-configs`<br>`PUT /api/shift-configs` |
| **US08, US09** | Khả năng làm việc (Đăng ký rảnh/bận, Duyệt lịch rảnh) | `src/pages/manager/availability/AvailabilityPage.jsx` | `src/pages/employees/availability/AvailabilityPage.jsx` | `availabilityService.js` | `availabilityMock.js` | `GET /api/availability/staff`<br>`GET /api/availability/my`<br>`POST /api/availability/my`<br>`PUT /api/availability/:id/status` |
| **US10, US11** | Xếp lịch tự động (Tạo lịch, Giải thuật phân ca) | `src/pages/manager/schedule/SchedulePage.jsx` | — | `scheduleService.js` | `scheduleMock.js` | `POST /api/schedules/generate`<br>`POST /api/schedules/draft` |
| **US12, US13** | Lịch làm việc công bố (US12 - Manager) & Lịch của tôi (US13 - Staff) | `src/pages/manager/schedule/CreatedSchedulePage.jsx` | `src/pages/employees/schedule/MySchedulePage.jsx` | `scheduleService.js` | `scheduleMock.js` | `GET /api/schedules/week`<br>`POST /api/schedules/publish`<br>`GET /api/schedules/my` |
| **US14** | Tổng hợp giờ làm việc (Tổng giờ, OT, Đi muộn/về sớm) | `src/pages/manager/workHours/WorkHoursPage.jsx` | — | `workHoursService.js` | `workHoursMock.js` | `GET /api/work-hours/summary`<br>`GET /api/work-hours/detail/:id` |
| **US15 - US17** | Đổi ca làm việc (Yêu cầu, Đồng nghiệp phản hồi, QL duyệt) | `src/pages/manager/shiftExchange/ShiftExchangePage.jsx` | `src/pages/employees/shiftExchange/ShiftExchangePage.jsx` | `shiftExchangeService.js` | `shiftExchangeMock.js` | `GET /api/shift-exchanges`<br>`POST /api/shift-exchanges`<br>`PUT /api/shift-exchanges/:id/respond`<br>`PUT /api/shift-exchanges/:id/approve` |
| **US18, US19** | Ca trực mở (Đăng ca mở, Staff nhận ca, Race condition) | `src/pages/manager/openshifts/OpenShiftPage.jsx` | `src/pages/employees/openShifts/OpenShiftsPage.jsx` | `openShiftService.js` | `openShiftMock.js` | `GET /api/open-shifts`<br>`POST /api/open-shifts`<br>`PUT /api/open-shifts/:id/cancel`<br>`POST /api/open-shifts/:id/claim` |
| **US20, US21** | Đơn xin nghỉ phép (Gửi đơn, Duyệt/Từ chối, Gợi ý người thay) | `src/pages/manager/leave/LeavePage.jsx` | `src/pages/employees/leave/LeavePage.jsx` | `leaveService.js` | `leaveMock.js` | `GET /api/leaves`<br>`POST /api/leaves`<br>`PUT /api/leaves/:id/approve`<br>`PUT /api/leaves/:id/reject` |
| **US22, US23** | Gợi ý người thay thế & Trợ lý ảo AI | `src/pages/manager/assistant/AssistantPage.jsx` | — | `replacementService.js`<br>`assistantService.js` | `assistantMock.js` | `POST /api/ai/recommend-replacements`<br>`POST /api/ai/assistant/chat` |
| **US24 - US26** | Chấm công & Giải trình (GPS Check-in, Đối soát, Sửa giờ) | `src/pages/manager/attendance/AttendancePage.jsx` | `src/pages/employees/attendance/AttendancePage.jsx` | `attendanceService.js` | `attendanceMock.js` | `GET /api/attendance`<br>`POST /api/attendance/check-in`<br>`POST /api/attendance/check-out`<br>`POST /api/attendance/adjust`<br>`POST /api/attendance/explanation` |
| **US27** | Bảng lương & Chốt lương (Snapshot, Khóa kỳ lương) | `src/pages/manager/payroll/PayrollPage.jsx` | — | `payrollService.js` | `payrollMock.js` | `GET /api/payroll`<br>`POST /api/payroll/lock`<br>`POST /api/payroll/unlock` |
| **US28** | Dashboard & Thống kê tổng quan (KPIs, Cảnh báo thiếu ca) | `src/pages/manager/dashboard/DashboardPage.jsx` | — | `dashboardService.js` | `dashboardMock.js` | `GET /api/dashboard/summary`<br>`GET /api/dashboard/alerts` |
| **US29** | Báo cáo & Xuất dữ liệu Excel | `src/pages/manager/reports/ReportPage.jsx` | — | `reportService.js` | `reportMock.js` | `GET /api/reports/analytics`<br>`GET /api/reports/export-excel` |
| **Thông báo** | Thông báo trong ứng dụng (In-app Notification) | Header Bell / `src/pages/notifications/NotificationsPage.jsx` | Header Bell / `src/pages/notifications/NotificationsPage.jsx` | `notificationService.js` | `notificationMock.js` | `GET /api/notifications`<br>`PUT /api/notifications/:id/read` |

---

## NGUYÊN TẮC BÀN GIAO:
1. **Frontend chỉ gọi Service**: Toàn bộ UI component và Page không được import trực tiếp từ `src/mocks/`. Mọi dữ liệu đi qua tầng `src/services/`.
2. **Backend giữ nguyên chữ ký hàm**: Khi backend viết API xong, chỉ cần vào các file `src/services/`, thay ruột hàm bằng `httpClient.get/post/put/delete`, giữ nguyên tên hàm, tham số và cấu trúc dữ liệu trả về.

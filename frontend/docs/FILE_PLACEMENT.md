# QUY CHUẨN CẤU TRÚC VÀ VỊ TRÍ FILE (FILE PLACEMENT RULES)

> **Dự án**: Smart Scheduling (Frontend-Only Architecture)  
> **Nguyên tắc cốt lõi**: FRONTEND CHỈ CÒN GIAO DIỆN + DỮ LIỆU MẪU ĐỘC LẬP.  
> Không còn engine `db.js`, không còn lưu trữ chéo `localStorage`, không còn thư mục vụn.

---

## 1. CÁC THƯ MỤC HỢP LỆ TRONG `src/` (CHỈ ĐƯỢC PHÉP 7 THƯ MỤC)

Hệ thống tuân thủ nghiêm ngặt chỉ bao gồm 7 thư mục chức năng dưới đây:

| Thư mục | Trách nhiệm chính | Quy tắc & Giới hạn |
| :--- | :--- | :--- |
| `src/components/` | Các bộ công cụ giao diện (UI Kits) dùng chung toàn dự án | **Tối đa ~8 file**: `PageKit.jsx`, `TableKit.jsx`, `FormKit.jsx`, `CalendarKit.jsx`, `NoticeKit.jsx`, `AppShell.jsx`, `calendarStyles.css`, `index.js`. |
| `src/lib/` | Thư viện nền tảng: formatters, dateUtils, tokens, constants, menuConfig, geoUtils, validators, searchUtils | Các file tiện ích thuần túy (pure functions), gom theo chủ đề. Không chứa state nghiệp vụ. |
| `src/layouts/` | Khung điều hướng chính của hệ thống: `ManagerLayout.jsx`, `EmployeeLayout.jsx` | Sử dụng `AppShell` và cấu hình menu từ `lib/menuConfig.js`. |
| `src/context/` | Quản lý state ngữ cảnh toàn cục: `AuthContext.jsx` | Chỉ lưu trữ phiên đăng nhập và thông tin người dùng hiện tại. |
| `src/pages/` | Màn hình giao diện nghiệp vụ theo vai trò (`login`, `manager`, `employees`, `notifications`) | Xem chi tiết quy chuẩn cấu trúc `src/pages/` ở mục 2. |
| `src/services/` | Tầng giao tiếp dữ liệu của từng tính năng | Gọi mock mẫu (hoặc REST API sau này). Mỗi hàm đều có ghi chú `// BACKEND: <nhiệm vụ backend>` và chỉ thực hiện local state mutation cho UI hoạt động được. |
| `src/mocks/` | Dữ liệu mẫu tĩnh (Flat Mocks) độc lập cho từng tính năng | File dạng `<tên>Mock.js`. Độc lập hoàn toàn, không phụ thuộc vào nhau, không có cơ chế `db.js` hay `localStorage`. Chỉ `src/services/` được import từ đây. |

---

## 2. QUY CHUẨN CẤU TRÚC `src/pages/`

Các màn hình được tổ chức theo thư mục vai trò và nghiệp vụ, mỗi thư mục camelCase chứa tối đa 3-4 file (`<Ten>Page.jsx`, `<Ten>Modals.jsx`, `<ten>Helpers.js(x)`), tuyệt đối không lồng thư mục `components/` hay `hooks/`:

1. **`src/pages/login/`**: Màn hình đăng nhập (`LoginPage.jsx`, `MustChangePasswordScreen.jsx`).
2. **`src/pages/manager/`**: Màn hình dành cho Quản lý:
   - `dashboard/`, `employees/`, `shiftconfig/`, `availability/`, `schedule/`, `workHours/`, `shiftExchange/`, `openshifts/`, `leave/`, `attendance/`, `payroll/`, `reports/`.
3. **`src/pages/employees/`**: Màn hình dành cho Nhân viên (đồng bộ tên với Manager):
   - `schedule/`: `MySchedulePage.jsx` (Lịch của tôi)
   - `availability/`: `AvailabilityPage.jsx`, `AvailabilityModals.jsx`, `availabilityHelpers.js` (Đăng ký rảnh/bận)
   - `shiftExchange/`: `ShiftExchangePage.jsx`, `ShiftExchangeModals.jsx`, `shiftExchangeHelpers.js` (Đổi ca)
   - `openShifts/`: `OpenShiftsPage.jsx`, `OpenShiftsModals.jsx`, `openShiftsHelpers.js` (Ca trực mở)
   - `leave/`: `LeavePage.jsx`, `LeaveModals.jsx`, `leaveHelpers.js` (Đơn xin nghỉ phép)
   - `attendance/`: `AttendancePage.jsx`, `AttendanceModals.jsx`, `attendanceHelpers.jsx` (Chấm công GPS & giải trình)
   - `profile/`: `ProfilePage.jsx`, `ProfileModals.jsx`, `profileHelpers.js` (Hồ sơ cá nhân & đổi mật khẩu)
4. **`src/pages/notifications/`**: `NotificationsPage.jsx` (Màn hình trung tâm thông báo).
   - **Lý do ngoại lệ**: Đây là thư mục ngoại lệ DUY NHẤT nằm ngoài `login/`, `manager/`, `employees/` vì dùng chung đồng nhất giao diện và logic thông báo cho cả 2 vai trò Quản lý và Nhân viên, tránh nhân bản file và giảm thiểu sai lệch trạng thái.

---

## 3. CÁC THƯ MỤC ĐÃ BỊ LOẠI BỎ HOÀN TOÀN (CẤM TẠO LẠI)

- ❌ `src/shared/`: Đã được gộp vào `src/components/` (các file Kit) và `src/lib/`.
- ❌ `src/constants/`: Đã được gộp vào `src/lib/constants.js` và `src/lib/menuConfig.js`.
- ❌ `src/utils/`: Đã được gộp vào `src/lib/dateUtils.js`, `src/lib/formatters.js`, `src/lib/exportExcel.js`, `src/lib/geoUtils.js`.
- ❌ `src/domain/`: Đã được chuyển giao tài liệu sang `docs/backend_reference.js` và `src/lib/statusLabels.js`.
- ❌ `src/hooks/`: Hook dùng chung chuyển về `src/lib/hooks.js`, hook dùng 1 nơi được gộp trực tiếp vào trang tương ứng.
- ❌ `src/services/adapters/`: Đã bị xóa bỏ hoàn toàn. Lỗi `errors.js` đặt trực tiếp tại `src/services/errors.js`.

---

## 4. CÁC NGUYÊN TẮC IMPORT BẮT BUỘC

1. **Pages không bao giờ import từ `src/mocks/`**: Mọi truy xuất dữ liệu của Page và Component bắt buộc phải thông qua `src/services/`.
2. **Kits dùng chung**: Các trang import thành phần giao diện từ `src/components/` hoặc cụ thể `FormKit`, `TableKit`, `PageKit`, `CalendarKit`, `NoticeKit`.
3. **Không tạo cơ chế lưu trữ chéo (Cross-screen mutations)**: Các service không được tự ý sửa mảng dữ liệu của service khác trong bộ nhớ frontend. Toàn bộ logic liên kết giữa các màn hình phải do backend phụ trách.
4. **Quy ước header và phân vùng**:
   - Header đầu file: `/** FILE NÀY LÀM GÌ: ... | Loại: ... | US: ... */`
   - Phân vùng JSX: `{/* ===== TÊN VÙNG ===== */}`

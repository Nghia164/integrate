# HƯỚNG DẪN KẾT NỐI VÀ CHUYỂN ĐỔI SANG BACKEND (MIGRATE_TO_BACKEND)

> **Dành cho**: Đội ngũ phát triển Backend (PHP / Laravel / Node.js) khi tiếp nhận mã nguồn frontend.  
> **Trạng thái frontend**: Frontend hiện tại đã được tách rời 100% khỏi logic cơ sở dữ liệu giả lập. Giao diện (UI) và dịch vụ (Services) đã sẵn sàng tích hợp REST API thực tế.

---

## 1. QUY TRÌNH 3 BƯỚC TÍCH HỢP

### Bước 1: Khởi tạo Backend và cấu hình biến môi trường
1. Tạo file `.env` tại thư mục gốc frontend:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```
2. Frontend đã có sẵn `src/services/httpClient.js` sử dụng Axios, tự động đính kèm Bearer Token từ `localStorage.getItem("token")` trong mọi request và bắt lỗi 401.

### Bước 2: Thay thế ruột Service bằng HTTP calls (Giữ nguyên chữ ký hàm)
- **Quy tắc vàng**: Không thay đổi tên hàm, số lượng tham số, và định dạng dữ liệu trả về của các hàm trong `src/services/`.
- **Ví dụ mẫu**:
  *Trước khi tích hợp (hiện tại - dùng mock):*
  ```javascript
  // src/services/leaveService.js
  export async function getLeaveRequests(filter) {
    // BACKEND: Trả về danh sách đơn nghỉ phép theo filter
    return [...mockLeaveRequests];
  }
  ```
  *Sau khi tích hợp (thực tế - gọi Backend API):*
  ```javascript
  // src/services/leaveService.js
  import httpClient from "./httpClient";

  export async function getLeaveRequests(filter) {
    const response = await httpClient.get("/leaves", { params: filter });
    return response.data; // trả về mảng dữ liệu chuẩn
  }
  ```

### Bước 3: Xóa bỏ thư mục `src/mocks/`
Khi tất cả các dịch vụ trong `src/services/` đã được chuyển sang gọi `httpClient`:
1. Xóa toàn bộ thư mục `src/mocks/`.
2. Kiểm tra lại bằng lệnh:
   ```bash
   npm run build
   npm run lint
   ```
3. Hệ thống hoạt động 100% bằng dữ liệu thực từ CSDL máy chủ.

---

## 2. DANH SÁCH ENDPOINTS CẦN XÂY DỰNG TRÊN BACKEND

Dựa trên bảng nghiệp vụ chi tiết tại `docs/BACKEND_TODO.md` và mã tham chiếu tại `docs/backend_reference.js`, backend cần triển khai các nhóm API sau:

### 1. Nhóm Xác thực & Tài khoản (`/api/auth`)
- `POST /api/login`: Đăng nhập, kiểm tra hash mật khẩu, cấp Bearer Token.
- `POST /api/logout`: Thu hồi token.
- `POST /api/change-password`: Đổi mật khẩu.
- `GET /api/me`: Lấy thông tin phiên người dùng hiện tại.

### 2. Nhóm Nhân viên (`/api/employees`)
- `GET /api/employees`: Danh sách nhân viên (hỗ trợ lọc vai trò, hợp đồng, trạng thái).
- `POST /api/employees`: Thêm nhân viên mới (Transaction tạo `users` và `employees`).
- `PUT /api/employees/:id`: Cập nhật thông tin nhân viên. Nếu chuyển trạng thái "Nghỉ việc", khóa tài khoản và thu hồi token ngay.

### 3. Nhóm Cấu hình ca (`/api/shift-configs`)
- `GET /api/shift-configs`: Lấy danh mục ca (Sáng, Chiều, Tối), hệ số lương và định biên.
- `PUT /api/shift-configs`: Cập nhật cấu hình ca làm việc.

### 4. Nhóm Khả năng làm việc (`/api/availability`)
- `GET /api/availability/my`: Staff lấy lịch rảnh của mình theo tuần.
- `POST /api/availability/my`: Staff nộp đăng ký rảnh/bận (Kiểm tra hạn chót Thứ 6 23:59:59).
- `GET /api/availability/staff`: Manager xem bảng tổng hợp lịch rảnh của toàn bộ nhân viên.
- `PUT /api/availability/:id/status`: Manager duyệt/từ chối lịch đăng ký.

### 5. Nhóm Xếp lịch tuần (`/api/schedules`)
- `POST /api/schedules/generate`: Chạy giải thuật xếp lịch tự động (tham khảo mã OR-Tools tại `docs/backend_reference.js`).
- `GET /api/schedules/week`: Lấy bản đồ lịch tuần (hỗ trợ draft và published).
- `POST /api/schedules/publish`: Công bố lịch làm việc và bắn thông báo cho nhân viên.
- `GET /api/schedules/my`: Staff xem lịch làm việc cá nhân của tuần.

### 6. Nhóm Đổi ca (`/api/shift-exchanges`)
- `POST /api/shift-exchanges`: Staff tạo đơn xin đổi ca (Kiểm tra điều kiện nghỉ $\ge 12$h và không trùng ca).
- `PUT /api/shift-exchanges/:id/respond`: Đồng nghiệp phản hồi đồng ý hoặc từ chối.
- `PUT /api/shift-exchanges/:id/approve`: Quản lý duyệt đổi ca $\rightarrow$ Backend hoán đổi `employee_id` của 2 ca trong bảng `schedules` và đồng bộ `attendance`.

### 7. Nhóm Ca trực mở (`/api/open-shifts`)
- `GET /api/open-shifts`: Danh sách ca mở.
- `POST /api/open-shifts`: Manager tạo ca trực mở.
- `POST /api/open-shifts/:id/claim`: Staff nhận ca trực mở (Xử lý chống nghẽn / Race condition bằng `SELECT ... FOR UPDATE` hoặc Optimistic Locking, kiểm tra đúng Role_Tag, gán ca và cộng thưởng vào lương).

### 8. Nhóm Nghỉ phép (`/api/leaves`)
- `POST /api/leaves`: Staff gửi đơn xin nghỉ phép.
- `PUT /api/leaves/:id/approve`: Quản lý duyệt đơn $\rightarrow$ Backend cập nhật ca sang `On-Leave` và đánh dấu chấm công `on_leave = true` (không tính là vắng).
- `PUT /api/leaves/:id/reject`: Quản lý từ chối đơn kèm lý do.

### 9. Nhóm Chấm công & Giờ làm (`/api/attendance`)
- `POST /api/attendance/check-in`: Ghi nhận GPS/thời gian check-in, tính trạng thái On-Time / Late.
- `POST /api/attendance/check-out`: Ghi nhận check-out, tính số giờ làm thực tế.
- `POST /api/attendance/adjust`: Quản lý sửa giờ chấm công $\rightarrow$ Ghi sổ kiểm toán `attendance_adjustments`.
- `GET /api/work-hours/summary`: Tổng hợp giờ làm, giờ tăng ca, số lần đi muộn/về sớm.

### 10. Nhóm Bảng lương (`/api/payroll`)
- `GET /api/payroll`: Tính động lương từ các ca đã kết thúc.
- `POST /api/payroll/lock`: Chốt bảng lương $\rightarrow$ Tạo snapshot bất biến, khóa mọi thao tác sửa chấm công/đổi ca của kỳ đã chốt.
- `POST /api/payroll/unlock`: Mở chốt bảng lương.

### 11. Nhóm Dashboard, Báo cáo & Thông báo
- `GET /api/dashboard/summary`: Trả về các chỉ số KPI, tỷ lệ lấp đầy, chi phí dự kiến, cảnh báo thiếu người.
- `GET /api/reports`: Dữ liệu phân tích báo cáo theo kỳ.
- `GET /api/notifications`: Lấy danh sách thông báo của người dùng.
- `PUT /api/notifications/:id/read`: Đánh dấu thông báo đã đọc.

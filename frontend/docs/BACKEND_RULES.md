# TÀI LIỆU QUY TẮC NGHIỆP VỤ CHO BACKEND PHP (SMART SCHEDULING 2026)

> [!IMPORTANT]
> **Nguyên tắc cốt lõi**: Giao diện (Frontend) **CHỈ** hiển thị dữ liệu và gửi yêu cầu, **TUYỆT ĐỐI KHÔNG** tự quyết định hay tự xử lý các quy tắc nghiệp vụ.
> Toàn bộ các quy tắc liệt kê dưới đây hiện được kiểm soát bởi tầng `mockAdapter` và **BẮT BUỘC** phải được backend PHP triển khai đầy đủ khi thay thế mock.

---

## 1. XÁC THỰC, PHÂN QUYỀN & QUẢN LÝ TÀI KHOẢN (RBAC & AUTH)

### 1.1 Tách biệt Bảng Tài khoản (`users`) và Bảng Nhân sự (`employees`)
- **Vị trí mock đối chiếu**: `src/mocks/db.js`, `src/mocks/authMock.js`, `docs/DB_SCHEMA.sql`
- **Quy tắc**:
  - Bảng `users` lưu thông tin xác thực: `id`, `email`, `password_hash`, `role` (`'manager'` | `'staff'`), `status` (`'active'` | `'inactive'`), `created_at`, `updated_at`.
  - Bảng `employees` lưu hồ sơ làm việc theo ca: `id`, `user_id`, `name`, `phone`, `birth_date`, `contract`, `role`, `role_tag`, `hourly_wage`, `status` (`'Đang làm việc'` | `'Nghỉ việc'` | `'Nghỉ phép'`), `avatar`.
  - `employees.user_id` là khóa ngoại trỏ đến `users.id` (1 - 1).

### 1.2 Tài khoản Quản lý (Manager) độc lập
- **Vị trí mock**: `src/mocks/db.js` (tài khoản `USR-MGR-001`, `quanly@smartscheduling.vn`).
- **Quy tắc**:
  - Tài khoản Quản lý **CHỈ** tồn tại trong bảng `users`, **KHÔNG** có bản ghi tương ứng trong bảng `employees`.
  - Quản lý **không bao giờ** xuất hiện trong danh sách nhân viên làm việc theo ca, không có giờ làm việc, không có chấm công, không nhận ca mở, không đổi ca và không có trong bảng lương.
  - Frontend không cung cấp chức năng tạo Quản lý; tài khoản Quản lý do seeder CSDL hoặc Quản trị viên cấp cao khởi tạo.

### 1.3 Quy tắc Đăng nhập (`POST /api/auth/login`)
- **Vị trí mock**: `src/mocks/authMock.js` (`mockLogin`)
- **Quy tắc**:
  - Tiếp nhận `email` và `password`. **ĐĂNG NHẬP CHỈ BẰNG EMAIL DO MANAGER CẤP**. Tuyệt đối không cho phép đăng nhập bằng mã nhân viên hay mã quản lý (như NV001, QL001). Mã nhân viên chỉ là định danh nội bộ trong hồ sơ nhân sự, không dùng làm thông tin xác thực.
  - Không truyền và không chấp nhận trường `role` từ client; vai trò do CSDL quyết định hoàn toàn.
  - So khớp mật khẩu với hàm băm an toàn (`password_verify` trong PHP).
  - Nếu `users.status === 'inactive'`: Chặn đăng nhập với mã lỗi `ACCOUNT_DISABLED` (HTTP 403).
  - Nếu sai tài khoản hoặc mật khẩu: Trả về thông báo chung `"Tài khoản hoặc mật khẩu không đúng."` kèm mã lỗi `INVALID_CREDENTIALS` (HTTP 401) để phòng tránh tấn công dò user (Username Enumeration).
  - Trả về: `{ user: { id, email, role, name, employeeId, avatar, status }, token }`. **TUYỆT ĐỐI KHÔNG** trả về trường `password` / `password_hash`.

### 1.4 Tạo và Cập nhật Nhân viên (`POST /api/employees`, `PUT /api/employees/:id`)
- **Vị trí mock**: `src/mocks/mockAdapter.js` (`createEmployee`, `updateEmployee`)
- **Quy tắc**:
  - **Tính toàn vẹn giao dịch (Database Transaction)**: Khi tạo nhân viên mới, backend phải tạo bản ghi `users` và `employees` trong cùng 1 transaction; nếu có bất kỳ lỗi nào xảy ra thì `rollback` toàn bộ.
  - **Duy nhất Email**: `users.email` phải là `UNIQUE`. Nếu email đã tồn tại, chặn ngay và trả về lỗi `EMAIL_EXISTS` (HTTP 409).
  - **Mật khẩu tối thiểu**: Mật khẩu khi tạo mới hoặc khi cập nhật phải có tối thiểu 8 ký tự. Nếu không đạt, trả về `PASSWORD_TOO_SHORT` (HTTP 400).
  - **Cập nhật mật khẩu tùy chọn**: Trong `PUT /api/employees/:id`, nếu trường `password` để trống hoặc rỗng, backend **GIỮ NGUYÊN** mật khẩu cũ, không được ghi đè bằng rỗng.
  - **Đồng bộ trạng thái Nghỉ việc**: Khi cập nhật `employees.status = 'Nghỉ việc'`, backend phải tự động cập nhật `users.status = 'inactive'` ngay trong cùng transaction. Người dùng này sẽ bị hủy phiên làm việc và không thể đăng nhập lại.

---

## 2. QUY TẮC XẾP CA & RÀNG BUỘC THỜI GIAN (SCHEDULING CONSTRAINTS)

### 2.1 Loại bỏ Nhân viên "Nghỉ việc"
- **Vị trí mock**: `src/mocks/db.js`, `src/mocks/mockAdapter.js`
- **Quy tắc**: Nhân viên có trạng thái `'Nghỉ việc'` bị loại trừ 100% khỏi:
  - Khả năng làm việc (Availability)
  - Thuật toán xếp lịch tự động OR-Tools (không được gán ca)
  - Yêu cầu đổi ca (không được gửi/nhận yêu cầu)
  - Nhận ca trực mở (không được xem/đăng ký ca mở)

### 2.2 Ràng buộc Xếp ca Tối thiểu và Tối đa
- **Vị trí mock**: `src/mocks/shiftConfigMock.js`, `src/mocks/scheduleMock.js`
- **Quy tắc**:
  - **Không trùng ca**: 1 nhân viên không được xếp 2 ca làm việc trong cùng 1 khoảng thời gian hoặc cùng 1 ca trong ngày.
  - **Thời gian nghỉ tối thiểu (Minimum Rest Period)**: Giữa ca kết thúc hôm nay và ca bắt đầu ngày hôm sau của 1 nhân viên phải cách nhau **tối thiểu 12 giờ** (ví dụ: nhân viên làm Ca Tối kết thúc lúc 22:00 thì không được xếp Ca Sáng hôm sau bắt đầu lúc 06:00/07:00).
  - **Tôn trọng Đăng ký Lịch rảnh (US08/US09)**: Thuật toán xếp ca chỉ xếp nhân viên vào các ca mà nhân viên đã đăng ký trạng thái `'available'` (Rảnh). Các ca `'busy'` (Bận) hoặc chưa đăng ký tuyệt đối không được tự ý gán ca trừ khi có sự can thiệp thủ công từ Quản lý.

---

## 3. MÁY TRẠNG THÁI & QUY TRÌNH YÊU CẦU (STATE MACHINES)

### 3.1 Quy trình Đơn xin Nghỉ phép (Leave Request)
- **Vị trí mock**: `src/mocks/leaveMock.js`, `src/services/leaveService.js`
- **Trạng thái**: `PENDING` $\rightarrow$ `APPROVED` | `REJECTED` | `CANCELLED`
- **Quy tắc**:
  - Staff nộp đơn: Trạng thái mặc định là `PENDING`.
  - Hủy đơn: Staff chỉ được hủy đơn (`CANCELLED`) khi đơn còn ở trạng thái `PENDING`. Đơn đã duyệt hoặc từ chối không được hủy.
  - Duyệt đơn (`APPROVED`): Khi Quản lý duyệt đơn nghỉ phép:
    - Nếu ngày nghỉ trùng với ca đã được xếp lịch của nhân viên đó, ca làm việc tự động chuyển sang trạng thái `'On-Leave'` (Nghỉ phép).
    - Tạo thông báo tự động gửi cho nhân viên: `"Đơn xin nghỉ phép của bạn đã được duyệt."`
  - Từ chối đơn (`REJECTED`): Quản lý bắt buộc phải nhập lý do từ chối. Tạo thông báo tự động cho nhân viên: `"Đơn xin nghỉ phép của bạn bị từ chối: [Lý do]"`.

### 3.2 Quy trình Đổi ca Làm việc (Shift Exchange)
- **Vị trí mock**: `src/mocks/shiftExchangeMock.js`, `src/services/shiftExchangeService.js`
- **Trạng thái**: `PENDING_TARGET` $\rightarrow$ `PENDING_MANAGER` $\rightarrow$ `APPROVED` | `REJECTED` | `CANCELLED`
- **Quy tắc**:
  - **Bước 1 (Staff A gửi cho Staff B)**: Trạng thái ban đầu `PENDING_TARGET`. Backend kiểm tra Staff B có bị trùng ca vào ngày của ca đổi hay không. Nếu trùng, từ chối tạo yêu cầu (`SHIFT_CONFLICT`).
  - **Bước 2 (Staff B xác nhận)**:
    - Nếu Staff B đồng ý: Chuyển sang `PENDING_MANAGER`. Gửi thông báo đến Quản lý: `"Nhân viên [Tên A] và [Tên B] gửi yêu cầu đổi ca trực."`
    - Nếu Staff B từ chối: Chuyển sang `REJECTED`. Kết thúc quy trình.
  - **Bước 3 (Quản lý duyệt)**:
    - Quản lý duyệt (`APPROVED`): Hoán đổi nhân sự của 2 ca trực trong bảng `schedules` trong cùng 1 transaction. Gửi thông báo cho cả Staff A và Staff B.
    - Quản lý từ chối (`REJECTED`): Giữ nguyên lịch trực hiện tại. Gửi thông báo từ chối cho cả hai.

### 3.4 Quy trình Đăng ký Khả năng Làm việc & Thông báo (US08 & US09)
- **Vị trí mock**: `src/mocks/db.js` (`saveStaffAvailability`, `getWeeklyAvailability`, `addNotification`), `src/services/availabilityService.js`, `src/domain/statusFlow.js`
- **Trạng thái**: `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `APPROVED` | `REJECTED` | `CANCELLED`
- **Quy tắc**:
  - **Mô hình bản ghi chuẩn**: `id`, `type = 'availability'`, `employeeId`, `weekMonday`, `slots`, `status`, `version`, `createdByUserId`, `handledByUserId`, `rejectReason`, `logs`.
  - **Phân quyền nghiêm ngặt**: Staff chỉ được xem/sửa lịch của chính mình (suy ra `employeeId` từ phiên token xác thực). Client không được phép tự do truyền `employeeId` của nhân viên khác. Vi phạm ném `FORBIDDEN` (HTTP 403). Quản lý có quyền xem toàn bộ.
  - **Hạn chót (Deadline)**: 23:59:59 Thứ Sáu trước tuần làm việc áp dụng. Nếu `now > deadline`, từ chối nộp đơn với mã lỗi `DEADLINE_EXCEEDED` (HTTP 400).
  - **Chống ghi đè đồng thời (Optimistic Concurrency Control)**: Sử dụng trường `version`. Khi client nộp với `expectedVersion`, nếu bản ghi trong CSDL đã có `version > expectedVersion`, từ chối với `CONFLICT` (HTTP 409).
  - **Thông báo tự động do Service sinh ra**: Khi Staff nộp lịch rảnh, hệ thống tự động sinh thông báo vào bảng `notifications` cho tất cả Quản lý:
    `{ recipientUserId: [m.id], title: "Đăng ký lịch rảnh mới", type: "availability_submitted", link: "/manager/availability" }`.

---

### 3.4 Quy trình Ca trực Mở (Open Shift Claiming & Bonus)
- **Vị trí mock**: `src/mocks/openShiftMock.js`, `src/mocks/openShiftRulesMock.js`
- **Trạng thái**: `OPEN` $\rightarrow$ `CLAIMED` | `CANCELLED`
- **Quy tắc**:
  - **Optimistic Locking (Chống tranh chấp ca)**: Khi nhiều nhân viên bấm nhận 1 ca mở cùng lúc, backend phải dùng khóa biểu thức hoặc `SELECT ... FOR UPDATE` theo `version` / `status = 'OPEN'`. Chỉ người đầu tiên nhận thành công (`CLAIMED`); người gửi sau nhận lỗi `ALREADY_CLAIMED` (HTTP 409).
  - **Ràng buộc nhận ca**:
    - Nhân viên nhận ca phải đúng vị trí/chức danh (`roleTag`) của ca đó.
    - Không trùng với ca đã có trong ngày.
    - Đảm bảo thời gian nghỉ tối thiểu 12 giờ.
  - **Cộng tiền thưởng ca mở (Bonus)**: Nếu ca mở có cấu hình `bonus_amount > 0`, khi ca được hoàn thành, số tiền này tự động cộng vào khoản `bonus` của nhân viên đó trong Bảng tính lương tháng tương ứng.

---

## 4. CHẤM CÔNG, GIỜ LÀM & BẢNG LƯƠNG (PAYROLL & ATTENDANCE)

### 4.1 Quy tắc Đối soát Chấm công (Attendance Verification)
- **Vị trí mock**: `src/mocks/attendanceMock.js`
- **Quy tắc phân loại**:
  - Ca chưa đến giờ: `Upcoming` $\rightarrow$ `absent = false`, không tính vào mẫu số tỷ lệ vắng.
  - Ca đang diễn ra: `In-Progress` $\rightarrow$ `absent = false`.
  - Ca đã kết thúc: `Completed` $\rightarrow$ Đã chấm công đầy đủ (`On-Time` hoặc `Late`). Nếu hết giờ ca mà không có dữ liệu chấm công: `Absent` (Vắng không phép).
  - **Mẫu số tỷ lệ vắng / trễ**: Chỉ chia trên tổng số ca **đã kết thúc** (`completedTotal`), tuyệt đối không chia trên tổng ca của cả tuần (bao gồm ca tương lai).

### 4.2 Bảng lương & Snapshot Bất biến (Payroll Lock Snapshot)
- **Vị trí mock**: `src/mocks/payrollMock.js`
- **Quy tắc**:
  - Khi kỳ lương ở trạng thái `DRAFT`: Lương được tính động dựa trên: `hours_worked * hourly_wage + bonus - penalty`.
  - Khi Quản lý bấm **"Khóa bảng lương" (LOCKED)**:
    - Backend chụp toàn bộ bản ghi lương thành 1 snapshot đóng băng dạng JSON hoặc bảng riêng `payroll_snapshots`.
    - Sau khi đã khóa, mọi thao tác sửa lương nhân viên, sửa giờ làm, sửa ca quá khứ **KHÔNG ĐƯỢC PHÉP** làm thay đổi số liệu trong kỳ lương đã khóa.
    - Chỉ có thao tác mở khóa (`UNLOCK`) có thẩm quyền mới cho phép tính lại.

---

## 5. BẢNG MÃ LỖI CHUẨN (STANDARD ERROR CODES)

Backend PHP phải trả về mã lỗi chuẩn trong trường `code` của JSON response để Frontend hiển thị đúng thông báo:

| HTTP Status | Mã lỗi (`code`) | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- |
| **401** | `INVALID_CREDENTIALS` | Sai email, mã nhân viên hoặc mật khẩu |
| **401** | `TOKEN_EXPIRED` | Phiên làm việc đã hết hạn |
| **403** | `ACCOUNT_DISABLED` | Tài khoản nhân sự đã bị ngừng hoạt động (Nghỉ việc) |
| **403** | `FORBIDDEN` | Không đủ quyền hạn truy cập (Staff vào Manager hoặc ngược lại) |
| **409** | `EMAIL_EXISTS` | Email đã được sử dụng bởi nhân sự khác |
| **400** | `PASSWORD_TOO_SHORT` | Mật khẩu ít hơn 8 ký tự |
| **409** | `ALREADY_CLAIMED` | Ca trực mở đã có người khác nhanh tay nhận trước |
| **409** | `SHIFT_CONFLICT` | Trùng ca làm việc hoặc vi phạm thời gian nghỉ 12 giờ |
| **400** | `DEADLINE_EXCEEDED` | Đã quá hạn chót đăng ký lịch rảnh (Thứ 6 23:59:59 trước tuần làm việc) |
| **400** | `INVALID_STATE` | Chuyển trạng thái máy nghiệp vụ không hợp lệ |
| **409** | `CONFLICT` | Xung đột ghi đè đồng thời do lệch version (Optimistic Locking) |
| **409** | `PAYROLL_LOCKED` | Kỳ lương đã bị khóa, không thể chỉnh sửa |
| **404** | `NOT_FOUND` | Bản ghi không tồn tại |

---

## 6. QUY TẮC ĐỒNG BỘ 6 LUỒNG NGHIỆP VỤ THỰC TẾ (PHASE C1)

1. **Tạo lịch và công bố (Schedule Lifecycle)**: Lịch lưu theo từng tuần (`weekly_schedules`) với trạng thái `draft` hoặc `published`. Backend lọc theo role: Staff chỉ thấy ca khi tuần đã công bố (`published`), Manager xem được cả hai; công bố hoặc chỉnh sửa sau công bố tự động sinh thông báo cho nhân viên bị ảnh hưởng.
2. **Đổi ca 2 bước (Two-step Shift Exchange)**: Quy trình gồm 2 bước duyệt: Staff A gửi $\rightarrow$ Staff B chấp nhận/từ chối $\rightarrow$ Quản lý duyệt/từ chối (kèm lý do). Khi Manager duyệt, hệ thống hoán đổi nhân sự trong `schedules` và gửi thông báo kết quả cho cả A và B.
3. **Ca trực mở (Open Shifts)**: Quản lý đăng ca $\rightarrow$ Staff thấy và gửi đăng ký $\rightarrow$ Quản lý phê duyệt $\rightarrow$ gán nhân viên vào `schedules` và đồng bộ bản ghi chấm công `attendance`.
4. **Nghỉ phép (Leave Request)**: Staff gửi đơn $\rightarrow$ Quản lý duyệt hoặc từ chối (kèm lý do). Khi duyệt, ca trực trong ngày nghỉ tự động chuyển trạng thái `On-Leave` và gửi thông báo cho Staff.
5. **Chấm công (Attendance Sync)**: Staff check-in / check-out đồng bộ trực tiếp vào sổ cái chung `attendance`, màn hình Chấm công và Tổng hợp giờ làm của Quản lý tự cập nhật thời gian thực.
6. **Quản lý nhân viên (Employee Lifecycle & Auth)**: Khi Quản lý thêm/sửa/ngừng làm việc (`Nghỉ việc`), backend đồng bộ trạng thái `users.status = 'inactive'`, thu hồi token và chặn đăng nhập ngay lập tức với mã `ACCOUNT_DISABLED`.


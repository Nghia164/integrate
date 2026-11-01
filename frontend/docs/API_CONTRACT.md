# Smart Scheduling - API Contract & Specifications
**Phiên bản:** 1.0 (RESTful JSON API cho Backend PHP / Laravel)  
**Ngày cập nhật:** 2026-10-29  
**Tác giả:** Đội ngũ Phát triển Smart Scheduling (Đồ án C1SE_57)

---

## 1. Nguyên Tắc Thiết Kế Chung

1. **Giao thức & Định dạng:** HTTPS, JSON request & response (`Content-Type: application/json; charset=utf-8`).
2. **Cấu trúc phản hồi chuẩn (Response Envelope):**
   - **Thành công (HTTP 200, 201):**
     ```json
     {
       "data": { ... }
     }
     ```
   - **Thất bại (HTTP 400, 401, 403, 404, 409, 422, 500):**
     ```json
     {
       "error": {
         "code": "MÃ_LỖI_CHUẨN",
         "message": "Thông điệp thông báo tiếng Việt có dấu rõ ràng cho người dùng.",
         "details": {} // (tùy chọn) chi tiết lỗi validate theo trường
       }
     }
     ```
3. **Mã lỗi chuẩn hệ thống (Standard Error Codes):**
   - `INVALID_CREDENTIALS` (HTTP 401): Thông tin đăng nhập (email/mật khẩu) không chính xác.
   - `UNAUTHORIZED` (HTTP 401): Chưa đăng nhập hoặc token đã hết hạn/không hợp lệ.
   - `ACCOUNT_DISABLED` (HTTP 403 / 401): Tài khoản đã ngừng làm việc hoặc bị vô hiệu hóa.
   - `FORBIDDEN` (HTTP 403): Người dùng không đủ quyền thực hiện thao tác (ví dụ Staff gọi endpoint chỉ dành cho Manager).
   - `EMAIL_EXISTS` (HTTP 409): Email đăng ký đã tồn tại trong hệ thống.
   - `VALIDATION_ERROR` (HTTP 422): Dữ liệu gửi lên không đúng định dạng hoặc thiếu trường bắt buộc.
   - `NOT_FOUND` (HTTP 404): Không tìm thấy tài nguyên (ví dụ nhân viên).
   - `INTERNAL_ERROR` (HTTP 500): Lỗi máy chủ nội bộ.

4. **Bảo mật mật khẩu:**
   - **Tuyệt đối không bao giờ trả về trường `password` hoặc `password_hash`** trong bất kỳ phản hồi API nào (kể cả xem chi tiết nhân viên, danh sách nhân viên hay thông tin phiên).
   - Mật khẩu lưu trữ trong cơ sở dữ liệu phải được băm an toàn bằng thuật toán `password_hash()` của PHP (`PASSWORD_BCRYPT` hoặc `PASSWORD_ARGON2ID`).

5. **Xác thực phiên:**
   - Sử dụng Bearer Token gửi trong Header:
     `Authorization: Bearer <jwt_or_sanctum_token>`
   - Phân quyền theo vai trò (`manager`, `staff`) được kiểm tra nghiêm ngặt tại **Middleware của Backend**, không tin cậy vai trò từ phía Client gửi lên.

---

## 2. Danh Sách Endpoint Chi Tiết

### 2.1 Xác Thực (Authentication)

#### 1. `POST /api/auth/login`
- **Mô tả:** Đăng nhập vào hệ thống bằng Email và Mật khẩu.
- **Quyền:** Công khai (Public).
- **Request Body:**
  ```json
  {
    "email": "nguyenvanan@gmail.com",
    "password": "sample_password"
  }
  ```
- **Xử lý Backend:**
  - Cắt khoảng trắng (trim) và chuyển email về chữ thường.
  - Tìm bản ghi nhân viên theo email. Nếu không tìm thấy $\rightarrow$ trả về `401 INVALID_CREDENTIALS`.
  - Kiểm tra trạng thái: Nếu `status === 'Nghỉ việc'` $\rightarrow$ trả về `403 ACCOUNT_DISABLED` ("Tài khoản không còn hoạt động.").
  - Kiểm tra mật khẩu bằng `password_verify($password, $employee->password_hash)`. Nếu sai $\rightarrow$ trả về `401 INVALID_CREDENTIALS`.
  - Sinh token xác thực (JWT hoặc Laravel Sanctum Token).
- **Response 200 (Thành công):**
  ```json
  {
    "data": {
      "user": {
        "id": "NV001",
        "employeeCode": "NV001",
        "name": "Nguyễn Văn An",
        "email": "nguyenvanan@gmail.com",
        "role": "staff",
        "roleTag": "Shift_Leader",
        "status": "Đang làm việc"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Response 401 (Sai thông tin):**
  ```json
  {
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "Tài khoản hoặc mật khẩu không đúng."
    }
  }
  ```
- **Response 403 (Tài khoản bị vô hiệu hóa):**
  ```json
  {
    "error": {
      "code": "ACCOUNT_DISABLED",
      "message": "Tài khoản không còn hoạt động."
    }
  }
  ```

---

#### 2. `POST /api/auth/logout`
- **Mô tả:** Đăng xuất người dùng, vô hiệu hóa token hiện tại trên máy chủ.
- **Quyền:** Đã đăng nhập (Bearer Token).
- **Headers:** `Authorization: Bearer <token>`
- **Response 200 (Thành công):**
  ```json
  {
    "data": {
      "message": "Đăng xuất thành công."
    }
  }
  ```

---

#### 3. `GET /api/auth/me`
- **Mô tả:** Lấy thông tin tài khoản và phiên đăng nhập hiện tại.
- **Quyền:** Đã đăng nhập (Bearer Token).
- **Headers:** `Authorization: Bearer <token>`
- **Response 200 (Thành công):**
  ```json
  {
    "data": {
      "id": "QL001",
      "employeeCode": "QL001",
      "name": "Quản lý Cửa Hàng",
      "email": "quanly@smartscheduling.vn",
      "role": "manager",
      "roleTag": "Manager",
      "status": "Đang làm việc"
    }
  }
  ```
- **Response 401 (Chưa đăng nhập / Token hết hạn):**
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
    }
  }
  ```

---

### 2.2 Quản Lý Nhân Viên (Employees Management)

#### 4. `GET /api/employees`
- **Mô tả:** Lấy danh sách nhân viên có hỗ trợ tìm kiếm và lọc.
- **Quyền:** Chỉ Quản lý (`role === 'manager'`).
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:**
  - `search`: Chuỗi tìm kiếm theo tên hoặc mã nhân viên.
  - `role`: Lọc theo chức danh công việc (`all`, `Pha chế`, `Thu ngân`, `Phục vụ`, `Quản lý ca`, `Quản lý`).
  - `status`: Lọc theo trạng thái (`all`, `Đang làm việc`, `Nghỉ phép`, `Nghỉ việc`).
  - `contract`: Lọc theo hợp đồng (`all`, `Toàn thời gian`, `Bán thời gian`).
- **Response 200 (Thành công):**
  ```json
  {
    "data": [
      {
        "id": "NV001",
        "employeeCode": "NV001",
        "name": "Nguyễn Văn An",
        "email": "nguyenvanan@gmail.com",
        "phone": "0905123456",
        "birthDate": "2002-05-12",
        "roles": ["Phục vụ", "Thu ngân"],
        "role": "Phục vụ",
        "roleTag": "Phục vụ",
        "contract": "Toàn thời gian",
        "hourlyWage": 35000,
        "status": "Đang làm việc"
      }
    ]
  }
  ```
- **Response 403 (Không có quyền truy cập):**
  ```json
  {
    "error": {
      "code": "FORBIDDEN",
      "message": "Bạn không có quyền truy cập tài nguyên này."
    }
  }
  ```

---

#### 5. `POST /api/employees`
- **Mô tả:** Tạo mới hồ sơ nhân viên và cấp tài khoản đăng nhập ban đầu.
- **Quyền:** Chỉ Quản lý (`role === 'manager'`).
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "name": "Lê Bảo Nam",
    "email": "lebaonam@gmail.com",
    "password": "Password123",
    "phone": "0905888999",
    "birthDate": "2003-08-15",
    "roles": ["Pha chế", "Phục vụ"],
    "role": "Pha chế",
    "contract": "Bán thời gian",
    "hourlyWage": 30000,
    "status": "Đang làm việc"
  }
  ```
- **Ràng buộc:**
  - `email`: Bắt buộc, đúng định dạng, duy nhất trong hệ thống (kiểm tra không phân biệt hoa thường).
  - `password`: Bắt buộc khi tạo mới, tối thiểu 8 ký tự.
  - `name`: Bắt buộc, tối thiểu 2 ký tự.
  - `hourlyWage`: Số dương $\ge 0$.
- **Response 201 (Tạo thành công):**
  ```json
  {
    "data": {
      "id": "NV009",
      "employeeCode": "NV009",
      "name": "Lê Bảo Nam",
      "email": "lebaonam@gmail.com",
      "phone": "0905888999",
      "birthDate": "2003-08-15",
      "role": "Pha chế",
      "roleTag": "Barista",
      "contract": "Bán thời gian",
      "hourlyWage": 30000,
      "status": "Đang làm việc"
    }
  }
  ```
- **Response 409 (Email đã tồn tại):**
  ```json
  {
    "error": {
      "code": "EMAIL_EXISTS",
      "message": "Email đã được sử dụng cho tài khoản khác."
    }
  }
  ```
- **Response 422 (Dữ liệu không hợp lệ):**
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Mật khẩu phải có tối thiểu 8 ký tự."
    }
  }
  ```

---

#### 6. `PUT /api/employees/{id}`
- **Mô tả:** Cập nhật thông tin hồ sơ và tài khoản nhân viên.
- **Quyền:** Chỉ Quản lý (`role === 'manager'`).
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "name": "Nguyễn Văn An",
    "email": "nguyenvanan.new@gmail.com",
    "password": "", // Để trống nếu không muốn đổi mật khẩu
    "phone": "0905123456",
    "birthDate": "2002-05-12",
    "role": "Phục vụ",
    "roleTag": "Shift_Leader",
    "contract": "Toàn thời gian",
    "hourlyWage": 36000,
    "status": "Đang làm việc"
  }
  ```
- **Quy tắc mật khẩu:**
  - Nếu `password` để trống hoặc không gửi lên: **Giữ nguyên mật khẩu cũ**.
  - Nếu `password` có giá trị: Phải $\ge 8$ ký tự, backend tiến hành băm mới và cập nhật `password_hash`. Lần đăng nhập sau nhân viên phải dùng mật khẩu mới này.
- **Response 200 (Cập nhật thành công):**
  ```json
  {
    "data": {
      "id": "NV001",
      "employeeCode": "NV001",
      "name": "Nguyễn Văn An",
      "email": "nguyenvanan.new@gmail.com",
      "role": "Phục vụ",
      "hourlyWage": 36000,
      "status": "Đang làm việc"
    }
  }
  ```

---

#### 7. `PATCH /api/employees/{id}/status`
- **Mô tả:** Cập nhật nhanh trạng thái nhân viên ("Đang làm việc", "Nghỉ phép", "Nghỉ việc").
- **Quyền:** Chỉ Quản lý (`role === 'manager'`).
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "status": "Nghỉ việc"
  }
  ```
- **Quy tắc nghiệp vụ:**
  - Khi chuyển sang `"Nghỉ việc"`: Backend tự động thu hồi/hủy các token đang hoạt động của nhân viên này, ngăn chặn đăng nhập tiếp theo.
- **Response 200 (Thành công):**
  ```json
  {
    "data": {
      "id": "NV001",
      "status": "Nghỉ việc",
      "message": "Đã cập nhật trạng thái nhân viên."
    }
  }
  ```

---

#### 8. `POST /api/employees/{id}/reset-password`
- **Mô tả:** Đặt lại mật khẩu cho nhân viên (dành cho quản lý hỗ trợ cấp lại khi nhân viên quên mật khẩu).
- **Quyền:** Chỉ Quản lý (`role === 'manager'`).
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "newPassword": "NewPassword2026"
  }
  ```
- **Ràng buộc:** Mật khẩu mới tối thiểu 8 ký tự.
- **Response 200 (Thành công):**
  ```json
  {
    "data": {
      "id": "NV001",
      "message": "Đặt lại mật khẩu thành công."
    }
  }
  ```

---

### 2.3 Quản Lý Khả Năng Làm Việc (Availability - US08 & US09)

#### 1. `GET /api/availability`
- **Mô tả:** Lấy danh sách đăng ký lịch rảnh/bận tuần của nhân viên đang đăng nhập (Staff) hoặc theo employee_id (Manager).
- **Quyền:** Đã đăng nhập (`staff` hoặc `manager`). Staff chỉ xem được của chính mình.
- **Query Params:**
  - `week_monday`: Ngày Thứ 2 đầu tuần (YYYY-MM-DD, ví dụ: `2026-11-02`).
  - `employee_id`: (Tùy chọn, chỉ Manager được truyền) Mã nhân viên cần tra cứu.
- **Response 200 (Thành công):**
  ```json
  {
    "data": {
      "id": "AVL-NV001-2026-11-02",
      "employeeId": "NV001",
      "weekMonday": "2026-11-02",
      "version": 1,
      "status": "SUBMITTED",
      "slots": {
        "0_Sáng": "available",
        "0_Chiều": "available",
        "0_Tối": "busy"
      },
      "isLocked": false,
      "deadline": "2026-10-30T23:59:59.999Z"
    }
  }
  ```

#### 2. `PUT /api/availability`
- **Mô tả:** Nộp hoặc cập nhật lịch rảnh/bận tuần của nhân viên.
- **Quyền:** Staff (chỉ nộp cho mình) hoặc Manager.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "employeeId": "NV001",
    "weekMonday": "2026-11-02",
    "slots": {
      "0_Sáng": "available",
      "0_Chiều": "busy"
    },
    "expectedVersion": 1
  }
  ```
- **Ràng buộc:**
  - Hạn chót: 23:59:59 Thứ Sáu trước tuần làm việc. Quá hạn trả về HTTP 400 (`DEADLINE_EXCEEDED`).
  - Chống ghi đè đồng thời (Optimistic Locking): Nếu `expectedVersion` lệch so với version hiện tại trong CSDL, trả về HTTP 409 (`CONFLICT`).
- **Response 200 (Thành công):**
  ```json
  {
    "data": {
      "id": "AVL-NV001-2026-11-02",
      "version": 2,
      "status": "SUBMITTED",
      "submittedAt": "2026-10-29T10:15:30Z"
    }
  }
  ```

#### 3. `GET /api/manager/availability`
- **Mô tả:** Tổng hợp khả năng làm việc của toàn bộ nhân viên theo tuần phục vụ Quản lý và thuật toán xếp lịch tự động OR-Tools (US09).
- **Quyền:** Chỉ Quản lý (`role === 'manager'`).
- **Query Params:** `week_monday=YYYY-MM-DD`
- **Response 200 (Thành công):**
  ```json
  {
    "data": {
      "weekMonday": "2026-11-02",
      "weekLabel": "Tuần 02/11 – 08/11/2026",
      "days": [ ... ],
      "shifts": [ ... ],
      "employees": [ ... ],
      "summary": {
        "totalEmployees": 7,
        "registeredCount": 6,
        "unregisteredCount": 1,
        "totalAvailable": 85,
        "totalBusy": 41
      }
    }
  }
  ```

---

### 2.4 Hộp Thông Báo (In-App Notifications)

#### 1. `GET /api/notifications`
- **Mô tả:** Lấy danh sách thông báo của tài khoản đang đăng nhập.
- **Quyền:** Đã đăng nhập (`staff` hoặc `manager`).
- **Query Params:** `limit=15`, `unread_only=false`
- **Response 200 (Thành công):**
  ```json
  {
    "data": [
      {
        "id": "NOTIF-1729381...",
        "recipientUserId": "USR-MGR-001",
        "title": "Đăng ký lịch rảnh mới",
        "message": "Nhân viên Nguyễn Văn An đã gửi đăng ký lịch rảnh tuần 2026-11-02.",
        "type": "availability_submitted",
        "link": "/manager/availability",
        "isRead": false,
        "read": false,
        "createdAt": "2026-10-29T10:15:30Z"
      }
    ]
  }
  ```

#### 2. `PATCH /api/notifications/{id}/read`
- **Mô tả:** Đánh dấu một thông báo là đã đọc.
- **Quyền:** Chủ sở hữu thông báo (`recipientUserId === auth.user.id`).
- **Response 200 (Thành công):**
  ```json
  {
    "data": {
      "id": "NOTIF-1729381...",
      "isRead": true,
      "read": true
    }
  }
  ```

#### 3. `POST /api/notifications/read-all`
- **Mô tả:** Đánh dấu toàn bộ thông báo của người dùng là đã đọc.
- **Quyền:** Đã đăng nhập.
- **Response 200 (Thành công):**
  ```json
  {
    "data": {
      "updatedCount": 5
    }
  }
  ```

---

## 3. Bản Đồ Ánh Xạ Mã Lỗi HTTP & Frontend

| Mã Lỗi HTTP | Error Code | Mô tả | Xử lý tại Frontend / UI |
|---|---|---|---|
| **400** | `DEADLINE_EXCEEDED` | Quá hạn chót đăng ký lịch rảnh (Thứ 6 23:59:59) | Báo thông báo: "Đã quá hạn chót đăng ký lịch rảnh tuần này." |
| **400** | `INVALID_STATE` | Chuyển trạng thái máy nghiệp vụ không hợp lệ | Báo lỗi chuyển trạng thái và nạp lại bản ghi mới nhất |
| **401** | `INVALID_CREDENTIALS` | Sai email hoặc mật khẩu | Hiển thị: "Tài khoản hoặc mật khẩu không đúng." |
| **401** | `UNAUTHORIZED` | Token hết hạn / Chưa đăng nhập | Xóa phiên đăng nhập khỏi bộ nhớ và chuyển hướng về `/login` |
| **403** | `ACCOUNT_DISABLED` | Tài khoản ngừng làm việc | Hiển thị: "Tài khoản không còn hoạt động." |
| **403** | `FORBIDDEN` | Sai quyền truy cập (Staff sửa người khác, v.v.) | Chặn thao tác, báo lỗi hoặc chuyển hướng về trang chủ |
| **409** | `CONFLICT` | Xung đột ghi đè đồng thời (Optimistic Lock) | Báo: "Dữ liệu vừa được cập nhật từ nơi khác. Vui lòng kiểm tra lại." |
| **409** | `EMAIL_EXISTS` | Trùng email khi tạo/sửa | Báo lỗi dưới trường email: "Email đã được sử dụng." |
| **422** | `VALIDATION_ERROR` | Lỗi xác thực dữ liệu (mật khẩu < 8 ký tự, v.v.) | Báo lỗi cụ thể dưới trường form tương ứng |
| **500** | `INTERNAL_ERROR` | Lỗi xử lý phía máy chủ | Hiển thị thông báo lỗi thân thiện |

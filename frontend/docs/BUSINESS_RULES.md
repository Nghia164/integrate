# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ & QUY TẮC LOGIC HỆ THỐNG (BUSINESS RULES)
**Dự án:** Smart Scheduling (Hệ thống Xếp lịch và Quản lý Ca làm việc Thông minh)  
**Mục đích:** Tài liệu đối chiếu quy tắc nghiệp vụ backend (SSOT) phục vụ chuyển đổi từ Mock sang Backend PHP (Laravel / Pure PHP).

---

## 0. NGUYÊN TẮC NGHIỆP VỤ CỐT LÕI (CORE PRINCIPLES)

1. **Định nghĩa chuẩn về số lượng nhân sự:**
   - `Tổng nhân viên (total)` = Tất cả nhân viên trong hồ sơ trừ trạng thái `"Nghỉ việc"` (`active + onLeave`).
   - `Đang làm việc (active)`: Nhân viên có `status === "Đang làm việc"`.
   - `Nghỉ phép (onLeave)`: Nhân viên có `status === "Nghỉ phép"`.
   - `Nghỉ việc (resigned)`: Nhân viên có `status === "Nghỉ việc"`. **Tuyệt đối không xuất hiện** trong các số đếm tổng hợp, bảng chấm công, xếp lịch, bảng lương hay phân quyền ca.
2. **Khóa kỳ lương bất biến (Payroll Lock):**
   - **Mặc định & Linh hoạt:** Bộ chọn kỳ lương mặc định theo **THÁNG** (`month`), đồng thời hỗ trợ theo tuần (`week`) và **khoảng ngày** tùy chọn (`range`). Nút "Chốt kỳ lương" chốt đúng kỳ đang chọn (`periodKey`).
   - **Điều kiện kết thúc:** Chỉ được phép chốt sổ khi kỳ lương đã kết thúc (`ngày hiện tại > ngày cuối kỳ`).
   - **Chống chồng lấn kỳ (Overlap Prevention):** Tuyệt đối không cho phép chốt kỳ có ngày chồng lấn với bất kỳ kỳ nào đã chốt trước đó (ví dụ: đã chốt tuần 26/10–01/11 thì không thể chốt tháng 10 chứa các ngày trong tuần đó). Báo lỗi tiếng Việt nêu rõ kỳ bị trùng.
   - **Quy tắc duyệt/từ chối đơn trong kỳ đã chốt:**
     - Chặn thao tác **Duyệt** đơn đổi ca và đơn nghỉ phép thuộc kỳ đã chốt.
     - **Vẫn cho phép Từ chối** đơn đổi ca (`managerRejectExchange`) và đơn nghỉ phép (`rejectLeave`) trong kỳ đã chốt.
     - Các đơn đang chờ (`pending` / `pending_manager`) giữ nguyên trạng thái chờ, tuyệt đối không tự động thay đổi khi chốt lương.
   - **Bất biến số liệu:** Bảng lương kỳ đã chốt đọc từ snapshot bất biến, không tính lại, miễn nhiễm hoàn toàn với việc thay đổi lương giờ của nhân viên sau thời điểm chốt.
3. **Mẫu số chuẩn cho tỷ lệ:**
   - Các tỷ lệ Vắng, Đi trễ, Đúng giờ trên Dashboard và Chấm công tính trên mẫu số là **Số ca đã kết thúc (completedTotal)**, không tính trên tổng số ca theo kế hoạch của toàn tuần.

---

## 1. DỊCH VỤ NHÂN SỰ (employeeService.js)

### 1.1 `getEmployeeCounts()`
- **Làm gì:** Thống kê số lượng nhân sự theo 4 trạng thái chuẩn phục vụ toàn hệ thống.
- **Đầu vào:** Không có (`void`).
- **Đầu ra:** `{ total: number, active: number, onLeave: number, resigned: number }`.
- **Quy tắc kiểm tra:** `total = active + onLeave`. Loại trừ hoàn toàn `resigned` khỏi `total`.
- **Lỗi trả về:** Không có.
- **Dữ liệu bị đổi:** Không đổi (Read-only).
- **Backend PHP Mapping:** `GET /api/employees/counts`

### 1.2 `getEmployees(params)`
- **Làm gì:** Lấy danh sách hồ sơ nhân viên có phân trang, tìm kiếm, lọc theo vai trò, hợp đồng, trạng thái.
- **Đầu vào:** `params = { search, role, contract, status }`.
- **Đầu ra:** Mảng danh sách nhân viên `Employee[]`.
- **Quy tắc kiểm tra:** Khi `status` không truyền (tab "Tất cả"), mặc định trả về nhân viên chưa nghỉ việc.
- **Lỗi trả về:** Không có.
- **Dữ liệu bị đổi:** Không đổi.
- **Backend PHP Mapping:** `GET /api/employees`

### 1.3 `createEmployee(data)`
- **Làm gì:** Thêm mới hồ sơ nhân viên.
- **Đầu vào:** `{ name, phone, birthDate, role, roleTag, contract, hourlyWage, status, email }`.
- **Đầu ra:** Object nhân viên vừa tạo kèm `id` sinh tự động (`NVxxx`).
- **Quy tắc kiểm tra:**
  - Bắt buộc đủ Họ tên, Số điện thoại, Vai trò, Mức lương giờ > 0.
  - Email (nếu có) không được trùng với tài khoản đã tồn tại.
- **Lỗi trả về:** `"Vui lòng nhập đầy đủ thông tin bắt buộc."`, `"Email này đã được sử dụng."`.
- **Dữ liệu bị đổi:** Thêm bản ghi mới vào bảng `employees`.
- **Backend PHP Mapping:** `POST /api/employees`

### 1.4 `updateEmployee(id, data)`
- **Làm gì:** Cập nhật thông tin hồ sơ nhân viên, mức lương giờ, trạng thái làm việc.
- **Đầu vào:** `id` (mã NV), `data` (các trường cần sửa).
- **Đầu ra:** Object nhân viên sau cập nhật.
- **Quy tắc kiểm tra:** `id` phải tồn tại trong cơ sở dữ liệu.
- **Lỗi trả về:** `"Không tìm thấy nhân viên với mã NVxxx."`.
- **Dữ liệu bị đổi:** Cập nhật bản ghi tương ứng trong bảng `employees`.
- **Backend PHP Mapping:** `PUT /api/employees/{id}`

---

## 2. DỊCH VỤ KHẢ NĂNG LÀM VIỆC (availabilityService.js)

### 2.1 `getWeeklyStaffAvailability(weekMondayIso)`
- **Làm gì:** Lấy ma trận đăng ký lịch rảnh (7 ngày x 3 ca) của tất cả nhân viên trong tuần chỉ định.
- **Đầu vào:** `weekMondayIso` (chuỗi `YYYY-MM-DD` ngày Thứ 2 đầu tuần).
- **Đầu ra:** `{ weekMonday, days, employees: [...], summary: { totalEmployees, registeredCount, unregisteredCount, totalAvailable, totalBusy } }`.
- **Quy tắc kiểm tra:**
  - Tự động loại bỏ nhân viên có trạng thái `"Nghỉ việc"`.
  - Nhân viên chưa đăng ký (`registered === false`) không được tính ô nào là "Rảnh" (tất cả là `unregistered`).
- **Lỗi trả về:** Không có.
- **Dữ liệu bị đổi:** Không đổi (Read-only).
- **Backend PHP Mapping:** `GET /api/availability/weekly?weekMonday={weekMondayIso}`

### 2.2 `isEmployeeAvailable(employeeId, weekKey, dayIndex, shiftName)`
- **Làm gì:** Kiểm tra xem một nhân viên có đăng ký rảnh ở một ca cụ thể không (phục vụ xếp lịch US11).
- **Đầu vào:** `employeeId` (mã NV), `weekKey`, `dayIndex` (0-6), `shiftName` ("Sáng"|"Chiều"|"Tối").
- **Đầu ra:** `boolean` (`true` nếu rảnh, `false` nếu bận hoặc chưa đăng ký).
- **Quy tắc kiểm tra:** Nhân viên "Nghỉ việc" hoặc "Chưa đăng ký" luôn trả về `false`.
- **Lỗi trả về:** Không có.
- **Dữ liệu bị đổi:** Không đổi.
- **Backend PHP Mapping:** Logic xử lý nội bộ tại backend hoặc helper query.

---

## 3. DỊCH VỤ XẾP LỊCH TỰ ĐỘNG & QUẢN LÝ LỊCH (scheduleService.js)

### 3.1 `getScheduleBoard(weekKey)`
- **Làm gì:** Lấy toàn bộ ma trận phân công ca làm việc, định biên nhu cầu và ràng buộc tuần.
- **Đầu vào:** `weekKey` (mã tuần hoặc label tuần).
- **Đầu ra:** `{ weekKey, schedules, employees, days, demands, constraints }`.
- **Quy tắc kiểm tra:** Danh sách `employees` chỉ chứa nhân viên đang làm việc, loại bỏ nhân viên nghỉ việc.
- **Lỗi trả về:** Không có.
- **Dữ liệu bị đổi:** Không đổi.
- **Backend PHP Mapping:** `GET /api/schedules/{weekKey}`

### 3.2 `autoScheduleORTools / generateSchedule(params)`
- **Làm gì:** Tự động xếp nhân sự vào 21 ca trong tuần theo định biên và ràng buộc tối ưu.
- **Đầu vào:** `{ weekKey, employees, demands, constraints }`.
- **Đầu ra:** Bản đồ phân ca `schedules` mới.
- **Quy tắc kiểm tra:**
  1. Chỉ gán nhân viên thỏa mãn cả 3 điều kiện: (a) đúng `Role_Tag`, (b) trạng thái `"Đang làm việc"`, (c) `isEmployeeAvailable === true`.
  2. Nhân viên "Bận" hoặc "Chưa đăng ký" tuyệt đối không được phân vào ca đó.
  3. Nhân viên "Nghỉ việc" tuyệt đối không xuất hiện trong lịch.
  4. Nếu không có ai thỏa mãn định biên: để trống ca và đánh dấu thiếu người (để mở Open Shift).
- **Lỗi trả về:** Không ném lỗi phá vỡ luồng; trả về kết quả xếp kèm danh sách ca thiếu người.
- **Dữ liệu bị đổi:** Cập nhật bản nháp `schedules`.
- **Backend PHP Mapping:** `POST /api/schedules/auto-generate`

### 3.3 `confirmSchedule(weekKey, schedules)`
- **Làm gì:** Ban hành chính thức lịch làm việc tuần cho toàn thể nhân viên.
- **Đầu vào:** `weekKey`, `schedules`.
- **Đầu ra:** `{ success: true, confirmedAt: string }`.
- **Quy tắc kiểm tra:** Phải có ít nhất 1 ca được phân công; đánh dấu lịch chính thức sang sổ cái phân công.
- **Lỗi trả về:** `"Không có dữ liệu lịch làm việc để phát hành."`.
- **Dữ liệu bị đổi:** Chuyển trạng thái lịch sang `published: true` trong bảng `schedules`, đồng bộ sang `attendance`.
- **Backend PHP Mapping:** `POST /api/schedules/publish`

---

## 4. DỊCH VỤ ĐỔI CA LÀM VIỆC (shiftExchangeService.js)

### 4.1 `createExchangeRequest(data)`
- **Làm gì:** Nhân viên tạo yêu cầu đổi ca (hoán đổi ca swap hoặc nhờ làm thay cover).
- **Đầu vào:** `{ requesterId, requesterShift, targetEmployeeId, targetShift, exchangeType, reason }`.
- **Đầu ra:** Bản ghi `ExchangeRequest` vừa tạo với trạng thái `pending_peer` hoặc `pending_manager`.
- **Quy tắc kiểm tra:**
  1. Cả 2 nhân viên phải có trạng thái `"Đang làm việc"`.
  2. Cùng `Role_Tag` (so sánh chuyên môn, không cho đổi chéo chuyên môn).
  3. Ca làm việc phải thuộc tuần đang áp dụng.
  4. Ca làm việc không thuộc kỳ lương đã chốt sổ (`!isPeriodLocked`).
  5. Ca làm việc chưa bắt đầu (`!hasShiftStarted`).
  6. Ca làm việc chưa phát sinh check-in chấm công.
- **Lỗi trả về:**
  - `"Nhân viên đã nghỉ việc, không thể tham gia yêu cầu đổi ca."`
  - `"Không thể đổi ca khác vị trí chuyên môn (Role_Tag)! Bạn là ..., đồng nghiệp là ..."`
  - `"Ngày này không thuộc lịch đang áp dụng"`
  - `"Ca làm việc thuộc kỳ lương đã chốt sổ, không thể tạo yêu cầu đổi ca!"`
  - `"Ca làm việc đã bắt đầu hoặc đã qua, không thể tạo yêu cầu đổi ca!"`
  - `"Ca làm việc đã có dữ liệu chấm công (check-in), không thể đổi ca!"`
- **Dữ liệu bị đổi:** Thêm bản ghi vào bảng `shift_exchanges`.
- **Backend PHP Mapping:** `POST /api/shift-exchange`

### 4.2 `managerApproveExchange(id, managerNote)`
- **Làm gì:** Quản lý phê duyệt yêu cầu đổi ca.
- **Đầu vào:** `id` (mã đơn đổi ca), `managerNote` (ghi chú của Quản lý).
- **Đầu ra:** Object đơn đổi ca với `status = "approved"`.
- **Quy tắc kiểm tra:**
  1. Đơn phải ở trạng thái `"pending_manager"`.
  2. Ràng buộc `Role_Tag`, trạng thái `"Đang làm việc"`, kỳ chưa chốt, ca chưa bắt đầu, chưa check-in.
  3. Không trùng giờ làm việc của nhân viên nhận ca.
- **Lỗi trả về:**
  - `"Chỉ có thể phê duyệt yêu cầu đang ở trạng thái 'Chờ quản lý duyệt' (pending_manager)!"`
  - `"Ca làm việc thuộc kỳ lương đã chốt sổ, không thể đổi ca!"`
  - `"Nhân viên ... đã được phân công trong ca này rồi, không thể nhận thêm!"`
- **Dữ liệu bị đổi:**
  - Cập nhật trạng thái đơn thành `"approved"`.
  - Cập nhật trực tiếp `assigned` trong bảng `schedules`.
  - Đồng bộ hoán đổi nhân viên trong sổ cái chấm công `attendance`.
- **Backend PHP Mapping:** `PATCH /api/shift-exchange/{id}/approve`

### 4.3 `managerRejectExchange(id, rejectReason)`
- **Làm gì:** Quản lý từ chối đơn đổi ca.
- **Đầu vào:** `id`, `rejectReason` (lý do từ chối bắt buộc).
- **Đầu ra:** Object đơn đổi ca với `status = "rejected"`.
- **Quy tắc kiểm tra:** Đơn chưa bị hủy hoặc đã duyệt.
- **Lỗi trả về:** `"Vui lòng nhập lý do từ chối."`.
- **Dữ liệu bị đổi:** Cập nhật `status = "rejected"`, lưu `rejectReason`.
- **Backend PHP Mapping:** `PATCH /api/shift-exchange/{id}/reject`

---

## 5. DỊCH VỤ CA TRỰC MỞ (openShiftService.js)

### 5.1 `createOpenShift(data)`
- **Làm gì:** Quản lý đăng tin ca trực mở khi ca bị thiếu người hoặc có nhân viên xin nghỉ.
- **Đầu vào:** `{ date, shiftId, shiftName, role, needed, bonusAmount, note }`.
- **Đầu ra:** Bản ghi ca mở mới (`OSxxx`).
- **Quy tắc kiểm tra:** Ngày ca mở không thuộc kỳ lương đã chốt; ngày ca mở không nằm trong quá khứ.
- **Lỗi trả về:** `"Không thể tạo ca trực mở cho kỳ lương đã chốt."`.
- **Dữ liệu bị đổi:** Thêm bản ghi vào bảng `open_shifts`.
- **Backend PHP Mapping:** `POST /api/open-shifts`

### 5.2 `claimOpenShift(id, employee)`
- **Làm gì:** Nhân viên đăng ký nhận làm ca trực mở.
- **Đầu vào:** `id` (mã ca mở), `employee` (`{ employeeId, roleTags, status }`).
- **Đầu ra:** Bản ghi ca mở đã cập nhật danh sách `claims`.
- **Quy tắc kiểm tra:**
  1. Nhân viên không ở trạng thái `"Nghỉ việc"`.
  2. Ca mở không thuộc kỳ lương đã chốt sổ (`!isPeriodLocked`).
  3. Ca mở chưa bắt đầu (`!hasShiftStarted`).
  4. Nhân viên thỏa mãn kỹ năng `roleTag` tương ứng của ca.
  5. Nhân viên chưa có ca làm việc khác trùng giờ trong ngày đó.
- **Lỗi trả về:**
  - `"Nhân viên đã nghỉ việc, không thể nhận ca trực mở!"`
  - `"Ca làm việc thuộc kỳ lương đã chốt sổ, không thể nhận ca!"`
  - `"Ca làm việc đã bắt đầu hoặc đã qua, không thể nhận ca!"`
  - `"Bạn không có kỹ năng phù hợp với yêu cầu ca trực này."`
  - `"Bạn đã có lịch làm việc trong khung giờ này."`
- **Dữ liệu bị đổi:** Thêm claim vào `open_shifts.claims`.
- **Backend PHP Mapping:** `POST /api/open-shifts/{id}/claim`

---

## 6. DỊCH VỤ ĐƠN XIN NGHỈ PHÉP (leaveService.js)

### 6.1 `submitLeave(data)`
- **Làm gì:** Nhân viên nộp đơn xin nghỉ phép một ca cụ thể.
- **Đầu vào:** `{ employeeId, isoDate, shiftId, shiftName, shiftTime, leaveType, reason }`.
- **Đầu ra:** Bản ghi đơn nghỉ phép mới (`LV-2026-xxx`) với `status = "pending"`.
- **Quy tắc kiểm tra:**
  1. Ca xin nghỉ không thuộc kỳ lương đã chốt sổ (`!isPeriodLocked`).
  2. Ca xin nghỉ chưa bắt đầu và chưa diễn ra.
- **Lỗi trả về:**
  - `"Ca xin nghỉ thuộc kỳ lương đã chốt sổ, không thể gửi đơn xin nghỉ!"`
  - `"Không thể xin nghỉ ca làm việc trong quá khứ hoặc đã bắt đầu."`
- **Dữ liệu bị đổi:** Thêm bản ghi vào bảng `leave_requests`.
- **Backend PHP Mapping:** `POST /api/leave`

### 6.2 `approveLeave(id, managerNote)`
- **Làm gì:** Quản lý duyệt đơn xin nghỉ phép.
- **Đầu vào:** `id`, `managerNote`.
- **Đầu ra:** Object đơn nghỉ với `status = "approved"`.
- **Quy tắc kiểm tra:**
  1. Ca xin nghỉ không thuộc kỳ lương đã chốt sổ (`!isPeriodLocked`).
  2. Ca xin nghỉ chưa có check-in.
- **Lỗi trả về:**
  - `"Ca xin nghỉ thuộc kỳ lương đã chốt sổ, không thể duyệt nghỉ phép!"`
  - `"Ca làm việc đã có dữ liệu chấm công (check-in), không thể duyệt nghỉ phép!"`
- **Dữ liệu bị đổi:**
  - Cập nhật trạng thái đơn thành `"approved"`.
  - Cập nhật bản ghi chấm công tương ứng trong `attendance` thành `status = "On-Leave"`, `actualMin = 0`.
- **Backend PHP Mapping:** `PATCH /api/leave/{id}/approve`

---

## 7. DỊCH VỤ CHẤM CÔNG & ĐIỀU CHỈNH (attendanceService.js)

### 7.1 `getAttendanceRecords(params)`
- **Làm gì:** Lấy danh sách đối soát chấm công theo kỳ (tuần/tháng/khoảng ngày) kèm bộ lọc trạng thái và tìm kiếm.
- **Đầu vào:** `params = { period, from, to, employeeId, status, roleTag }`.
- **Đầu ra:** `{ periodLabel, rows: [...], counts: { total, completedTotal, "On-Time", "Late", "Absent", "Missing-Checkout", "In-Progress", "Upcoming", "On-Leave" } }`.
- **Quy tắc kiểm tra:**
  - Ca tương lai (`s.iso > today` hoặc ca hôm nay chưa đến giờ bắt đầu) mang trạng thái `"Upcoming"` (hoặc `"On-Leave"` nếu đã duyệt nghỉ), tuyệt đối không đánh dấu `"Absent"`.
  - Ca đang diễn ra mang trạng thái `"In-Progress"`.
  - `completedTotal` chỉ đếm các ca đã kết thúc (`isCompleted === true`).
- **Lỗi trả về:** Không có.
- **Dữ liệu bị đổi:** Không đổi (Read-only).
- **Backend PHP Mapping:** `GET /api/attendance`

### 7.2 `adjustAttendance(id, { checkIn, checkOut, reason, modifier })`
- **Làm gì:** Quản lý điều chỉnh bổ sung giờ vào/ra thực tế cho ca bị thiếu hoặc sai sót (US26).
- **Đầu vào:** `id` (mã bản ghi chấm công), `checkIn` (HH:mm), `checkOut` (HH:mm), `reason` (lý do), `modifier`.
- **Đầu ra:** Bản ghi chấm công sau điều chỉnh kèm lịch sử sửa đổi `auditTrail`.
- **Quy tắc kiểm tra:**
  1. Bản ghi không thuộc kỳ lương đã chốt sổ (`!isPeriodLocked(record.iso)`).
  2. Bắt buộc nhập cả `checkIn` và `checkOut`.
  3. `checkOut` phải sau `checkIn` (`outMin > inMin`).
  4. Bắt buộc nhập lý do điều chỉnh (`reason`).
- **Lỗi trả về:**
  - `"Bản ghi thuộc kỳ lương đã chốt, không thể điều chỉnh."`
  - `"Vui lòng nhập đủ giờ check-in và check-out."`
  - `"Giờ check-out phải sau giờ check-in."`
  - `"Vui lòng nhập lý do điều chỉnh."`
- **Dữ liệu bị đổi:** Cập nhật `checkInMin`, `checkOutMin`, `actualMin`, `status` và ghi nhật ký vào `auditTrail` trong bảng `attendance`. Tự động kéo theo tính lại giờ làm và bảng lương.
- **Backend PHP Mapping:** `PATCH /api/attendance/{id}/adjust`

---

## 8. DỊCH VỤ TỔNG HỢP GIỜ LÀM (workHoursService.js)

### 8.1 `getWorkHoursSummary(params)`
- **Làm gì:** Thống kê tổng giờ làm theo kế hoạch, giờ làm thực tế, giờ ca đêm, giờ ngày lễ và số ca của từng nhân viên.
- **Đầu vào:** `params = { period, from, to, employeeId, roleTag }`.
- **Đầu ra:** `{ periodLabel, rows: [...], totals: { scheduledHours, actualHours, nightHours, holidayHours, shiftCount } }`.
- **Quy tắc kiểm tra:**
  - Tính toán động 100% từ sổ cái chấm công `attendance`.
  - Loại bỏ hoàn toàn nhân viên có trạng thái `"Nghỉ việc"`.
  - Khớp số liệu 100% với Chấm công và Báo cáo.
- **Lỗi trả về:** Không có.
- **Dữ liệu bị đổi:** Không đổi.
- **Backend PHP Mapping:** `GET /api/work-hours`

---

## 9. DỊCH VỤ BẢNG LƯƠNG & CHỐT SỔ (payrollService.js)

### 9.1 `getPayrollSummary(params)`
- **Làm gì:** Tính lương chi tiết từng nhân viên theo ca đã kết thúc, áp dụng đơn giá giờ, hệ số ca đêm/lễ và thưởng ca mở.
- **Đầu vào:** `params = { period, from, to, label }`.
- **Đầu ra:** `{ periodKey, periodLabel, from, to, rows: [...], totals, isLocked, isEnded, issues }`.
- **Quy tắc kiểm tra:**
  - Chỉ tính các ca đã kết thúc (`isCompleted === true`). Ca thiếu giờ ra tính 0h và đưa vào cảnh báo `issues`.
  - Nếu kỳ lương đã chốt sổ (`isLocked === true`): trả về trực tiếp snapshot bất biến từ `payrollSnapshots`, không tính toán lại, không đọc mức lương giờ hiện tại.
  - `isEnded = today > to`: Đánh dấu kỳ đã kết thúc hay chưa.
- **Lỗi trả về:** Không có.
- **Dữ liệu bị đổi:** Không đổi (Read-only).
- **Backend PHP Mapping:** `GET /api/payroll`

### 9.2 `lockPayrollPeriod(periodKey)`
- **Làm gì:** Quản lý thực hiện chốt sổ kỳ lương (US27), cố định số liệu làm căn cứ thanh toán và ngăn chặn chỉnh sửa.
- **Đầu vào:** `periodKey` (ví dụ: `"2026-10"` hoặc `"2026-10-19_2026-10-25"`).
- **Đầu ra:** Object snapshot bất biến của kỳ lương vừa chốt.
- **Quy tắc kiểm tra:**
  1. Kỳ lương chưa từng được chốt trước đó.
  2. **Kỳ lương phải đã kết thúc**: Ngày hiện tại phải qua ngày cuối cùng của kỳ (`todayIso > endIso`).
- **Lỗi trả về:**
  - `"Kỳ lương \"...\" đã được chốt sổ trước đó, không thể chốt lại."`
  - `"Kỳ lương chưa kết thúc (ngày hiện tại chưa qua ngày cuối kỳ), không thể chốt sổ."`
- **Dữ liệu bị đổi:**
  - Ghi nhận `periodKey` vào danh sách `payrollLocks`.
  - Lưu bản sao snapshot bất biến vào bảng `payroll_snapshots`.
- **Backend PHP Mapping:** `POST /api/payroll/lock`

### 9.3 `unlockPayrollPeriod(periodKey)`
- **Làm gì:** Quản lý mở chốt sổ kỳ lương để điều chỉnh lại khi cần thiết.
- **Đầu vào:** `periodKey`.
- **Đầu ra:** `{ success: true, periodKey }`.
- **Quy tắc kiểm tra:** `periodKey` phải đang ở trạng thái bị khóa.
- **Lỗi trả về:** Không có.
- **Dữ liệu bị đổi:** Xóa `periodKey` khỏi `payrollLocks` và xóa bản ghi trong `payroll_snapshots`.
- **Backend PHP Mapping:** `POST /api/payroll/unlock`

---

## 10. DỊCH VỤ DASHBOARD & BÁO CÁO (dashboardService.js & reportService.js)

### 10.1 `getDashboardStats(params)`
- **Làm gì:** Tổng hợp các chỉ số KPI điều hành, dải thẻ thống kê, cảnh báo thiếu người, lịch tuần tóm tắt và biểu đồ chi phí.
- **Đầu vào:** `params = { period, from, to, roleTag, shiftName }`.
- **Đầu ra:** `{ cards, employeeCounts, totalEmployees, schedule, hoursPerEmployee, costPerBucket, attendance, todo, understaffed, kpis }`.
- **Quy tắc kiểm tra:**
  - `totalEmployees` = 7 (loại bỏ nhân viên nghỉ việc, khớp hàm đếm chung).
  - Tỷ lệ vắng và trễ tính theo mẫu số `completedShifts` (số ca đã kết thúc).
  - `cards.payrollCost` khớp đúng công thức tính của Bảng lương.
- **Lỗi trả về:** Không có.
- **Dữ liệu bị đổi:** Không đổi.
- **Backend PHP Mapping:** `GET /api/dashboard`

### 10.2 `getReportData(type, params)`
- **Làm gì:** Xuất dữ liệu báo cáo chuyên sâu (phân công ca, giờ làm, chấm công, lương) dạng bảng để xem trước và xuất Excel.
- **Đầu vào:** `type` ("roster"|"hours"|"attendance"|"payroll"), `params`.
- **Đầu ra:** `{ title, sheetName, fileBase, periodLabel, columns, rows, footer }`.
- **Quy tắc kiểm tra:** Dữ liệu khớp 100% với các trang nguồn tương ứng.
- **Lỗi trả về:** Không có.
- **Dữ liệu bị đổi:** Không đổi.
- **Backend PHP Mapping:** `GET /api/reports/{type}`

---

## 11. DỊCH VỤ NHÂN VIÊN (STAFF SERVICES - US08, US13, US19)

### 11.1 Đăng ký lịch rảnh / bận (availabilityService.js - US08)
- **getMyAvailability({ weekMonday, employeeId })**:
  - Đọc từ `db.availabilities` theo `employeeId` và ngày Thứ 2 của tuần (`weekMondayIso`).
  - Đọc danh mục ca làm việc kích hoạt từ `db.shiftConfig.shifts`.
  - Tính toán hạn chót: `deadline = weekMonday - 3 ngày` (Thứ Sáu trước tuần làm việc lúc 23:59:59).
  - So sánh `getNow()` với `deadline`: nếu quá hạn thì đặt `isPastDeadline = true`, `isLocked = true` (chế độ chỉ xem, khóa chỉnh sửa).
  - Trả về: `{ weekMonday, weekLabel, deadlineAt, isPastDeadline, isLocked, submittedAt, slots, shifts, days }`.
- **saveMyAvailability({ employeeId, weekMonday, slots })**:
  - Kiểm tra hạn chót: nếu `getNow() > deadline`, từ chối và ném lỗi tiếng Việt: *"Đã hết hạn đăng ký cho tuần này (Hạn chót: 23:59:59 Thứ Sáu trước tuần làm việc)."*
  - Ghi nhận vào `db.availabilities` qua `saveStaffAvailability(employeeId, weekMonday, slots)`.
  - Quản lý mở màn hình Khả năng làm việc (US09) lập tức thấy trạng thái *"Đã đăng ký"*, số ca Rảnh/Bận và chi tiết từng ô khớp 100%.

### 11.2 Lịch của tôi (scheduleService.js - US13)
- **getMySchedule({ week_start, employeeId })**:
  - Đọc từ `getSavedSchedules()` trong `db.schedules`.
  - Quy tắc công bố:
    - Tuần hiện tại hoặc quá khứ: mặc định là đã công bố (`published = true`).
    - Tuần tương lai: phụ thuộc cờ `isScheduleConfirmed()`. Nếu Quản lý chưa công bố chính thức thì `published = false` (giao diện hiển thị thông báo chưa công bố, không hiện ca làm).
  - Lọc phân ca: Duyệt qua tất cả các slot ngày/ca của tuần, tìm các slot mà `assigned` chứa `employeeId`.
  - Trả về danh sách ca làm việc gồm: `{ id, shiftName, startTime, endTime, dayName, date, roleTag, coworkers, published }`.
  - Đăng ký `subscribeSchedule`: khi Quản lý duyệt đổi ca hoặc công bố lịch, Staff tự động thấy cập nhật thời gian thực.

### 11.3 Nhận ca trực mở (openShiftService.js - US19)
- **getOpenShifts(params)**:
  - Đọc danh sách ca mở từ `getSavedOpenShifts()` (`db.openShifts`).
  - Hỗ trợ lọc theo trạng thái: `open` (chưa đủ người, chưa hủy), `filled` (đã đủ người), hoặc tất cả.
- **claimOpenShift(shiftId, employee, expectedVersion)**:
  - **Quy tắc kiểm tra:**
    1. Chặn nhân viên có trạng thái *"Nghỉ việc"*.
    2. Chặn ca thuộc kỳ lương đã chốt sổ (`isPeriodLocked`).
    3. Chặn ca đã bắt đầu hoặc đã qua thời điểm bắt đầu (`hasShiftStarted`).
    4. Chặn ca đã có dữ liệu chấm công check-in.
    5. Kiểm tra chuyên môn `Role_Tag` (phải khớp yêu cầu của ca trực mở).
    6. Kiểm tra trùng ca/trùng giờ làm việc chính thức trong ngày.
    7. Optimistic Locking: nếu `shift.version !== expectedVersion`, từ chối với thông báo: *"Ca này vừa được cập nhật, vui lòng tải lại danh sách rồi nhận lại."*
  - **Đồng bộ dữ liệu hai chiều:**
    - Ghi nhận `claim` vào ca mở, tăng `version`.
    - Đồng bộ trực tiếp vào `db.schedules` (thêm nhân viên vào danh sách `assigned` của slot).
    - Đồng bộ vào sổ cái chấm công `db.attendance` với mức thưởng `openShiftBonus` thật.
    - Tiền thưởng khuyến khích tự động xuất hiện trên Bảng tính lương Manager (`db.payroll`) khi ca kết thúc.

---

## 12. BẢNG TỔNG KẾT KẾT NỐI API & TÍNH SẴN SÀNG CHUYỂN ĐỔI SANG PHP

| Tầng Dịch Vụ (Service) | Tệp Nguồn Service | Phương thức truy cập hiện tại | Endpoint REST API PHP dự kiến | Sẵn sàng thay Mock |
| :--- | :--- | :--- | :--- | :---: |
| **Nhân sự** | `employeeService.js` | `USE_MOCK ? db : httpClient` | `GET/POST/PUT /api/employees` | **100%** |
| **Khả năng làm việc** | `availabilityService.js` | `USE_MOCK ? db : httpClient` | `GET/POST /api/availability` | **100%** |
| **Xếp lịch** | `scheduleService.js` | `scheduleMock.js` & `db.js` | `GET/POST /api/schedules` | **100%** |
| **Đổi ca** | `shiftExchangeService.js` | `shiftExchangeMock.js` & `httpClient` | `GET/POST/PATCH /api/shift-exchange` | **100%** |
| **Ca trực mở** | `openShiftService.js` | `openShiftMock.js` & `httpClient` | `GET/POST /api/open-shifts` | **100%** |
| **Đơn xin nghỉ** | `leaveService.js` | `leaveMock.js` & `httpClient` | `GET/POST/PATCH /api/leave` | **100%** |
| **Chấm công** | `attendanceService.js` | `attendanceMock.js` & `httpClient` | `GET/PATCH /api/attendance` | **100%** |
| **Giờ làm việc** | `workHoursService.js` | `workHoursMock.js` & `httpClient` | `GET /api/work-hours` | **100%** |
| **Tính lương** | `payrollService.js` | `payrollMock.js` & `httpClient` | `GET/POST /api/payroll` | **100%** |
| **Dashboard** | `dashboardService.js` | `dashboardMock.js` & `httpClient` | `GET /api/dashboard` | **100%** |
| **Báo cáo** | `reportService.js` | `reportMock.js` & `httpClient` | `GET /api/reports` | **100%** |

> **Lưu ý triển khai Backend PHP:**  
> Tất cả các service ở frontend đều đã được bọc qua cờ `VITE_USE_MOCK !== "false"`. Khi chuyển sang backend PHP thật, chỉ cần thiết lập biến môi trường `VITE_USE_MOCK=false` trong file `.env`, frontend sẽ tự động chuyển hướng toàn bộ sang các endpoint REST API liệt kê ở bảng trên thông qua `httpClient.js` mà không cần chỉnh sửa code UI.

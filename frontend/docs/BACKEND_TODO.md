# DANH MỤC LOGIC NGHIỆP VỤ CẦN TRIỂN KHAI TẠI BACKEND (BACKEND_TODO)

> **Mục tiêu**: Frontend được tối giản chỉ giữ lại giao diện (UI) và dữ liệu mẫu độc lập. Toàn bộ các quy tắc nghiệp vụ, tính toán đồng bộ chéo giữa các màn hình và vai trò được liệt kê chi tiết dưới đây để đội ngũ Backend PHP / Laravel triển khai.
> **Mã tham chiếu code quy tắc**: Toàn bộ thuật toán và mã xử lý logic cũ đã được trích xuất lưu tại `docs/backend_reference.js`.

---

## BẢNG TỔNG HỢP LOGIC CẦN XỬ LÝ TẠI BACKEND

| STT | Chức năng | Ai kích hoạt | Hệ quả cần backend làm | Bảng DB liên quan |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Đăng nhập hệ thống (US01) | User (Manager/Staff) | Kiểm tra email và password_hash, kiểm tra trạng thái tài khoản active; nếu inactive chặn với `ACCOUNT_DISABLED`, cấp token JWT/Sanctum; trả về user info không kèm password | `users`, `employees` |
| 2 | Đăng xuất (US02) | User | Thu hồi Bearer Token / hủy session | `personal_access_tokens` / `sessions` |
| 3 | Đổi mật khẩu (US03) | Staff / Manager | Xác thực mật khẩu cũ, kiểm tra độ dài $\ge 8$ ký tự, băm mật khẩu mới bằng `bcrypt`/`argon2`, cập nhật `users.password_hash` | `users` |
| 4 | Tạo nhân viên mới (US04) | Manager | Transaction: Kiểm tra `email` duy nhất (lỗi `EMAIL_EXISTS`), tạo bản ghi `users` (vai trò `'staff'`, status `'active'`), tạo bản ghi `employees` liên kết `user_id`, mật khẩu $\ge 8$ ký tự | `users`, `employees` |
| 5 | Cập nhật hồ sơ nhân viên (US05) | Manager | Cập nhật thông tin `employees`. Nếu trạng thái chuyển thành `'Nghỉ việc'`, cập nhật đồng thời `users.status = 'inactive'`, thu hồi mọi token đăng nhập ngay lập tức | `employees`, `users`, `personal_access_tokens` |
| 6 | Đăng ký lịch rảnh (US08) | Staff | Kiểm tra hạn chót (Thứ 6 23:59:59 trước tuần áp dụng, lỗi `DEADLINE_EXCEEDED`); kiểm tra Optimistic Locking qua `version` (lỗi `CONFLICT`); lưu slots rảnh/bận; tự động tạo thông báo gửi Quản lý | `availabilities`, `notifications` |
| 7 | Xem/Duyệt lịch rảnh (US09) | Manager | Xem danh sách rảnh toàn nhân viên (loại trừ nhân viên `'Nghỉ việc'`); duyệt hoặc từ chối kèm lý do; gửi thông báo kết quả cho nhân viên | `availabilities`, `notifications` |
| 8 | Cấu hình ca làm việc (US10) | Manager | Lưu danh mục ca (Sáng, Chiều, Tối, giờ bắt đầu/kết thúc, hệ số lương ban đêm, định biên người cần tối thiểu/tối đa) | `shift_configs` |
| 9 | Xếp lịch tự động (US11) | Manager | Chạy thuật toán xếp ca (OR-Tools / Greedy): Tôn trọng lịch rảnh (`available`), không gán người bận (`busy`), đảm bảo nghỉ giữa 2 ca $\ge 12$ giờ, không trùng ca trong ngày, không gán người `'Nghỉ việc'`, tối ưu định biên theo cấu hình ca | `schedules`, `shift_configs`, `availabilities`, `employees` |
| 10 | Công bố lịch tuần (US12) | Manager | Chuyển trạng thái lịch từ `draft` sang `published`. Tự động tạo thông báo gửi toàn bộ nhân viên có ca trong tuần; Staff chỉ thấy lịch khi đã `published` | `schedules`, `weekly_schedules`, `notifications` |
| 11 | Chỉnh sửa ca sau công bố (US12) | Manager | Cập nhật nhân viên hoặc giờ ca; tự động tạo thông báo cho nhân viên bị thay đổi ca | `schedules`, `notifications` |
| 12 | Tổng hợp giờ làm (US13, US14) | Manager | Tính động từ dữ liệu chấm công `attendance`: Tổng giờ làm thực tế, giờ kế hoạch, giờ tăng ca, số lần đi muộn/về sớm của từng nhân viên theo kỳ lọc | `attendance`, `schedules`, `employees` |
| 13 | Tạo yêu cầu đổi ca (US15) | Staff A | Kiểm tra ca của A có tồn tại và chưa diễn ra; kiểm tra Staff B không bị trùng ca và thỏa mãn nghỉ $\ge 12$ giờ (lỗi `SHIFT_CONFLICT`); tạo đơn trạng thái `PENDING_TARGET`; gửi thông báo cho B | `shift_exchanges`, `schedules`, `notifications` |
| 14 | Phản hồi đổi ca (US16) | Staff B | Nếu B đồng ý: Chuyển sang `PENDING_MANAGER`, gửi thông báo cho Quản lý. Nếu B từ chối: Chuyển sang `REJECTED`, gửi thông báo cho A | `shift_exchanges`, `notifications` |
| 15 | Duyệt đổi ca (US17) | Manager | Transaction: Nếu duyệt (`APPROVED`), hoán đổi `employee_id` của 2 ca trực trong `schedules`, đồng bộ bản ghi `attendance`, gửi thông báo cho cả A và B. Nếu từ chối (`REJECTED`), lưu lý do và thông báo cho cả hai | `shift_exchanges`, `schedules`, `attendance`, `notifications` |
| 16 | Đăng ca trực mở (US18) | Manager | Tạo bản ghi ca mở với ngày, ca, vị trí (`role_tag`), số người cần (`needed`), tiền thưởng (`bonus_amount`), trạng thái `OPEN` | `open_shifts` |
| 17 | Nhận ca trực mở (US19) | Staff | Race condition check: Dùng `SELECT ... FOR UPDATE` hoặc Optimistic Locking (`version`), chỉ người đầu tiên thành công (`CLAIMED`), người sau nhận `ALREADY_CLAIMED`; kiểm tra đúng `role_tag`, không trùng ca, nghỉ $\ge 12$ giờ; gán vào `schedules`, tạo bản ghi `attendance`, cộng `bonus_amount` vào lương | `open_shifts`, `schedules`, `attendance`, `payrolls` |
| 18 | Gửi đơn xin nghỉ phép (US20) | Staff | Kiểm tra ngày nghỉ hợp lệ, tạo đơn trạng thái `PENDING`, gửi thông báo cho Quản lý | `leave_requests`, `notifications` |
| 19 | Duyệt đơn nghỉ phép (US21) | Manager | Transaction: Nếu duyệt (`APPROVED`), ca trực của nhân viên vào ngày nghỉ tự động chuyển `status = 'On-Leave'` trong `schedules`, bản ghi `attendance` đánh dấu `on_leave = true` (không tính là vắng `Absent`); gửi thông báo cho nhân viên; có thể tùy chọn mở Open Shift để bù chỗ | `leave_requests`, `schedules`, `attendance`, `open_shifts`, `notifications` |
| 20 | Từ chối đơn nghỉ phép (US21) | Manager | Yêu cầu nhập lý do từ chối; chuyển `status = 'REJECTED'`; gửi thông báo giải thích cho nhân viên | `leave_requests`, `notifications` |
| 21 | Check-in / Check-out chấm công (US24) | Staff | Ghi nhận thời gian thực chấm công, tọa độ GPS / BSSID Wi-Fi / ảnh selfie; tính toán trạng thái `On-Time` hoặc `Late` (so với giờ bắt đầu ca trong cấu hình); cập nhật sổ cái `attendance` | `attendance`, `shift_configs` |
| 22 | Phân loại đối soát ca (US25) | Hệ thống | Phân loại ca: Chưa tới giờ $\rightarrow$ `Upcoming`; Đang chạy $\rightarrow$ `In-Progress`; Đã qua giờ mà không check-in $\rightarrow$ `Absent` (Vắng không phép); Ca hoàn thành $\rightarrow$ `Completed`. Mẫu số tính tỷ lệ vắng chỉ tính trên ca đã kết thúc | `attendance`, `schedules` |
| 23 | Điều chỉnh chấm công (US26) | Manager | Transaction: Cập nhật giờ vào/ra, loại điều chỉnh (`IN`, `OUT`, `BOTH`), ghi nhận lý do bắt buộc, lưu lịch sử kiểm toán vào bảng `attendance_adjustments` (ai sửa, lúc nào, giá trị cũ/mới, lý do) | `attendance`, `attendance_adjustments` |
| 24 | Tính toán bảng lương (US27) | Hệ thống | Tính động cho các ca đã hoàn thành: $\text{Lương} = (\text{Giờ làm} \times \text{Lương giờ}) + \text{Thưởng ca mở} + \text{Thưởng thêm} - \text{Phạt đi muộn/vắng}$ | `payrolls`, `attendance`, `employees`, `open_shifts` |
| 25 | Chốt sổ / Mở chốt bảng lương (US27) | Manager | Chốt lương (`LOCKED`): Tạo snapshot bất biến lưu vào `payroll_snapshots`. Sau khi chốt, mọi thao tác sửa chấm công, đổi ca, sửa giờ của kỳ đó đều bị chặn (`PAYROLL_LOCKED`). Mở chốt (`UNLOCKED`): Yêu cầu quyền quản lý cấp cao | `payroll_locks`, `payroll_snapshots` |
| 26 | Tổng hợp Dashboard & KPI (US28) | Hệ thống | Tổng hợp động: Tỷ lệ lấp đầy ca, chi phí dự kiến, cảnh báo thiếu người, danh sách việc cần xử lý (đơn nghỉ, đổi ca, duyệt rảnh); Đếm nhân viên active (ví dụ 7 = 6 đang làm việc + 1 nghỉ phép; loại trừ người nghỉ việc) | `schedules`, `attendance`, `employees`, `leave_requests`, `shift_exchanges` |
| 27 | Xuất báo cáo Excel (US29) | Manager | Tổng hợp dữ liệu từ DB, kết xuất dữ liệu báo cáo đối soát chi tiết giờ làm, công, lương theo định dạng chuẩn | `attendance`, `payrolls`, `employees`, `schedules` |
| 28 | Trợ lý ảo AI & Truy vấn dữ liệu (US23) | Manager | Phân tích câu hỏi tự nhiên, truy vấn CSDL lịch và quy chế, trả lời câu hỏi về xung đột lịch và nhân sự | LLM API, `schedules`, `employees`, `shift_configs` |
| 29 | Cho nhân viên thôi việc & giải phóng ca tương lai (US06) | Manager | Transaction: Đổi trạng thái `employees.status = 'Nghỉ việc'`, khóa tài khoản `users.status = 'inactive'`, thu hồi token; tự động gỡ nhân viên khỏi toàn bộ các ca chính thức tương lai (`schedules.assigned` $\rightarrow$ unfilled / chưa có người), gửi thông báo cho Manager: "[Tên NV] đã nghỉ việc. Cần phân công lại N ca tương lai." Kích hoạt lại chỉ đổi `status = 'Đang làm việc'`, KHÔNG tự gán lại các ca cũ. | `employees`, `users`, `schedules`, `notifications` |
| 30 | Hủy đơn xin nghỉ phép (US23) | Staff | Cho phép hủy khi đơn ở trạng thái `pending` hoặc (`approved` và chưa có người thay thế); nếu có Open Shift liên kết mà chưa ai nhận thì tự động hủy Open Shift; nếu Open Shift đã có người nhận hoặc đã có người thay thế thì chặn hủy; sau khi hủy khôi phục ca trực gốc cho nhân viên trong `schedules`, đổi trạng thái đơn sang `cancelled`, gửi thông báo cho Manager. | `leave_requests`, `open_shifts`, `schedules`, `notifications` |
| 31 | Tính toán chỉ số tập trung (Giờ làm, Chấm công, Bảng lương) | Hệ thống | Server tính toán tự động số giờ theo lịch, giờ thực tế, phụ cấp ca đêm/lễ, thưởng ca mở và tổng chi phí lương từ schedules, attendance và employees; FE chỉ hiển thị | `schedules`, `attendance`, `employees`, `payrolls` |

---

## TỔNG SỐ QUY TẮC BACKEND ĐÃ GHI NHẬN: 31 nhóm logic nghiệp vụ cốt lõi
Toàn bộ mã thực thi chi tiết của các quy tắc này được lưu trữ trong `docs/backend_reference.js`.

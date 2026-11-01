# ĐỐI CHIẾU USER STORY VỚI PHẦN MỀM HIỆN TẠI (US AUDIT)

> **Mục tiêu**: Bảng đối chiếu giữa Tài liệu User Story (v2.2) và Phần mềm hiện tại (chuẩn về luồng và giao diện).  
> **Nguyên tắc**: Dựa trên mã nguồn thực tế (JSX, Services, Constants, Routes), không đoán định, giữ nguyên code và tài liệu gốc trong pha này.

---

## 1. BẢNG ĐỐI CHIẾU CHI TIẾT (US01 – US31)

| US & Tên ngắn; Trang/Route | LUỒNG | GIAO DIỆN | QUYẾT ĐỊNH ĐỀ XUẤT |
| :--- | :--- | :--- | :--- |
| **US01: Đăng nhập tài khoản**<br>`/login` (`LoginPage.jsx`) | **LỆCH**: Tài liệu yêu cầu tài khoản dùng MK tạm phải bắt buộc đổi mật khẩu trước khi vào; app đăng nhập vào thẳng trang đích. | **LỆCH**: App có thêm trang Landing (`/`); nút Đăng xuất nằm ở chân Sidebar thay vì menu góc phải trên cùng. | Sửa tài liệu theo app |
| **US02: Đổi & đặt lại mật khẩu**<br>Staff: `/employees/profile`; Manager: `/manager/employees` | **LỆCH**: Tài liệu nói hệ thống tự sinh MK tạm 1 lần kèm nút sao chép; app cho Manager tự nhập mật khẩu khi tạo/sửa hồ sơ. | **LỆCH**: Tài liệu mô tả đổi MK ở menu góc phải thanh trên cùng; app đặt nút "Đổi mật khẩu" mở modal trong trang Hồ sơ cá nhân. | Sửa tài liệu theo app |
| **US03: Phân quyền RBAC**<br>Toàn hệ thống qua `ProtectedRoute.jsx` | **LỆCH**: Tài liệu yêu cầu hiển thị trang "403 - Không có quyền truy cập"; app tự động chuyển hướng về trang chủ theo vai trò. | **LỆCH**: App không có trang giao diện lỗi 403 riêng biệt. | Sửa tài liệu theo app |
| **US04: Tạo & sửa hồ sơ nhân viên**<br>`/manager/employees` (`EmployeeListPage.jsx`) | **KHỚP** | **LỆCH**: Tài liệu ghi cột bảng gồm Role_Tag và trạng thái "Nghỉ phép"; app hiển thị cột Vai trò, Tài khoản, Ngày sinh và nhãn "Tạm nghỉ". | Sửa tài liệu theo app |
| **US05: Quản lý & gán Role_Tag**<br>`/manager/employees` (`employeeShared.jsx`) | **LỆCH**: Tài liệu yêu cầu CRUD danh mục Role_Tag và gán nhiều tag dạng chip; app cố định 3 vai trò (Phục vụ, Pha chế, Thu ngân) dạng dropdown chọn 1. | **LỆCH**: Dùng ô chọn `<select>` 1 vai trò duy nhất thay vì các thẻ chip tag có nút "x" để chọn nhiều kỹ năng. | Cần hỏi tôi |
| **US06: Vô hiệu hóa tài khoản**<br>`/manager/employees` (`EmployeeListPage.jsx`) | **LỆCH**: Tài liệu yêu cầu liệt kê ca tương lai và tự đổi thành "Chưa có người"; app chỉ khóa tài khoản và chuyển trạng thái "Nghỉ việc". | **LỆCH**: Thao tác trong menu dòng là "Cho nghỉ việc" và "Khóa tài khoản" thay vì nút "Vô hiệu hóa", modal không liệt kê ca tương lai. | Sửa tài liệu theo app |
| **US07: Cập nhật hồ sơ cá nhân**<br>`/employees/profile` (`ProfilePage.jsx`) | **KHỚP** | **KHỚP** | Sửa tài liệu theo app |
| **US08: Đăng ký lịch rảnh tuần**<br>`/employees/availability` (`AvailabilityPage.jsx`) | **KHỚP** | **KHỚP** | Sửa tài liệu theo app |
| **US09: Xem khả năng làm việc**<br>`/manager/availability` (`AvailabilityPage.jsx`) | **KHỚP** | **KHỚP** | Sửa tài liệu theo app |
| **US10: Cấu hình ca & nhu cầu nhân sự**<br>`/manager/shift-config` & `/manager/schedule` | **KHỚP** | **LỆCH**: Tên menu là "Ca & ràng buộc" thay vì "Cấu hình ca làm việc"; ca làm việc gọi là "Ca mẫu" (Shift Templates). | Sửa tài liệu theo app |
| **US11: Xếp lịch tự động**<br>`/manager/schedule` (`SchedulePage.jsx`) | **KHỚP** | **LỆCH**: Menu và tiêu đề trang là "Tạo lịch tự động" (tab thuộc Lịch làm việc); hiển thị ma trận nhân sự kèm nút chạy OR-Tools. | Sửa tài liệu theo app |
| **US12: Xem, chỉnh sửa & công bố lịch**<br>`/manager/schedule/created` (`CreatedSchedulePage.jsx`) | **LỆCH**: Tài liệu mô tả kéo-thả và nút "+ Thêm ca tùy chỉnh"; app sửa nhân viên qua modal chọn danh sách, không có kéo-thả và không thêm ca ngoài ca mẫu. | **LỆCH**: Menu là "Lịch đã tạo" thay vì "Duyệt lịch"; nút duyệt là "Xác nhận & Áp dụng" trong modal; có thêm nút Xuất Excel. | Sửa tài liệu theo app |
| **US13: Xem lịch làm việc của tôi**<br>`/employees/schedule` (`MySchedulePage.jsx`) | **LỆCH**: Tài liệu nói bấm vào ca có nút "Yêu cầu đổi ca" và "Xin nghỉ"; app mở chi tiết có nút "Yêu cầu đổi ca" và "Đăng ký lịch rảnh", không có nút Xin nghỉ. | **KHỚP** | Sửa tài liệu theo app |
| **US14: Tổng hợp giờ làm việc**<br>Manager: `/manager/work-hours`; Staff: `/employees/attendance` | **LỆCH**: Tài liệu nói Staff có mục "Giờ làm của tôi" riêng; app tích hợp tổng giờ tháng vào trang Chấm công và tổng giờ tuần vào Lịch của tôi. | **LỆCH**: Manager xem tại tab "Giờ làm" (thuộc "Chấm công & Giờ làm") có xuất Excel; Staff không có trang bảng đối soát giờ riêng. | Sửa tài liệu theo app |
| **US15: Yêu cầu đổi ca**<br>`/employees/shift-exchange` (`ShiftExchangePage.jsx`) | **KHỚP** | **LỆCH**: Form tạo yêu cầu nằm trong modal thay vì hiển thị trên trang; có thêm 4 thẻ thống kê KPI và phím tắt chọn nhanh lý do. | Sửa tài liệu theo app |
| **US16: Phản hồi yêu cầu đổi ca**<br>`/employees/shift-exchange` (`ShiftExchangePage.jsx`) | **KHỚP** | **LỆCH**: Danh sách nằm ở tab "Yêu cầu đến" (received) thay vì tên "Yêu cầu gửi đến tôi"; nút từ chối mở modal nhập lý do. | Sửa tài liệu theo app |
| **US17: Duyệt yêu cầu đổi ca**<br>`/manager/shift-exchange` (`ShiftExchangePage.jsx`) | **KHỚP** | **LỆCH**: Menu hiển thị ngắn gọn là "Đổi ca" (thuộc nhóm "Lịch và ca"); chi tiết yêu cầu và từ chối hiển thị qua 2 modal riêng biệt. | Sửa tài liệu theo app |
| **US18: Tạo Open Shift**<br>`/manager/open-shifts` (`OpenShiftPage.jsx`) | **KHỚP** | **LỆCH**: Tên menu là "Ca trực mở"; nút là "Mở ca trực" thay vì "Tạo Open Shift"; không chia 2 tab mà dùng bộ lọc trạng thái và modal. | Sửa tài liệu theo app |
| **US19: Nhận Open Shift**<br>`/employees/open-shifts` (`OpenShiftPage.jsx`) | **KHỚP** | **LỆCH**: Menu hiển thị là "Ca trực mở"; danh sách chia 2 tab "Ca phù hợp" và "Ca đã nhận của tôi". | Sửa tài liệu theo app |
| **US20: Yêu cầu nghỉ đột xuất**<br>`/employees/leave` (`LeavePage.jsx`) | **KHỚP** | **LỆCH**: Tên menu là "Nghỉ phép" thay vì "Xin nghỉ"; nút bấm là "Tạo đơn xin nghỉ" mở modal tạo đơn thay vì nút "+ Yêu cầu nghỉ". | Sửa tài liệu theo app |
| **US21: Xử lý yêu cầu nghỉ**<br>`/manager/leave` (`LeavePage.jsx`) | **KHỚP** | **LỆCH**: Tên menu là "Đơn xin nghỉ" (thuộc nhóm "Nhân sự"); chi tiết đơn hiển thị dạng modal 2 cột tích hợp AI gợi ý thay thế. | Sửa tài liệu theo app |
| **US22: Gợi ý người thay thế bằng AI**<br>Tích hợp tại modal chi tiết `/manager/leave` | **KHỚP** | **KHỚP** | Sửa tài liệu theo app |
| **US23: Quy tắc hủy yêu cầu nghỉ**<br>`/employees/leave` (`LeavePage.jsx`) | **LỆCH**: Tài liệu cho phép hủy khi Approved (chưa có người thay); app chỉ cho phép hủy khi đơn ở trạng thái Pending (Chờ duyệt). | **LỆCH**: Nút "Hủy" hiển thị trực tiếp trên dòng bảng và modal; ẩn/disable nút khi không còn Pending thay vì hiển thị tooltip giải thích. | Cần hỏi tôi |
| **US24: Check-in và check-out ca làm việc**<br>`/employees/attendance` (`AttendancePage.jsx`) | **KHỚP** | **KHỚP** | Sửa tài liệu theo app |
| **US25: Đối soát chấm công với lịch**<br>`/manager/attendance` (`AttendancePage.jsx`) | **KHỚP** | **LỆCH**: Tên menu là "Chấm công" (tab thuộc "Chấm công & Giờ làm"); hỗ trợ chuyển đổi giữa xem Danh sách và xem Lưới (Grid). | Sửa tài liệu theo app |
| **US26: Điều chỉnh dữ liệu chấm công**<br>`/manager/attendance` (`AttendanceModals.jsx`) | **KHỚP** | **KHỚP** | Sửa tài liệu theo app |
| **US27: Tính lương tự động**<br>`/manager/payroll` (`PayrollPage.jsx`) | **KHỚP** | **LỆCH**: Nút xuất dữ liệu là "Xuất Excel" thay vì "Xuất báo cáo PDF"; hiển thị 5 thẻ KPI và modal chi tiết từng ca. | Sửa tài liệu theo app |
| **US28: Dashboard quản lý**<br>`/manager/dashboard` (`DashboardPage.jsx`) | **KHỚP** | **LỆCH**: Tên menu là "Tổng quan" thay vì "Dashboard"; có thêm khối tích hợp hỏi nhanh Trợ lý AI (AssistantPanel) và nút Xuất Excel. | Sửa tài liệu theo app |
| **US29: Xuất báo cáo PDF**<br>`/manager/reports` & các trang Manager | **LỆCH**: Tài liệu yêu cầu xuất báo cáo định dạng PDF (kèm Excel); app hiện tại chỉ hỗ trợ xuất file Excel (.xlsx), chưa có tính năng xuất PDF. | **LỆCH**: App có trang riêng "Báo cáo" (`/manager/reports`) trong menu "Tài chính" với biểu đồ xem trước và tải Excel cho 5 phân hệ. | Sửa tài liệu theo app |
| **US30: Trung tâm thông báo trong ứng dụng**<br>Thanh Header (`NoticeKit.jsx`) | **LỆCH**: Tài liệu mô tả có trang Thông báo phân trang, tab Tất cả/Chưa đọc; app chỉ có popup chuông dropdown (hiển thị tối đa 15 mục). | **LỆCH**: Không có trang `/notifications` riêng biệt và không có liên kết "Xem tất cả". | Sửa tài liệu theo app |
| **US31: Trợ lý AI hội thoại**<br>`/manager/assistant` (`AssistantPage.jsx`) | **KHỚP** | **LỆCH**: Tên menu là "Trợ lý AI" (thuộc "Công cụ"); có sidebar lưu lịch sử 30 hội thoại, câu hỏi gợi ý dạng chip và khung mini chat ở Dashboard. | Sửa tài liệu theo app |

---

## 2. CHỨC NĂNG CÓ TRONG APP NHƯNG KHÔNG CÓ TRONG USER STORY
- **Trang Giới thiệu / Landing Page (`/` - `LandingPage.jsx`)**: Trang chủ giới thiệu sản phẩm công khai với đầy đủ showcase tính năng, bảng giá, FAQ, nút chuyển hướng Đăng nhập.
- **Giải trình chấm công (Attendance Explanations)**: Staff có thể gửi đơn giải trình khi quên check-in/check-out hoặc đi trễ/về sớm; Manager có tab "Giải trình" riêng tại trang Chấm công (`/manager/attendance`) để phê duyệt/từ chối giải trình.
- **Sao chép lịch rảnh tuần trước**: Trong màn hình Đăng ký lịch rảnh Staff (`/employees/availability`), có tính năng sao chép toàn bộ lựa chọn rảnh/bận của tuần liền trước.
- **Màn hình Trung tâm Báo cáo riêng (`/manager/reports` - `ReportPage.jsx`)**: Trang chuyên biệt tổng hợp biểu đồ phân tích và xuất dữ liệu Excel cho cả 5 phân hệ (Lịch làm việc, Giờ làm, Chấm công, Bảng lương, Dashboard).
- **Trợ lý AI mini nhúng tại Dashboard (`AssistantPanel.jsx`)**: Cho phép Manager đặt câu hỏi nhanh cho AI và nhận câu trả lời ngay trên Dashboard mà không cần điều hướng sang trang Trợ lý AI.

---

## 3. CHỨC NĂNG CÓ TRONG USER STORY NHƯNG APP CHƯA CÓ HOẶC MỚI LÀM GIẢ (HARD-CODE)
- **Quản lý danh mục Role_Tag động (US05)**: Tài liệu yêu cầu Manager thêm, đổi tên, xóa Role_Tag và gán nhiều tag dạng thẻ chip cho nhân viên; app hiện hard-code danh mục 3 vai trò (Phục vụ, Pha chế, Thu ngân) và mỗi nhân viên chỉ chọn 1 vai trò duy nhất qua dropdown.
- **Kéo-thả lịch làm việc & Thêm ca tùy chỉnh (US12)**: Tài liệu yêu cầu kéo-thả nhân viên giữa các ca/ngày trên lịch và nút "+ Thêm ca tùy chỉnh"; app sửa phân công qua modal danh sách và chỉ dùng các ca mẫu đã cấu hình.
- **Sinh mật khẩu tạm tự động 1 lần & Ép đổi mật khẩu lần đầu (US01, US02)**: Tài liệu yêu cầu sinh MK tạm ngẫu nhiên có nút sao chép và ép đổi mật khẩu ở lần đăng nhập đầu; app cho Manager nhập tay mật khẩu và không ép đổi mật khẩu khi đăng nhập.
- **Xuất báo cáo định dạng PDF (US29)**: Tài liệu yêu cầu xuất PDF có tiêu đề, phân trang; app hiện chỉ hỗ trợ xuất file Excel (.xlsx).
- **Trang Trung tâm thông báo riêng biệt (`/notifications`) (US30)**: Tài liệu yêu cầu trang xem tất cả thông báo có tab Tất cả/Chưa đọc, phân trang và nút "Đánh dấu tất cả đã đọc"; app hiện chỉ có popup chuông dropdown.

---

## 4. BẢNG ĐỐI CHIẾU THUẬT NGỮ (TÀI LIỆU VIẾT → APP DÙNG)

| STT | Tài liệu viết | App dùng (Thực tế giao diện & Code) | Ghi chú vị trí / Ngữ cảnh |
| :---: | :--- | :--- | :--- |
| 1 | Quản lý / Manager | **Quản lý** (`ROLES.MANAGER`, code: `manager`) | Header, Sidebar, Auth |
| 2 | Nhân viên / Staff | **Nhân viên** (`ROLES.STAFF`, code: `employee` / `staff`) | Header, Sidebar, Auth |
| 3 | Role_Tag (kỹ năng) | **Vai trò** (Phục vụ, Pha chế, Thu ngân) | Form nhân viên, bộ lọc, bảng |
| 4 | Hợp đồng Full-time / Part-time | **Toàn thời gian / Bán thời gian** | Form hồ sơ, bảng nhân viên |
| 5 | Trạng thái "Nghỉ phép" (On-Leave) | **Tạm nghỉ** | Tab trạng thái `/manager/employees` |
| 6 | Trạng thái "Nghỉ việc" (Deactivated) | **Nghỉ việc** (nút thao tác: "Cho nghỉ việc", "Khóa tài khoản") | Menu thao tác `/manager/employees` |
| 7 | Cấu hình ca làm việc & nhu cầu nhân sự | **Ca & ràng buộc** (`/manager/shift-config`), ca gọi là **Ca mẫu** | Menu Lịch và ca |
| 8 | Xếp lịch tự động | **Tạo lịch tự động** (`/manager/schedule`) | Tab thuộc nhóm Lịch làm việc |
| 9 | Duyệt lịch / Lịch Official | **Lịch đã tạo** (`/manager/schedule/created`), nút duyệt: **Xác nhận & Áp dụng** | Tab thuộc nhóm Lịch làm việc |
| 10 | Trạng thái lịch Draft / Official | **Lịch nháp** / **Lịch đã áp dụng** (`isConfirmed`) | Lịch làm việc |
| 11 | Open Shift / Shift Bidding | **Ca trực mở** (`/manager/open-shifts`, `/employees/open-shifts`) | Menu Lịch và ca |
| 12 | Tạo Open Shift | **Mở ca trực** | Nút bấm trên `/manager/open-shifts` |
| 13 | Nhận Open Shift (Claim) | **Nhận ca** | Nút bấm trên `/employees/open-shifts` |
| 14 | Yêu cầu đổi ca | **Đổi ca** (`/manager/shift-exchange`, `/employees/shift-exchange`) | Menu Lịch và ca |
| 15 | Yêu cầu nghỉ đột xuất / Xin nghỉ | Manager: **Đơn xin nghỉ** (`/manager/leave`); Staff: **Nghỉ phép** (`/employees/leave`) | Menu Nhân sự |
| 16 | Nút "+ Yêu cầu nghỉ" | **Tạo đơn xin nghỉ** | Nút bấm mở modal tạo đơn |
| 17 | Đối soát chấm công | **Chấm công** (`/manager/attendance`) | Tab thuộc Chấm công & Giờ làm |
| 18 | Tổng hợp giờ làm việc | **Giờ làm** (`/manager/work-hours`) | Tab thuộc Chấm công & Giờ làm |
| 19 | Dashboard quản lý | **Tổng quan** (`/manager/dashboard`) | Menu Chính |
| 20 | Trợ lý AI hội thoại | **Trợ lý AI** (`/manager/assistant`) | Menu Công cụ |
| 21 | Xuất PDF | **Xuất Excel** | Nút thao tác trên các trang |
| 22 | Ca Sáng / Chiều / Tối | **Ca Sáng** (06:00-14:00), **Ca Chiều** (14:00-22:00), **Ca Tối** (22:00-06:00) | Cấu hình ca mẫu |

---

## 5. RỦI RO NGHIỆP VỤ
1. **Ràng buộc vai trò đơn nhất**: App đang gán cứng 1 vai trò duy nhất (Phục vụ/Pha chế/Thu ngân) cho nhân viên thay vì mô hình đa Role_Tag, gây hạn chế cho Scheduling Engine khi xếp ca cho nhân sự kiêm nhiệm.
2. **Ca trống sau khi nhân viên nghỉ việc**: Thao tác "Cho nghỉ việc" không tự động đánh dấu các ca tương lai của nhân viên thành "Chưa có người" hoặc cảnh báo tạo Open Shift, có nguy cơ thiếu hụt nhân sự trên lịch đã công bố.
3. **Khóa quyền hủy đơn xin nghỉ**: Staff không thể hủy đơn xin nghỉ khi đơn đã ở trạng thái Approved (dù chưa có người thay thế), làm giảm tính linh hoạt nếu nhân viên giải quyết được việc riêng.
4. **Bảo mật mật khẩu ban đầu**: Chưa có cơ chế ép đổi mật khẩu tạm ở lần đăng nhập đầu tiên và mật khẩu do Manager tự nhập tay thay vì hệ thống sinh ngẫu nhiên 1 lần.
5. **Giới hạn lưu trữ thông báo**: Thiếu trang trung tâm thông báo (`/notifications`) khiến người dùng chỉ theo dõi được 15 thông báo gần nhất trên popup chuông mà không tra cứu lại được lịch sử cũ.

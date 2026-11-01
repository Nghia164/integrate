# DANH SÁCH TEST BỊ ẢNH HƯỞNG KHI CHUYỂN SANG FRONTEND-ONLY (TESTS_TODO)

> **Ghi chú**: Theo yêu cầu, giai đoạn này **CHƯA SỬA HOẶC CHẠY TEST**. Toàn bộ danh sách kiểm thử bị ảnh hưởng do việc xóa engine `db.js`, `localStorage` SSOT và đồng bộ chéo giữa Manager/Staff được liệt kê dưới đây để cập nhật khi Backend API hoàn tất.

---

## 1. Nhóm Unit / Mock Tests (`tests/mock-only/`)

Các bài test này phụ thuộc trực tiếp vào `src/mocks/db.js`, `src/mocks/initialData.js` và logic đồng bộ nội bộ của mock:

| Tên file test | Nguyên nhân ảnh hưởng | Hướng xử lý sau khi có Backend |
| :--- | :--- | :--- |
| `test_attendance_upcoming_rules.js` | Import trực tiếp `db.js`, kiểm tra hàm tính tỷ lệ vắng và ca `Upcoming/In-Progress` | Chuyển thành API integration test gọi endpoint `/api/attendance` |
| `test_auth_migration.js` | Kiểm tra migration dữ liệu tài khoản và `users` trong `db.js` | Kiểm tra trực tiếp qua DB Seeder của Laravel |
| `test_auto_schedule_availability.js` | Kiểm tra giải thuật xếp lịch theo lịch rảnh trong `db.js` | Kiểm tra service OR-Tools tại Backend |
| `test_cross_consistency.js` | Kiểm tra khớp số liệu 100% giữa Dashboard, Giờ làm, Chấm công và Bảng lương qua `db.js` | Kiểm tra qua Backend Reports Service |
| `test_data_consistency.js` | Kiểm tra tính nhất quán dữ liệu trong `db.js` | Kiểm tra ràng buộc khóa ngoại (Foreign Keys) trong MySQL |
| `test_giai_doan_2b.js` | Kiểm tra toàn bộ luồng nghiệp vụ giai đoạn 2B trên `db.js` | Chuyển thành Feature Test của Laravel |
| `test_initial_data_rules.js` | Kiểm tra hạt giống `initialData.js` | Chuyển sang kiểm thử DatabaseSeeder PHP |
| `test_k5_shift_exchange.js` | Kiểm tra luồng đổi ca 2 bước và hoán đổi ca trong `db.js` | Chuyển sang API test `/api/shift-exchanges/*` |
| `test_k6_open_shift_bonus.js` | Kiểm tra ca mở, tiền thưởng và đồng bộ bảng lương trong `db.js` | Chuyển sang API test `/api/open-shifts/*` |
| `test_k7_leave_attendance.js` | Kiểm tra duyệt đơn nghỉ phép đồng bộ sang ca làm và chấm công trong `db.js` | Chuyển sang API test `/api/leaves/*` |
| `test_payroll_lock_snapshot.js` | Kiểm tra chốt lương và lưu snapshot bất biến trong `db.js` | Chuyển sang API test `/api/payroll/lock` |
| `test_phase1b.js` | Kiểm tra các quy tắc nghiệp vụ Phase 1B | Chuyển sang Feature Test Laravel |
| `test_phase_c1_flow1.js` | Kiểm tra luồng C1 luồng 1 (Tạo và công bố lịch) | Chuyển sang API test `/api/schedules/publish` |
| `test_phase_c1_flows_all.js` | Kiểm tra toàn bộ 6 luồng đồng bộ thực tế qua `db.js` | Chuyển thành End-to-End API Test Suite |
| `test_resigned_employees_filter.js` | Kiểm tra loại trừ nhân viên 'Nghỉ việc' khỏi danh sách rảnh, đổi ca, ca mở | Kiểm tra Scope query (`whereNot('status', 'Nghỉ việc')`) |
| `test_seed_version.js` | Kiểm tra `SEED_VERSION` và `DATA_VERSION` của `db.js` | Không còn dùng, xóa khi có Backend |
| `test_staff_auth_switch.js` | Kiểm tra chuyển vai tài khoản nhân viên | Kiểm tra phiên đăng nhập bằng Bearer token |
| `test_staff_manager_sync.js` | Kiểm tra đồng bộ chéo giữa Manager và Staff qua `db.js` | Chuyển sang kiểm thử tích hợp qua Database chung |
| `test_us09_availability.js` | Kiểm tra kiểm tra hạn chót và version của lịch rảnh | Chuyển sang API test `/api/availabilities` |

---

## 2. Nhóm Contract Tests (`tests/contract/`)

| Tên file test | Nguyên nhân ảnh hưởng | Hướng xử lý sau khi có Backend |
| :--- | :--- | :--- |
| `test_auth_contract.js` | Kiểm tra hợp đồng giữa mockAdapter và httpAdapter | Giữ lại, dùng để đối chiếu khi kết nối API thật |

---

## 3. Nhóm E2E Tests (`tests/e2e/`)

| Tên file test | Nguyên nhân ảnh hưởng | Hướng xử lý sau khi có Backend |
| :--- | :--- | :--- |
| `test_write_cross_screen.js` | Thực hiện thao tác ở màn hình Staff và xác minh dữ liệu đổi ngay ở Manager | Chạy khi Backend API đã chạy và đồng bộ qua DB |
| `test_seven_scenarios.js` | Chạy 7 kịch bản nghiệp vụ liên hoàn | Chạy lại sau khi nối API |
| `run_all_e2e.js` | Runner tổng hợp | Chạy lại sau khi nối API |

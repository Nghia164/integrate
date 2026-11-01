# Smart Scheduling - Hệ Thống Xếp Lịch & Quản Lý Ca Làm Việc Thông Minh

Hệ thống quản lý ca kíp, chấm công GPS, bảng lương và xếp lịch tự động cho chuỗi cửa hàng dịch vụ/bán lẻ, đồng bộ giao diện và dữ liệu giữa Quản lý (Manager) và Nhân viên (Staff).

## Cài đặt & Vận hành
- **Cài đặt thư viện**: `npm install`
- **Chạy môi trường phát triển**: `npm run dev` (mặc định tại `http://localhost:5173`)
- **Kiểm tra cú pháp (Lint)**: `npm run lint`
- **Đóng gói ứng dụng (Build)**: `npm run build`
- **Chạy kiểm thử tự động (Unit Test)**: `npm test` (chạy 118 tests chuẩn hóa SSOT & validator)

## Cấu trúc thư mục (`src/`)
- `pages/manager/`: Màn hình chức năng của Quản lý (bảng điều khiển, ca làm, xếp lịch, nhân viên, chấm công, tính lương...).
- `pages/employees/`: Màn hình chức năng của Nhân viên (lịch của tôi, đăng ký rảnh/bận, đổi ca, ca mở, nghỉ phép, chấm công...).
- `pages/login/`: Màn hình đăng nhập xác thực tài khoản và đổi mật khẩu tạm thời.
- `services/`: Tầng giao tiếp dữ liệu (hiện gọi mock, sẵn sàng chuyển hướng sang Backend REST API).
- `mocks/`: Nguồn dữ liệu mẫu chuẩn (SSOT) phục vụ demo và kiểm thử frontend *(sẽ được xóa/thay thế khi nối Backend API)*.
- `components/`: Thư viện thành phần dùng chung (AppShell, Button, DataTable, Modal, StatusBadge, StatStrip...).
- `lib/`: Các hàm tiện ích dùng chung (dateUtils, formatters, validators, usePagination...).

## Tài khoản Demo & Cờ URL thử nghiệm
- **Quản lý**: `manager@coffee.com` | Mật khẩu: `12345678`
- **Nhân viên**: `an.nguyen@coffee.com` | Mật khẩu: `12345678`
- **Cờ thời gian demo**: `?now=2026-10-31T11:50` (mô phỏng mốc thời gian hệ thống để thử ca trực và chấm công).
- **Cờ GPS demo**: `?gps=store` (mô phỏng tọa độ hợp lệ tại cửa hàng để thực hiện check-in/check-out GPS).

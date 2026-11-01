-- =============================================================================
-- SMART SCHEDULING - DATABASE SCHEMA (MySQL 8.0+ / MariaDB 10.4+)
-- Phiên bản: 2.0 (Kiến trúc chuẩn hóa Tách Tài Khoản users & Nhân Sự employees)
-- Đồ án: C1SE_57 - Hệ thống Xếp lịch và Quản lý Ca trực Thông minh
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `smart_scheduling`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `smart_scheduling`;

-- -----------------------------------------------------------------------------
-- 1. BẢNG: users (Tài khoản người dùng & Xác thực hệ thống)
-- Quy tắc:
-- 1. Manager CHỈ nằm trong bảng users, KHÔNG có hồ sơ trong employees.
-- 2. Staff có tài khoản trong users và liên kết 1-1 với hồ sơ trong employees.
-- 3. Mật khẩu lưu chuỗi hash sinh từ password_hash($pass, PASSWORD_BCRYPT/ARGON2ID).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL COMMENT 'Định danh tài khoản duy nhất (UUID hoặc Mã USR-xxx)',
  `email` VARCHAR(191) NOT NULL COMMENT 'Email đăng nhập duy nhất do Quản lý cấp',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Mật khẩu băm an toàn',
  `role` ENUM('manager', 'staff') NOT NULL DEFAULT 'staff' COMMENT 'Vai trò hệ thống: manager hoặc staff',
  `status` ENUM('active', 'inactive', 'locked') NOT NULL DEFAULT 'active' COMMENT 'Trạng thái tài khoản',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo tài khoản',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tài khoản xác thực hệ thống';

-- -----------------------------------------------------------------------------
-- 2. BẢNG: employees (Hồ sơ nhân sự làm việc theo ca)
-- Lưu ý: Không lưu mật khẩu ở bảng này; mật khẩu quản lý tập trung ở bảng users.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employees` (
  `id` VARCHAR(32) NOT NULL COMMENT 'Mã định danh nhân viên (VD: NV001, NV002)',
  `user_id` VARCHAR(36) DEFAULT NULL COMMENT 'Khóa ngoại liên kết tài khoản bảng users',
  `name` VARCHAR(128) NOT NULL COMMENT 'Họ và tên nhân viên',
  `email` VARCHAR(191) NOT NULL COMMENT 'Email liên hệ / đăng nhập',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT 'Số điện thoại liên hệ',
  `birth_date` DATE DEFAULT NULL COMMENT 'Ngày sinh',
  `role` VARCHAR(64) NOT NULL DEFAULT 'Phục vụ' COMMENT 'Chức danh vị trí: Phục vụ, Pha chế, Thu ngân',
  `role_tag` VARCHAR(32) NOT NULL DEFAULT 'Waiter' COMMENT 'Tag phân ca hệ thống: Shift_Leader, Barista, Cashier, Waiter',
  `contract` ENUM('Toàn thời gian', 'Bán thời gian') NOT NULL DEFAULT 'Bán thời gian' COMMENT 'Hình thức hợp đồng',
  `status` ENUM('Đang làm việc', 'Nghỉ phép', 'Nghỉ việc') NOT NULL DEFAULT 'Đang làm việc' COMMENT 'Trạng thái làm việc',
  `hourly_wage` DECIMAL(12, 2) NOT NULL DEFAULT 28000.00 COMMENT 'Mức lương cơ bản theo giờ (VNĐ)',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh đại diện',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo hồ sơ',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employees_email` (`email`),
  KEY `fk_employees_user` (`user_id`),
  INDEX `idx_employees_status` (`status`),
  INDEX `idx_employees_role_tag` (`role_tag`),
  CONSTRAINT `fk_employees_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hồ sơ nhân sự làm việc';

-- -----------------------------------------------------------------------------
-- 2b. BẢNG: employee_roles (Liên kết nhiều vai trò / Role_Tag cho nhân viên - US05)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_roles` (
  `employee_id` VARCHAR(32) NOT NULL COMMENT 'Mã nhân viên',
  `role_tag` VARCHAR(64) NOT NULL COMMENT 'Tên Role_Tag: Phục vụ, Pha chế, Thu ngân',
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Đánh dấu vai trò chính',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`employee_id`, `role_tag`),
  INDEX `idx_employee_roles_tag` (`role_tag`),
  CONSTRAINT `fk_employee_roles_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh sách vai trò đảm nhiệm của nhân viên';

-- -----------------------------------------------------------------------------
-- 3. BẢNG: availabilities (Đăng ký lịch rảnh / bận hằng tuần - US08 / US09)
-- Hỗ trợ Optimistic Locking qua trường `version`, lưu vết kiểm toán qua `logs`.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `availabilities` (
  `id` VARCHAR(64) NOT NULL COMMENT 'Khóa chính bản ghi đăng ký (VD: AVL-NV001-2026-11-02)',
  `type` VARCHAR(32) NOT NULL DEFAULT 'availability' COMMENT 'Loại bản ghi yêu cầu',
  `employee_id` VARCHAR(32) NOT NULL COMMENT 'Mã nhân viên được áp dụng',
  `week_monday` DATE NOT NULL COMMENT 'Ngày Thứ 2 đầu tuần áp dụng (YYYY-MM-DD)',
  `slots` JSON NOT NULL COMMENT 'Dữ liệu các ô ca rảnh/bận dạng JSON: {"0_Sáng": "available", "0_Chiều": "busy"}',
  `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'SUBMITTED' COMMENT 'Trạng thái bản ghi',
  `version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Phiên bản bản ghi cho Optimistic Locking chống ghi đè đồng thời',
  `created_by_user_id` VARCHAR(36) NOT NULL COMMENT 'ID tài khoản tạo yêu cầu',
  `handled_by_user_id` VARCHAR(36) DEFAULT NULL COMMENT 'ID Quản lý xử lý (nếu có)',
  `reject_reason` TEXT DEFAULT NULL COMMENT 'Lý do từ chối (nếu có)',
  `logs` JSON DEFAULT NULL COMMENT 'Nhật ký chuyển trạng thái và thay đổi [{ status, at, by, reason }]',
  `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm nộp đăng ký',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm khởi tạo',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_week` (`employee_id`, `week_monday`),
  INDEX `idx_availabilities_week` (`week_monday`),
  INDEX `idx_availabilities_status` (`status`),
  CONSTRAINT `fk_availabilities_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đăng ký lịch rảnh bận tuần của nhân viên';

-- -----------------------------------------------------------------------------
-- 4. BẢNG: notifications (Thông báo trong ứng dụng - In-App Notifications)
-- Lưu theo recipient_user_id trỏ về users.id.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(64) NOT NULL COMMENT 'Định danh thông báo (VD: NOTIF-1729...)',
  `recipient_user_id` VARCHAR(36) NOT NULL COMMENT 'Tài khoản người nhận thông báo (trỏ về users.id)',
  `title` VARCHAR(255) NOT NULL COMMENT 'Tiêu đề thông báo',
  `message` TEXT NOT NULL COMMENT 'Nội dung chi tiết thông báo',
  `type` VARCHAR(64) NOT NULL DEFAULT 'general' COMMENT 'Phân loại: availability_submitted, leave_approved, exchange_request...',
  `link` VARCHAR(255) DEFAULT NULL COMMENT 'Liên kết điều hướng khi nhấn vào thông báo',
  `related_id` VARCHAR(64) DEFAULT NULL COMMENT 'Mã bản ghi liên quan (mã đơn nghỉ, ca trực, lịch rảnh...)',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Trạng thái đã đọc (true/false)',
  `read_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Thời điểm người dùng đọc thông báo',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm phát thông báo',

  PRIMARY KEY (`id`),
  INDEX `idx_notifications_recipient` (`recipient_user_id`),
  INDEX `idx_notifications_unread` (`recipient_user_id`, `is_read`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hộp thông báo cá nhân của người dùng';

-- -----------------------------------------------------------------------------
-- 5. DỮ LIỆU SEED MẪU BAN ĐẦU
-- Mật khẩu mẫu: 12345678 (Bcrypt hash: $2y$10$w8W7fHlVv4m43kU8qjIuI.Yl8M8t3N6eB1sO5i.y7mXz7R0n4q5W6)
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `status`) VALUES
  ('USR-MGR-001', 'quanly@smartscheduling.vn', '$2y$10$w8W7fHlVv4m43kU8qjIuI.Yl8M8t3N6eB1sO5i.y7mXz7R0n4q5W6', 'manager', 'active'),
  ('USR-STF-001', 'nguyenvanan@gmail.com',     '$2y$10$w8W7fHlVv4m43kU8qjIuI.Yl8M8t3N6eB1sO5i.y7mXz7R0n4q5W6', 'staff',   'active'),
  ('USR-STF-002', 'tranthibich@gmail.com',    '$2y$10$w8W7fHlVv4m43kU8qjIuI.Yl8M8t3N6eB1sO5i.y7mXz7R0n4q5W6', 'staff',   'active'),
  ('USR-STF-003', 'leminhcuong@gmail.com',    '$2y$10$w8W7fHlVv4m43kU8qjIuI.Yl8M8t3N6eB1sO5i.y7mXz7R0n4q5W6', 'staff',   'active'),
  ('USR-STF-004', 'phamthidung@gmail.com',    '$2y$10$w8W7fHlVv4m43kU8qjIuI.Yl8M8t3N6eB1sO5i.y7mXz7R0n4q5W6', 'staff',   'active'),
  ('USR-STF-005', 'hoangvannam@gmail.com',    '$2y$10$w8W7fHlVv4m43kU8qjIuI.Yl8M8t3N6eB1sO5i.y7mXz7R0n4q5W6', 'staff',   'active'),
  ('USR-STF-006', 'dokimngan@gmail.com',      '$2y$10$w8W7fHlVv4m43kU8qjIuI.Yl8M8t3N6eB1sO5i.y7mXz7R0n4q5W6', 'staff',   'inactive'),
  ('USR-STF-007', 'vuminhthao@gmail.com',     '$2y$10$w8W7fHlVv4m43kU8qjIuI.Yl8M8t3N6eB1sO5i.y7mXz7R0n4q5W6', 'staff',   'active'),
  ('USR-STF-008', 'danghoangyen@gmail.com',   '$2y$10$w8W7fHlVv4m43kU8qjIuI.Yl8M8t3N6eB1sO5i.y7mXz7R0n4q5W6', 'staff',   'active')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

INSERT INTO `employees`
  (`id`, `user_id`, `name`, `email`, `phone`, `birth_date`, `role`, `role_tag`, `contract`, `status`, `hourly_wage`)
VALUES
  ('NV001', 'USR-STF-001', 'Nguyễn Văn An', 'nguyenvanan@gmail.com', '0905123456', '2002-05-12', 'Phục vụ', 'Shift_Leader', 'Toàn thời gian', 'Đang làm việc', 35000.00),
  ('NV002', 'USR-STF-002', 'Trần Thị Bích', 'tranthibich@gmail.com', '0905123457', '2001-08-20', 'Pha chế', 'Barista',      'Toàn thời gian', 'Đang làm việc', 30000.00),
  ('NV003', 'USR-STF-003', 'Lê Minh Cường', 'leminhcuong@gmail.com', '0905123458', '2003-01-15', 'Thu ngân', 'Cashier',      'Bán thời gian',  'Đang làm việc', 28000.00),
  ('NV004', 'USR-STF-004', 'Phạm Thị Dung', 'phamthidung@gmail.com', '0905123459', '2002-11-03', 'Pha chế', 'Barista',      'Bán thời gian',  'Nghỉ phép',     30000.00),
  ('NV005', 'USR-STF-005', 'Hoàng Văn Nam', 'hoangvannam@gmail.com', '0905123460', '2001-06-25', 'Thu ngân', 'Cashier',      'Bán thời gian',  'Đang làm việc', 28000.00),
  ('NV006', 'USR-STF-006', 'Đỗ Kim Ngân',   'dokimngan@gmail.com',   '0905123461', '2000-03-10', 'Phục vụ', 'Waiter',       'Bán thời gian',  'Nghỉ việc',     25000.00),
  ('NV007', 'USR-STF-007', 'Vũ Minh Thảo',  'vuminhthao@gmail.com',  '0905123462', '2003-04-18', 'Pha chế', 'Barista',      'Bán thời gian',  'Đang làm việc', 30000.00),
  ('NV008', 'USR-STF-008', 'Đặng Hoàng Yến', 'danghoangyen@gmail.com', '0905123463', '2002-09-22', 'Phục vụ', 'Waiter',       'Bán thời gian',  'Đang làm việc', 28000.00)
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

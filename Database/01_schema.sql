-- ============================================================
-- SMART SCHEDULING - MICROSOFT SQL SERVER DATABASE
-- Scope: Single F&B Store
-- Core Backend: Laravel REST API
-- Database: Microsoft SQL Server
-- ============================================================

IF DB_ID(N'SmartScheduling') IS NULL
BEGIN
    CREATE DATABASE SmartScheduling;
END;
GO

USE SmartScheduling;
GO

-- ============================================================
-- 1. STORE PROFILE (single-store singleton)
-- ============================================================
IF OBJECT_ID('dbo.store_profile', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.store_profile (
        id TINYINT NOT NULL CONSTRAINT PK_store_profile PRIMARY KEY
            CONSTRAINT CK_store_profile_singleton CHECK (id = 1),
        store_name NVARCHAR(150) NOT NULL,
        address NVARCHAR(500) NULL,
        latitude DECIMAL(10,7) NULL,
        longitude DECIMAL(10,7) NULL,
        geofence_radius_m INT NOT NULL CONSTRAINT DF_store_geofence DEFAULT (100)
            CONSTRAINT CK_store_geofence CHECK (geofence_radius_m > 0),
        max_gps_accuracy_m INT NOT NULL CONSTRAINT DF_store_gps_accuracy DEFAULT (50)
            CONSTRAINT CK_store_gps_accuracy CHECK (max_gps_accuracy_m > 0),
        phone NVARCHAR(30) NULL,
        email NVARCHAR(255) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_store_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_store_updated DEFAULT (SYSUTCDATETIME())
    );
END;
GO

-- ============================================================
-- 2. USERS / AUTHENTICATION
-- ============================================================
IF OBJECT_ID('dbo.users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_users PRIMARY KEY,
        username NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) NOT NULL
            CONSTRAINT CK_users_role CHECK (role IN ('ADMIN','MANAGER','STAFF')),
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_users_status DEFAULT ('ACTIVE')
            CONSTRAINT CK_users_status CHECK (status IN ('ACTIVE','INACTIVE','LOCKED')),
        last_login_at DATETIME2(0) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_users_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_users_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_users_username UNIQUE (username),
        CONSTRAINT UQ_users_email UNIQUE (email)
    );
END;
GO

IF OBJECT_ID('dbo.refresh_tokens', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.refresh_tokens (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_refresh_tokens PRIMARY KEY,
        user_id BIGINT NOT NULL,
        token_hash NVARCHAR(255) NOT NULL,
        expires_at DATETIME2(0) NOT NULL,
        revoked_at DATETIME2(0) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_refresh_created DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_refresh_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT UQ_refresh_token_hash UNIQUE (token_hash)
    );
END;
GO

-- ============================================================
-- 3. EMPLOYEE / POSITION / SKILL / CONTRACT
-- ============================================================
IF OBJECT_ID('dbo.employees', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.employees (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_employees PRIMARY KEY,
        user_id BIGINT NULL,
        employee_code NVARCHAR(30) NOT NULL,
        full_name NVARCHAR(150) NOT NULL,
        phone NVARCHAR(30) NULL,
        address NVARCHAR(500) NULL,
        date_of_birth DATE NULL,
        hire_date DATE NULL,
        employment_type NVARCHAR(20) NOT NULL
            CONSTRAINT CK_employee_type CHECK (employment_type IN ('FULL_TIME','PART_TIME')),
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_employee_status DEFAULT ('ACTIVE')
            CONSTRAINT CK_employee_status CHECK (status IN ('ACTIVE','INACTIVE')),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_employee_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_employee_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_employee_code UNIQUE (employee_code),
        CONSTRAINT UQ_employee_user UNIQUE (user_id),
        CONSTRAINT FK_employee_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );
END;
GO

IF OBJECT_ID('dbo.positions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.positions (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_positions PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NULL,
        is_active BIT NOT NULL CONSTRAINT DF_position_active DEFAULT (1),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_position_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_position_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_position_name UNIQUE (name)
    );
END;
GO

IF OBJECT_ID('dbo.employee_positions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.employee_positions (
        employee_id BIGINT NOT NULL,
        position_id BIGINT NOT NULL,
        is_primary BIT NOT NULL CONSTRAINT DF_employee_position_primary DEFAULT (0),
        assigned_at DATETIME2(0) NOT NULL CONSTRAINT DF_employee_position_assigned DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_employee_positions PRIMARY KEY (employee_id, position_id),
        CONSTRAINT FK_employee_positions_employee FOREIGN KEY (employee_id) REFERENCES dbo.employees(id),
        CONSTRAINT FK_employee_positions_position FOREIGN KEY (position_id) REFERENCES dbo.positions(id)
    );
END;
GO

IF OBJECT_ID('dbo.skills', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.skills (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_skills PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NULL,
        is_active BIT NOT NULL CONSTRAINT DF_skill_active DEFAULT (1),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_skill_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_skill_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_skill_name UNIQUE (name)
    );
END;
GO

IF OBJECT_ID('dbo.employee_skills', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.employee_skills (
        employee_id BIGINT NOT NULL,
        skill_id BIGINT NOT NULL,
        skill_level TINYINT NOT NULL
            CONSTRAINT CK_employee_skill_level CHECK (skill_level BETWEEN 1 AND 5),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_employee_skill_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_employee_skills PRIMARY KEY (employee_id, skill_id),
        CONSTRAINT FK_employee_skills_employee FOREIGN KEY (employee_id) REFERENCES dbo.employees(id),
        CONSTRAINT FK_employee_skills_skill FOREIGN KEY (skill_id) REFERENCES dbo.skills(id)
    );
END;
GO

IF OBJECT_ID('dbo.employment_contracts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.employment_contracts (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_employment_contracts PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NULL,
        max_hours_per_day DECIMAL(5,2) NULL,
        max_hours_per_week DECIMAL(5,2) NULL,
        min_rest_hours DECIMAL(5,2) NOT NULL CONSTRAINT DF_contract_min_rest DEFAULT (8),
        max_consecutive_shifts INT NULL,
        hourly_rate DECIMAL(18,2) NOT NULL CONSTRAINT DF_contract_hourly_rate DEFAULT (0),
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_contract_status DEFAULT ('ACTIVE')
            CONSTRAINT CK_contract_status CHECK (status IN ('ACTIVE','EXPIRED','TERMINATED')),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_contract_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_contract_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_contract_employee FOREIGN KEY (employee_id) REFERENCES dbo.employees(id),
        CONSTRAINT CK_contract_dates CHECK (end_date IS NULL OR end_date >= start_date),
        CONSTRAINT CK_contract_hours_day CHECK (max_hours_per_day IS NULL OR max_hours_per_day > 0),
        CONSTRAINT CK_contract_hours_week CHECK (max_hours_per_week IS NULL OR max_hours_per_week > 0),
        CONSTRAINT CK_contract_rest CHECK (min_rest_hours >= 0),
        CONSTRAINT CK_contract_rate CHECK (hourly_rate >= 0)
    );
END;
GO

-- ============================================================
-- 4. STORE OPERATING HOURS / SETTINGS
-- ============================================================
IF OBJECT_ID('dbo.operating_hours', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.operating_hours (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_operating_hours PRIMARY KEY,
        day_of_week TINYINT NOT NULL
            CONSTRAINT CK_operating_day CHECK (day_of_week BETWEEN 1 AND 7),
        open_time TIME(0) NULL,
        close_time TIME(0) NULL,
        is_closed BIT NOT NULL CONSTRAINT DF_operating_closed DEFAULT (0),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_operating_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_operating_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_operating_day UNIQUE (day_of_week),
        CONSTRAINT CK_operating_time_required CHECK (
            (is_closed = 1 AND open_time IS NULL AND close_time IS NULL)
            OR
            (is_closed = 0 AND open_time IS NOT NULL AND close_time IS NOT NULL)
        )
    );
END;
GO

IF OBJECT_ID('dbo.system_settings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.system_settings (
        setting_key NVARCHAR(100) NOT NULL CONSTRAINT PK_system_settings PRIMARY KEY,
        setting_value NVARCHAR(MAX) NULL,
        description NVARCHAR(500) NULL,
        updated_by BIGINT NULL,
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_settings_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_settings_updated_by FOREIGN KEY (updated_by) REFERENCES dbo.users(id)
    );
END;
GO

-- ============================================================
-- 5. AVAILABILITY
-- ============================================================
IF OBJECT_ID('dbo.availability_entries', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.availability_entries (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_availability PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        start_at DATETIME2(0) NOT NULL,
        end_at DATETIME2(0) NOT NULL,
        availability_type NVARCHAR(20) NOT NULL CONSTRAINT DF_availability_type DEFAULT ('AVAILABLE')
            CONSTRAINT CK_availability_type CHECK (availability_type IN ('AVAILABLE','UNAVAILABLE')),
        note NVARCHAR(500) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_availability_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_availability_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_availability_employee FOREIGN KEY (employee_id) REFERENCES dbo.employees(id),
        CONSTRAINT CK_availability_time CHECK (end_at > start_at)
    );
END;
GO

-- ============================================================
-- 6. SHIFTS / REQUIREMENTS
-- ============================================================
IF OBJECT_ID('dbo.shifts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.shifts (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_shifts PRIMARY KEY,
        shift_name NVARCHAR(100) NOT NULL,
        start_at DATETIME2(0) NOT NULL,
        end_at DATETIME2(0) NOT NULL,
        priority NVARCHAR(20) NOT NULL CONSTRAINT DF_shift_priority DEFAULT ('NORMAL')
            CONSTRAINT CK_shift_priority CHECK (priority IN ('LOW','NORMAL','HIGH')),
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_shift_status DEFAULT ('ACTIVE')
            CONSTRAINT CK_shift_status CHECK (status IN ('ACTIVE','CANCELLED')),
        note NVARCHAR(500) NULL,
        created_by BIGINT NOT NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_shift_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_shift_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_shift_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
        CONSTRAINT CK_shift_time CHECK (end_at > start_at)
    );
END;
GO

IF OBJECT_ID('dbo.shift_requirements', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.shift_requirements (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_shift_requirements PRIMARY KEY,
        shift_id BIGINT NOT NULL,
        position_id BIGINT NULL,
        skill_id BIGINT NULL,
        minimum_skill_level TINYINT NULL,
        required_headcount INT NOT NULL,
        note NVARCHAR(500) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_requirement_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_requirement_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_requirement_shift FOREIGN KEY (shift_id) REFERENCES dbo.shifts(id),
        CONSTRAINT FK_requirement_position FOREIGN KEY (position_id) REFERENCES dbo.positions(id),
        CONSTRAINT FK_requirement_skill FOREIGN KEY (skill_id) REFERENCES dbo.skills(id),
        CONSTRAINT CK_requirement_level CHECK (minimum_skill_level IS NULL OR minimum_skill_level BETWEEN 1 AND 5),
        CONSTRAINT CK_requirement_headcount CHECK (required_headcount > 0),
        CONSTRAINT CK_requirement_skill_level_pair CHECK (
            (skill_id IS NULL AND minimum_skill_level IS NULL)
            OR
            (skill_id IS NOT NULL)
        )
    );
END;
GO

-- ============================================================
-- 7. SCHEDULE / SCHEDULING ENGINE RESULTS
-- ============================================================
IF OBJECT_ID('dbo.schedules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.schedules (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_schedules PRIMARY KEY,
        schedule_name NVARCHAR(150) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        version_no INT NOT NULL CONSTRAINT DF_schedule_version DEFAULT (1),
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_schedule_status DEFAULT ('DRAFT')
            CONSTRAINT CK_schedule_status CHECK (status IN ('DRAFT','REVIEWED','PUBLISHED','ARCHIVED')),
        created_by BIGINT NOT NULL,
        published_by BIGINT NULL,
        published_at DATETIME2(0) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_schedule_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_schedule_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_schedule_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
        CONSTRAINT FK_schedule_published_by FOREIGN KEY (published_by) REFERENCES dbo.users(id),
        CONSTRAINT CK_schedule_period CHECK (period_end >= period_start),
        CONSTRAINT UQ_schedule_period_version UNIQUE (period_start, period_end, version_no)
    );
END;
GO

IF OBJECT_ID('dbo.scheduling_runs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.scheduling_runs (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_scheduling_runs PRIMARY KEY,
        schedule_id BIGINT NOT NULL,
        initiated_by BIGINT NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_run_status DEFAULT ('QUEUED')
            CONSTRAINT CK_run_status CHECK (status IN ('QUEUED','RUNNING','SUCCESS','FAILED','TIMEOUT','CANCELLED')),
        started_at DATETIME2(0) NULL,
        finished_at DATETIME2(0) NULL,
        solve_time_ms INT NULL,
        objective_score DECIMAL(18,4) NULL,
        hard_constraint_violations INT NOT NULL CONSTRAINT DF_run_hard_violations DEFAULT (0),
        unfilled_positions INT NOT NULL CONSTRAINT DF_run_unfilled DEFAULT (0),
        error_message NVARCHAR(MAX) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_run_created DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_run_schedule FOREIGN KEY (schedule_id) REFERENCES dbo.schedules(id),
        CONSTRAINT FK_run_initiated_by FOREIGN KEY (initiated_by) REFERENCES dbo.users(id),
        CONSTRAINT CK_run_hard_violations CHECK (hard_constraint_violations >= 0),
        CONSTRAINT CK_run_unfilled CHECK (unfilled_positions >= 0)
    );
END;
GO

IF OBJECT_ID('dbo.schedule_assignments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.schedule_assignments (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_schedule_assignments PRIMARY KEY,
        schedule_id BIGINT NOT NULL,
        shift_id BIGINT NOT NULL,
        shift_requirement_id BIGINT NULL,
        employee_id BIGINT NOT NULL,
        assignment_source NVARCHAR(20) NOT NULL
            CONSTRAINT CK_assignment_source CHECK (assignment_source IN ('AUTO','MANUAL','OPEN_SHIFT','SHIFT_SWAP')),
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_assignment_status DEFAULT ('ASSIGNED')
            CONSTRAINT CK_assignment_status CHECK (status IN ('ASSIGNED','CONFIRMED','CANCELLED','REPLACED')),
        assigned_by BIGINT NULL,
        assigned_at DATETIME2(0) NOT NULL CONSTRAINT DF_assignment_assigned DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_assignment_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_assignment_schedule FOREIGN KEY (schedule_id) REFERENCES dbo.schedules(id),
        CONSTRAINT FK_assignment_shift FOREIGN KEY (shift_id) REFERENCES dbo.shifts(id),
        CONSTRAINT FK_assignment_requirement FOREIGN KEY (shift_requirement_id) REFERENCES dbo.shift_requirements(id),
        CONSTRAINT FK_assignment_employee FOREIGN KEY (employee_id) REFERENCES dbo.employees(id),
        CONSTRAINT FK_assignment_assigned_by FOREIGN KEY (assigned_by) REFERENCES dbo.users(id),
        CONSTRAINT UQ_assignment_schedule_shift_employee UNIQUE (schedule_id, shift_id, employee_id)
    );
END;
GO

-- ============================================================
-- 8. LEAVE / SHIFT SWAP / OPEN SHIFT
-- ============================================================
IF OBJECT_ID('dbo.leave_requests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.leave_requests (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_leave_requests PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        affected_assignment_id BIGINT NULL,
        leave_type NVARCHAR(20) NOT NULL
            CONSTRAINT CK_leave_type CHECK (leave_type IN ('ANNUAL','SICK','PERSONAL','UNPAID','EMERGENCY','OTHER')),
        start_at DATETIME2(0) NOT NULL,
        end_at DATETIME2(0) NOT NULL,
        reason NVARCHAR(1000) NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_leave_status DEFAULT ('PENDING')
            CONSTRAINT CK_leave_status CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
        reviewed_by BIGINT NULL,
        reviewed_at DATETIME2(0) NULL,
        review_note NVARCHAR(1000) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_leave_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_leave_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_leave_employee FOREIGN KEY (employee_id) REFERENCES dbo.employees(id),
        CONSTRAINT FK_leave_assignment FOREIGN KEY (affected_assignment_id) REFERENCES dbo.schedule_assignments(id),
        CONSTRAINT FK_leave_reviewer FOREIGN KEY (reviewed_by) REFERENCES dbo.users(id),
        CONSTRAINT CK_leave_time CHECK (end_at > start_at)
    );
END;
GO

IF OBJECT_ID('dbo.shift_swap_requests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.shift_swap_requests (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_shift_swap_requests PRIMARY KEY,
        requester_employee_id BIGINT NOT NULL,
        requester_assignment_id BIGINT NOT NULL,
        target_employee_id BIGINT NULL,
        target_assignment_id BIGINT NULL,
        reason NVARCHAR(1000) NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT DF_swap_status DEFAULT ('PENDING')
            CONSTRAINT CK_swap_status CHECK (status IN ('PENDING','ACCEPTED_BY_STAFF','APPROVED','REJECTED','CANCELLED')),
        reviewed_by BIGINT NULL,
        reviewed_at DATETIME2(0) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_swap_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_swap_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_swap_requester_employee FOREIGN KEY (requester_employee_id) REFERENCES dbo.employees(id),
        CONSTRAINT FK_swap_requester_assignment FOREIGN KEY (requester_assignment_id) REFERENCES dbo.schedule_assignments(id),
        CONSTRAINT FK_swap_target_employee FOREIGN KEY (target_employee_id) REFERENCES dbo.employees(id),
        CONSTRAINT FK_swap_target_assignment FOREIGN KEY (target_assignment_id) REFERENCES dbo.schedule_assignments(id),
        CONSTRAINT FK_swap_reviewer FOREIGN KEY (reviewed_by) REFERENCES dbo.users(id)
    );
END;
GO

IF OBJECT_ID('dbo.open_shifts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.open_shifts (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_open_shifts PRIMARY KEY,
        schedule_id BIGINT NOT NULL,
        shift_id BIGINT NOT NULL,
        shift_requirement_id BIGINT NOT NULL,
        vacancy_no INT NOT NULL CONSTRAINT DF_open_shift_vacancy DEFAULT (1),
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_open_shift_status DEFAULT ('OPEN')
            CONSTRAINT CK_open_shift_status CHECK (status IN ('OPEN','CLAIMED','CLOSED','CANCELLED')),
        claimed_by_employee_id BIGINT NULL,
        claimed_at DATETIME2(0) NULL,
        created_by BIGINT NOT NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_open_shift_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_open_shift_updated DEFAULT (SYSUTCDATETIME()),
        row_version ROWVERSION NOT NULL,
        CONSTRAINT FK_open_shift_schedule FOREIGN KEY (schedule_id) REFERENCES dbo.schedules(id),
        CONSTRAINT FK_open_shift_shift FOREIGN KEY (shift_id) REFERENCES dbo.shifts(id),
        CONSTRAINT FK_open_shift_requirement FOREIGN KEY (shift_requirement_id) REFERENCES dbo.shift_requirements(id),
        CONSTRAINT FK_open_shift_claimed_employee FOREIGN KEY (claimed_by_employee_id) REFERENCES dbo.employees(id),
        CONSTRAINT FK_open_shift_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
        CONSTRAINT CK_open_shift_vacancy CHECK (vacancy_no > 0),
        CONSTRAINT UQ_open_shift_vacancy UNIQUE (schedule_id, shift_id, shift_requirement_id, vacancy_no)
    );
END;
GO

-- ============================================================
-- 9. ATTENDANCE / TIMESHEET
-- ============================================================
IF OBJECT_ID('dbo.attendance_records', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.attendance_records (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_attendance_records PRIMARY KEY,
        assignment_id BIGINT NOT NULL,
        employee_id BIGINT NOT NULL,
        check_in_at DATETIME2(0) NULL,
        check_out_at DATETIME2(0) NULL,
        check_in_latitude DECIMAL(10,7) NULL,
        check_in_longitude DECIMAL(10,7) NULL,
        check_in_accuracy_m DECIMAL(10,2) NULL,
        check_in_distance_m DECIMAL(10,2) NULL,
        check_out_latitude DECIMAL(10,7) NULL,
        check_out_longitude DECIMAL(10,7) NULL,
        check_out_accuracy_m DECIMAL(10,2) NULL,
        check_out_distance_m DECIMAL(10,2) NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT DF_attendance_status DEFAULT ('NOT_CHECKED_IN')
            CONSTRAINT CK_attendance_status CHECK (status IN (
                'NOT_CHECKED_IN','CHECKED_IN','COMPLETED','ON_TIME','LATE',
                'EARLY_DEPARTURE','ABSENT','MISSING_CHECK_OUT','INVALID_LOCATION'
            )),
        note NVARCHAR(1000) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_attendance_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_attendance_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_attendance_assignment UNIQUE (assignment_id),
        CONSTRAINT FK_attendance_assignment FOREIGN KEY (assignment_id) REFERENCES dbo.schedule_assignments(id),
        CONSTRAINT FK_attendance_employee FOREIGN KEY (employee_id) REFERENCES dbo.employees(id),
        CONSTRAINT CK_attendance_checkout CHECK (check_out_at IS NULL OR check_in_at IS NULL OR check_out_at >= check_in_at)
    );
END;
GO

IF OBJECT_ID('dbo.timesheets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.timesheets (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_timesheets PRIMARY KEY,
        attendance_id BIGINT NOT NULL,
        employee_id BIGINT NOT NULL,
        work_date DATE NOT NULL,
        actual_start DATETIME2(0) NULL,
        actual_end DATETIME2(0) NULL,
        break_minutes INT NOT NULL CONSTRAINT DF_timesheet_break DEFAULT (0),
        regular_hours DECIMAL(7,2) NOT NULL CONSTRAINT DF_timesheet_regular DEFAULT (0),
        overtime_hours DECIMAL(7,2) NOT NULL CONSTRAINT DF_timesheet_overtime DEFAULT (0),
        hourly_rate_snapshot DECIMAL(18,2) NOT NULL CONSTRAINT DF_timesheet_rate DEFAULT (0),
        estimated_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_timesheet_amount DEFAULT (0),
        status NVARCHAR(30) NOT NULL CONSTRAINT DF_timesheet_status DEFAULT ('DRAFT')
            CONSTRAINT CK_timesheet_status CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','ADJUSTED')),
        adjustment_reason NVARCHAR(1000) NULL,
        approved_by BIGINT NULL,
        approved_at DATETIME2(0) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_timesheet_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_timesheet_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_timesheet_attendance UNIQUE (attendance_id),
        CONSTRAINT FK_timesheet_attendance FOREIGN KEY (attendance_id) REFERENCES dbo.attendance_records(id),
        CONSTRAINT FK_timesheet_employee FOREIGN KEY (employee_id) REFERENCES dbo.employees(id),
        CONSTRAINT FK_timesheet_approver FOREIGN KEY (approved_by) REFERENCES dbo.users(id),
        CONSTRAINT CK_timesheet_break CHECK (break_minutes >= 0),
        CONSTRAINT CK_timesheet_regular CHECK (regular_hours >= 0),
        CONSTRAINT CK_timesheet_overtime CHECK (overtime_hours >= 0),
        CONSTRAINT CK_timesheet_rate CHECK (hourly_rate_snapshot >= 0),
        CONSTRAINT CK_timesheet_amount CHECK (estimated_amount >= 0)
    );
END;
GO

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================
IF OBJECT_ID('dbo.notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.notifications (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notifications PRIMARY KEY,
        user_id BIGINT NOT NULL,
        notification_type NVARCHAR(30) NOT NULL
            CONSTRAINT CK_notification_type CHECK (notification_type IN (
                'SCHEDULE','LEAVE','SHIFT_SWAP','OPEN_SHIFT','ATTENDANCE','TIMESHEET','SYSTEM'
            )),
        title NVARCHAR(200) NOT NULL,
        message NVARCHAR(2000) NOT NULL,
        is_read BIT NOT NULL CONSTRAINT DF_notification_read DEFAULT (0),
        read_at DATETIME2(0) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_notification_created DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_notification_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );
END;
GO

-- ============================================================
-- 11. AI ASSISTANT METADATA
-- ============================================================
IF OBJECT_ID('dbo.ai_conversations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ai_conversations (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ai_conversations PRIMARY KEY,
        user_id BIGINT NOT NULL,
        title NVARCHAR(200) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_ai_conversation_created DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_ai_conversation_updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_ai_conversation_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );
END;
GO

IF OBJECT_ID('dbo.ai_messages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ai_messages (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ai_messages PRIMARY KEY,
        conversation_id BIGINT NOT NULL,
        sender NVARCHAR(10) NOT NULL
            CONSTRAINT CK_ai_message_sender CHECK (sender IN ('USER','AI','SYSTEM')),
        message NVARCHAR(MAX) NOT NULL,
        request_id UNIQUEIDENTIFIER NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_ai_message_created DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_ai_message_conversation FOREIGN KEY (conversation_id)
            REFERENCES dbo.ai_conversations(id) ON DELETE CASCADE
    );
END;
GO

-- ============================================================
-- 12. AUDIT LOG
-- ============================================================
IF OBJECT_ID('dbo.audit_logs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.audit_logs (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_audit_logs PRIMARY KEY,
        user_id BIGINT NULL,
        action NVARCHAR(100) NOT NULL,
        entity_type NVARCHAR(100) NOT NULL,
        entity_id NVARCHAR(100) NULL,
        old_values NVARCHAR(MAX) NULL,
        new_values NVARCHAR(MAX) NULL,
        ip_address NVARCHAR(64) NULL,
        request_id UNIQUEIDENTIFIER NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_audit_created DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_audit_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );
END;
GO

-- ============================================================
-- 13. INDEXES
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_availability_employee_time' AND object_id = OBJECT_ID('dbo.availability_entries'))
    CREATE INDEX IX_availability_employee_time ON dbo.availability_entries(employee_id, start_at, end_at);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_shifts_time' AND object_id = OBJECT_ID('dbo.shifts'))
    CREATE INDEX IX_shifts_time ON dbo.shifts(start_at, end_at);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_assignments_employee' AND object_id = OBJECT_ID('dbo.schedule_assignments'))
    CREATE INDEX IX_assignments_employee ON dbo.schedule_assignments(employee_id, schedule_id, shift_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_leave_employee_status' AND object_id = OBJECT_ID('dbo.leave_requests'))
    CREATE INDEX IX_leave_employee_status ON dbo.leave_requests(employee_id, status, start_at, end_at);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_open_shift_status' AND object_id = OBJECT_ID('dbo.open_shifts'))
    CREATE INDEX IX_open_shift_status ON dbo.open_shifts(status, shift_id, shift_requirement_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_timesheet_employee_date' AND object_id = OBJECT_ID('dbo.timesheets'))
    CREATE INDEX IX_timesheet_employee_date ON dbo.timesheets(employee_id, work_date, status);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_schedule_period' AND object_id = OBJECT_ID('dbo.schedules'))
    CREATE INDEX IX_schedule_period ON dbo.schedules(period_start, period_end, status);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_notification_user_read' AND object_id = OBJECT_ID('dbo.notifications'))
    CREATE INDEX IX_notification_user_read ON dbo.notifications(user_id, is_read, created_at);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_audit_entity' AND object_id = OBJECT_ID('dbo.audit_logs'))
    CREATE INDEX IX_audit_entity ON dbo.audit_logs(entity_type, entity_id, created_at);
GO

-- ============================================================
-- 14. DEFAULT SINGLE-STORE ROW + CORE SETTINGS
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM dbo.store_profile WHERE id = 1)
BEGIN
    INSERT INTO dbo.store_profile (id, store_name, geofence_radius_m, max_gps_accuracy_m)
    VALUES (1, N'Smart Scheduling F&B Store', 100, 50);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.system_settings WHERE setting_key = 'attendance.grace_minutes')
    INSERT INTO dbo.system_settings(setting_key, setting_value, description)
    VALUES ('attendance.grace_minutes', '5', N'Grace period in minutes for attendance reconciliation');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.system_settings WHERE setting_key = 'scheduling.max_solve_seconds')
    INSERT INTO dbo.system_settings(setting_key, setting_value, description)
    VALUES ('scheduling.max_solve_seconds', '15', N'Maximum OR-Tools solve time for target weekly dataset');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.system_settings WHERE setting_key = 'availability.deadline_day')
    INSERT INTO dbo.system_settings(setting_key, setting_value, description)
    VALUES ('availability.deadline_day', 'SUNDAY', N'Default weekly availability submission deadline');
GO

PRINT 'SmartScheduling database schema created successfully.';
GO

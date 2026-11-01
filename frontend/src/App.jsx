import { Navigate, Route, Routes } from "react-router-dom";
import { ROLES } from "./lib/constants";

import { useAuth } from "./context/AuthContext";
import { Protected, PublicOnly } from "./pages/login/ProtectedRoute";
import { homeOf } from "./pages/login/routeGuards";

import LandingPage from "./pages/login/LandingPage";
import LoginPage from "./pages/login/LoginPage";
import ManagerLayout from "./layouts/ManagerLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";

import EmployeeListPage from "./pages/manager/employees/EmployeeListPage";
import StaffAvailabilityPage from "./pages/manager/availability/AvailabilityPage";
import ShiftConfigPage from "./pages/manager/shiftconfig/ShiftConfigPage";
import SchedulePage from "./pages/manager/schedule/SchedulePage";
import CreatedSchedulePage from "./pages/manager/schedule/CreatedSchedulePage";
import WorkHoursPage from "./pages/manager/workHours/WorkHoursPage";
import ShiftExchangePage from "./pages/manager/shiftExchange/ShiftExchangePage";
import OpenShiftPage from "./pages/manager/openshifts/OpenShiftPage";
import LeavePage from "./pages/manager/leave/LeavePage";
import AttendancePage from "./pages/manager/attendance/AttendancePage";
import PayrollPage from "./pages/manager/payroll/PayrollPage";
import DashboardPage from "./pages/manager/dashboard/DashboardPage";
import ReportPage from "./pages/manager/reports/ReportPage";
import AssistantPage from "./pages/manager/assistant/AssistantPage";

import EmployeeProfilePage from "./pages/employees/profile/ProfilePage";
import EmployeeAvailabilityPage from "./pages/employees/availability/AvailabilityPage";
import EmployeeMySchedulePage from "./pages/employees/schedule/MySchedulePage";
import EmployeeShiftExchangePage from "./pages/employees/shiftExchange/ShiftExchangePage";
import EmployeeOpenShiftPage from "./pages/employees/openShifts/OpenShiftsPage";
import EmployeeLeavePage from "./pages/employees/leave/LeavePage";
import EmployeeAttendancePage from "./pages/employees/attendance/AttendancePage";

import NotificationsPage from "./pages/notifications/NotificationsPage";

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnly>
            <LandingPage />
          </PublicOnly>
        }
      />

      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />

      <Route path="/manager" element={<Protected role={ROLES.MANAGER}><ManagerLayout /></Protected>}>
        <Route index element={<Navigate to="schedule" replace />} />
        <Route path="employees" element={<EmployeeListPage />} />
        <Route path="availability" element={<StaffAvailabilityPage />} />
        <Route path="shift-config" element={<ShiftConfigPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="schedule/created" element={<CreatedSchedulePage />} />
        <Route path="work-hours" element={<WorkHoursPage />} />
        <Route path="shift-exchange" element={<ShiftExchangePage />} />
        <Route path="open-shifts" element={<OpenShiftPage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="reports" element={<ReportPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="/employees" element={<Protected role={ROLES.STAFF}><EmployeeLayout /></Protected>}>
        <Route index element={<Navigate to="schedule" replace />} />
        <Route path="profile" element={<EmployeeProfilePage />} />
        <Route path="availability" element={<EmployeeAvailabilityPage />} />
        <Route path="schedule" element={<EmployeeMySchedulePage />} />
        <Route path="shift-exchange" element={<EmployeeShiftExchangePage />} />
        <Route path="open-shifts" element={<EmployeeOpenShiftPage />} />
        <Route path="leave" element={<EmployeeLeavePage />} />
        <Route path="attendance" element={<EmployeeAttendancePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? homeOf(user.role) : "/login"} replace />} />
    </Routes>
  );
}

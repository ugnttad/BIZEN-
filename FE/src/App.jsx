import { Navigate, Route, Routes } from "react-router-dom";
import WebLayout from "./components/WebLayout";
import MobileLayout from "./components/MobileLayout";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/web/AdminDashboard";
import EmployeeManagement from "./pages/web/EmployeeManagement";
import EmployeeDetail from "./pages/web/EmployeeDetail";
import AttendanceDashboard from "./pages/web/AttendanceDashboard";
import ShiftScheduling from "./pages/web/ShiftScheduling";
import PayrollManagement from "./pages/web/PayrollManagement";
import PayrollDetail from "./pages/web/PayrollDetail";
import LeaveRequests from "./pages/web/LeaveRequests";
import Reports from "./pages/web/Reports";
import Settings from "./pages/web/Settings";
import AIAssistantPage from "./pages/web/AIAssistantPage";
import MobileLogin from "./pages/mobile/MobileLogin";
import EmployeeHome from "./pages/mobile/EmployeeHome";
import FaceIDCheckin from "./pages/mobile/FaceIDCheckin";
import MySchedule from "./pages/mobile/MySchedule";
import MyAttendance from "./pages/mobile/MyAttendance";
import MyPayroll from "./pages/mobile/MyPayroll";
import MobileLeaveRequest from "./pages/mobile/MobileLeaveRequest";
import Notifications from "./pages/mobile/Notifications";
import Profile from "./pages/mobile/Profile";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/web" element={<WebLayout />}>
        <Route index element={<Navigate to="/web/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="attendance" element={<AttendanceDashboard />} />
        <Route path="scheduling" element={<ShiftScheduling />} />
        <Route path="payroll" element={<PayrollManagement />} />
        <Route path="payroll/:id" element={<PayrollDetail />} />
        <Route path="leaves" element={<LeaveRequests />} />
        <Route path="reports" element={<Reports />} />
        <Route path="assistant" element={<AIAssistantPage />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/mobile/login" element={<MobileLogin />} />
      <Route path="/mobile" element={<MobileLayout />}>
        <Route index element={<Navigate to="/mobile/home" replace />} />
        <Route path="home" element={<EmployeeHome />} />
        <Route path="checkin" element={<FaceIDCheckin />} />
        <Route path="schedule" element={<MySchedule />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="payroll" element={<MyPayroll />} />
        <Route path="leave" element={<MobileLeaveRequest />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { Navigate, Route, Routes } from "react-router-dom";
import WebLayout from "./components/WebLayout";
import MobileLayout from "./components/MobileLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CompanyRegisterPage from "./pages/CompanyRegisterPage";
import EmployeeAccountRequestPage from "./pages/EmployeeAccountRequestPage";
import PlatformCompanyRequests from "./pages/platform/PlatformCompanyRequests";
import AdminDashboard from "./pages/web/AdminDashboard";
import EmployeeManagement from "./pages/web/EmployeeManagement";
import EmployeeDetail from "./pages/web/EmployeeDetail";
import AttendanceDashboard from "./pages/web/AttendanceDashboard";
import FaceEnrollmentReview from "./pages/web/FaceEnrollmentReview";
import AccountApprovals from "./pages/web/AccountApprovals";
import ShiftScheduling from "./pages/web/ShiftScheduling";
import KpiManagement from "./pages/web/KpiManagement";
import PayrollManagement from "./pages/web/PayrollManagement";
import PayrollDetail from "./pages/web/PayrollDetail";
import LeaveRequests from "./pages/web/LeaveRequests";
import Reports from "./pages/web/Reports";
import Settings from "./pages/web/Settings";
import AIAssistantPage from "./pages/web/AIAssistantPage";
import EmployeeWebPortal from "./pages/web/EmployeeWebPortal";
import EmployeeWebCheckin from "./pages/web/EmployeeWebCheckin";
import MobileLogin from "./pages/mobile/MobileLogin";
import ProtectedRoute from "./modules/auth/ProtectedRoute";
import { getAuthUser, getDefaultPathForRole } from "./modules/auth/authStore";
import EmployeeHome from "./pages/mobile/EmployeeHome";
import FaceIDCheckin from "./pages/mobile/FaceIDCheckin";
import MySchedule from "./pages/mobile/MySchedule";
import MyKpis from "./pages/mobile/MyKpis";
import MyAttendance from "./pages/mobile/MyAttendance";
import MyPayroll from "./pages/mobile/MyPayroll";
import MobileLeaveRequest from "./pages/mobile/MobileLeaveRequest";
import Notifications from "./pages/mobile/Notifications";
import Profile from "./pages/mobile/Profile";

function WebIndexRedirect() {
  const user = getAuthUser();
  return <Navigate to={user?.role === "Employee" ? "/web/me" : "/web/dashboard"} replace />;
}

function LandingEntry() {
  const user = getAuthUser();
  if (user?.role) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }
  return <LandingPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingEntry />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-company" element={<CompanyRegisterPage />} />
      <Route path="/register-employee" element={<EmployeeAccountRequestPage />} />
      <Route
        path="/platform/companies"
        element={
          <ProtectedRoute roles={["PlatformAdmin"]}>
            <PlatformCompanyRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/web"
        element={
          <ProtectedRoute roles={["Admin", "Employee"]}>
            <WebLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<WebIndexRedirect />} />
        <Route
          path="me"
          element={
            <ProtectedRoute roles={["Employee"]}>
              <EmployeeWebPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="me/checkin"
          element={
            <ProtectedRoute roles={["Employee"]}>
              <EmployeeWebCheckin />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees/:id"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <EmployeeDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendance"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <AttendanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="accounts"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <AccountApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="face-id"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <FaceEnrollmentReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="scheduling"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <ShiftScheduling />
            </ProtectedRoute>
          }
        />
        <Route
          path="kpis"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <KpiManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="payroll"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <PayrollManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="payroll/:id"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <PayrollDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="leaves"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <LeaveRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="assistant"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <AIAssistantPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="/mobile/login" element={<MobileLogin />} />
      <Route
        path="/mobile"
        element={
          <ProtectedRoute roles={["Employee"]}>
            <MobileLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/mobile/home" replace />} />
        <Route path="home" element={<EmployeeHome />} />
        <Route path="checkin" element={<FaceIDCheckin />} />
        <Route path="schedule" element={<MySchedule />} />
        <Route path="kpis" element={<MyKpis />} />
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

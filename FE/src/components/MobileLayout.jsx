import { useState } from "react";
import { Link, Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, ChevronDown, ClipboardCheck, CreditCard, Home, LogOut, MessageCircle, Monitor, ScanFace, UserRound } from "lucide-react";
import Avatar from "./Avatar";
import { setEmployeeExperiencePreference } from "../modules/auth/authStore";
import { clearMobileEmployeeSession, getFirstName, getMobileEmployeeSession } from "../modules/auth/mobileSession";

const mobileNav = [
  { label: "Home", path: "/mobile/home", icon: Home },
  { label: "Lịch", path: "/mobile/schedule", icon: CalendarDays },
  { label: "Việc", path: "/mobile/kpis", icon: ClipboardCheck },
  { label: "Chat", path: "/mobile/community", icon: MessageCircle },
  { label: "Scan", path: "/mobile/checkin", icon: ScanFace },
  { label: "Lương", path: "/mobile/payroll", icon: CreditCard },
  { label: "Hồ sơ", path: "/mobile/profile", icon: UserRound }
];

export default function MobileLayout() {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const employee = getMobileEmployeeSession();

  if (!employee?.id) {
    return <Navigate to="/mobile/login" replace />;
  }

  function logout() {
    clearMobileEmployeeSession();
    navigate("/mobile/login", { replace: true });
  }

  return (
    <div className="app-background min-h-screen">
      <div className="ambient-grid pointer-events-none fixed inset-x-0 top-0 h-64" />
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-slate-50">
        <header className="relative overflow-hidden border-b border-white/70 bg-white/90 px-5 py-4 backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-teal-400 to-amber-400" />
          <div className="relative flex items-center justify-between">
            <Link to="/mobile/home" className="group min-w-0 rounded-lg">
              <p className="text-xs font-bold uppercase tracking-normal text-blue-600">BIZEN Mobile</p>
              <h1 className="truncate text-lg font-bold text-slate-950 transition-colors group-hover:text-blue-700">Xin chào, {getFirstName(employee.name)}</h1>
            </Link>
            <div className="flex items-center gap-2">
              <NavLink
                to="/mobile/notifications"
                className="btn-motion relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                aria-label="Thông báo"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
              </NavLink>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-1 rounded-xl border border-transparent p-1 transition hover:border-slate-200 hover:bg-white"
                  aria-label="Mở menu hồ sơ"
                  aria-expanded={profileOpen}
                >
                  <Avatar name={employee.name || employee.id} src={employee.avatarUrl} size="sm" />
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${profileOpen ? "rotate-180" : ""}`} />
                </button>
                {profileOpen ? (
                  <div className="animate-panel-in absolute right-0 top-12 z-30 w-56 rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-2xl shadow-slate-950/10">
                    <div className="px-3 py-3">
                      <p className="truncate text-sm font-bold text-slate-950">{employee.name || employee.id}</p>
                      <p className="truncate text-xs text-slate-500">{employee.email || "Employee"}</p>
                    </div>
                    <div className="border-t border-slate-100 py-2">
                      <Link to="/mobile/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                        <UserRound className="h-4 w-4" />
                        Hồ sơ cá nhân
                      </Link>
                      <Link
                        to="/web/me"
                        onClick={() => {
                          setEmployeeExperiencePreference("web");
                          setProfileOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Monitor className="h-4 w-4" />
                        Mở bản web
                      </Link>
                      <Link to="/mobile/notifications" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                        <Bell className="h-4 w-4" />
                        Thông báo
                      </Link>
                      <Link to="/mobile/home" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                        <Home className="h-4 w-4" />
                        Trang chủ
                      </Link>
                    </div>
                    <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50">
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-5 no-scrollbar animate-page-enter">
          <Outlet />
        </div>

        <nav className="absolute inset-x-3 bottom-3 grid grid-cols-7 rounded-2xl border border-white/70 bg-white/90 p-1.5 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold transition-all duration-200 ${
                    isActive ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Bell, Building2, CalendarCheck2, ChevronRight, Clock3, CreditCard, FileText, Home, LayoutDashboard, LogOut, Menu, ScanFace, Search, Settings, Sparkles, UserCheck, UsersRound } from "lucide-react";
import Avatar from "./Avatar";
import AiChat from "./AiChat";
import { clearAuthSession, getAuthUser } from "../modules/auth/authStore";

const webNavItems = [
  { label: "Tổng quan", path: "/web/dashboard", icon: LayoutDashboard, roles: ["Admin", "HR", "Manager"] },
  { label: "Nhân viên", path: "/web/employees", icon: UsersRound, roles: ["Admin", "HR", "Manager"] },
  { label: "Chấm công", path: "/web/attendance", icon: Clock3, roles: ["Admin", "HR", "Manager"] },
  { label: "Tài khoản", path: "/web/accounts", icon: UserCheck, roles: ["Admin", "HR"] },
  { label: "Face ID", path: "/web/face-id", icon: ScanFace, roles: ["Admin", "HR"] },
  { label: "Xếp ca", path: "/web/scheduling", icon: CalendarCheck2, roles: ["Admin", "HR", "Manager"] },
  { label: "Bảng lương", path: "/web/payroll", icon: CreditCard, roles: ["Admin", "HR"] },
  { label: "Nghỉ phép", path: "/web/leaves", icon: FileText, roles: ["Admin", "HR", "Manager"] },
  { label: "Báo cáo", path: "/web/reports", icon: BarChart3, roles: ["Admin", "HR", "Manager"] },
  { label: "Trợ lý AI", path: "/web/assistant", icon: Sparkles, roles: ["Admin", "HR", "Manager"] },
  { label: "Cài đặt", path: "/web/settings", icon: Settings, roles: ["Admin"] }
];

function getTitle(pathname) {
  const match = webNavItems.find((item) => pathname.startsWith(item.path));
  if (pathname.includes("/web/employees/")) return "Chi tiết nhân viên";
  if (pathname.includes("/web/payroll/")) return "Chi tiết lương";
  return match?.label || "BIZEN";
}

export default function WebLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAuthUser();
  const visibleNavItems = webNavItems.filter((item) => item.roles.includes(user?.role));
  const title = getTitle(location.pathname);

  function logout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white px-3 py-4 lg:block">
        <Link to="/" className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-blue-50">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white transition duration-300 group-hover:scale-105 group-hover:bg-blue-700">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-normal text-slate-950 transition-colors group-hover:text-blue-700">BIZEN</p>
            <p className="text-xs text-slate-500">Cloud HR & Payroll</p>
          </div>
        </Link>

        <nav className="mt-6 space-y-1">
          <Link
            to="/"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            <span className="flex items-center gap-3">
              <Home className="h-4 w-4" />
              Trang chủ
            </span>
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          </Link>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="btn-motion absolute bottom-4 left-3 right-3 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-normal text-slate-500">BIZEN Đà Nẵng</p>
                <h1 className="truncate text-lg font-semibold text-slate-950">{title}</h1>
              </div>
            </div>
            <div className="hidden min-w-[280px] max-w-sm flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
              <Search className="h-4 w-4 text-slate-400" />
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Tìm nhân viên, ca làm, bảng lương" />
            </div>
            <div className="flex items-center gap-2">
              <button className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100" aria-label="Thông báo">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              </button>
              <Avatar name={user?.name || "BIZEN"} size="sm" />
            </div>
          </div>
        </header>

        <main className="grid gap-5 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 animate-page-enter">
            <Outlet />
          </div>
          <div className="hidden xl:block animate-page-enter">
            <AiChat />
          </div>
        </main>
      </div>
    </div>
  );
}

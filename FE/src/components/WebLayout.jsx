import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Command,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanFace,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import Avatar from "./Avatar";
import AiChat from "./AiChat";
import { bizenApi } from "../modules/api/bizenApi";
import { clearAuthSession, getAuthUser, getDefaultPathForRole } from "../modules/auth/authStore";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAuthUser();
  const visibleNavItems = webNavItems.filter((item) => item.roles.includes(user?.role));
  const title = getTitle(location.pathname);
  const homePath = getDefaultPathForRole(user?.role);

  useEffect(() => {
    setMenuOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    bizenApi
      .aiAlerts()
      .then((items) => {
        if (active) setAlerts(items.slice(0, 4));
      })
      .catch(() => {
        if (active) setAlerts([]);
      });

    return () => {
      active = false;
    };
  }, []);

  function logout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  function renderNavItems() {
    return (
      <>
        <Link
          to={homePath}
          className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-white hover:text-slate-950 hover:shadow-sm"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-slate-950 group-hover:text-white">
              <Home className="h-4 w-4" />
            </span>
            Trang chủ
          </span>
          <ChevronRight className="h-3.5 w-3.5 opacity-40 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "nav-item-active bg-white text-blue-700"
                    : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-lg transition-all duration-200 ${
                        isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-100 text-slate-500 group-hover:bg-slate-950 group-hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 opacity-40 transition-transform ${isActive ? "translate-x-0.5 opacity-80" : "group-hover:translate-x-0.5"}`} />
                </>
              )}
            </NavLink>
          );
        })}
      </>
    );
  }

  return (
    <div className="app-background relative min-h-screen overflow-hidden">
      <div className="ambient-grid pointer-events-none fixed inset-x-0 top-0 h-72" />

      <aside className="fixed inset-y-4 left-4 z-30 hidden min-h-0 w-72 flex-col rounded-2xl border border-white/70 bg-white/80 px-3 py-4 shadow-soft backdrop-blur-2xl lg:flex">
        <Link to={homePath} className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-300 hover:bg-white hover:shadow-sm">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-950/10 transition duration-300 group-hover:scale-105 group-hover:bg-blue-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold tracking-normal text-slate-950 transition-colors group-hover:text-blue-700">BIZEN</p>
            <p className="text-xs font-medium text-slate-500">Cloud HR & Payroll</p>
          </div>
        </Link>

        <div className="mt-4 rounded-xl border border-slate-200/80 bg-white/70 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Live workspace
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-950">BIZEN Đà Nẵng</p>
              <p className="text-xs text-slate-500">{user?.role || "Workspace"} dashboard</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <nav className="mt-4 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">{renderNavItems()}</nav>

        <div className="mt-3 shrink-0 space-y-3 border-t border-slate-200/70 pt-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-blue-700">
              <Activity className="h-4 w-4" />
              AI ready
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600">Trợ lý có thể đọc dữ liệu chấm công, lịch ca và payroll.</p>
          </div>
          <button
            onClick={logout}
            className="btn-motion flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />
          <aside className="animate-slide-over relative flex h-full w-[min(88vw,340px)] flex-col border-r border-white/70 bg-white px-4 py-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link to={homePath} className="flex items-center gap-3 rounded-xl">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white">
                  <Building2 className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-lg font-bold text-slate-950">BIZEN</span>
                  <span className="block text-xs font-medium text-slate-500">Cloud HR & Payroll</span>
                </span>
              </Link>
              <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600" onClick={() => setMenuOpen(false)} aria-label="Đóng menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">{renderNavItems()}</nav>
            <button
              onClick={logout}
              className="btn-motion mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </aside>
        </div>
      ) : null}

      <div className="relative lg:pl-[19rem]">
        <header className="sticky top-0 z-20 px-3 py-3 md:px-6">
          <div className="glass-panel mx-auto flex items-center justify-between gap-3 rounded-2xl px-3 py-3 md:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="btn-motion grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
                aria-label="Mở menu"
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-normal text-blue-600">BIZEN Đà Nẵng</p>
                <h1 className="truncate text-lg font-bold text-slate-950 md:text-xl">{title}</h1>
              </div>
            </div>

            <label className="soft-focus hidden min-w-[280px] max-w-xl flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 md:flex">
              <Search className="h-4 w-4 text-slate-400" />
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Tìm nhân viên, ca làm, bảng lương" />
              <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] font-bold text-slate-400 xl:inline-flex">
                <Command className="h-3 w-3" /> K
              </span>
            </label>

            <div className="flex items-center gap-2">
              <Link
                to="/web/assistant"
                className="btn-motion hidden items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-slate-950/10 hover:bg-blue-600 sm:inline-flex"
              >
                <Sparkles className="h-4 w-4" />
                AI
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen((value) => !value);
                    setProfileOpen(false);
                  }}
                  className="btn-motion relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                  aria-label="Thông báo"
                  aria-expanded={notificationsOpen}
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
                </button>
                {notificationsOpen ? (
                  <div className="animate-panel-in absolute right-0 top-12 z-30 w-[min(86vw,360px)] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-950/10">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">Thông báo</p>
                        <p className="text-xs text-slate-500">Tín hiệu vận hành mới nhất</p>
                      </div>
                      <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">{alerts.length || 0}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {alerts.length ? (
                        alerts.map((alert) => (
                          <Link key={alert.id} to="/web/reports" className="block rounded-xl border border-slate-100 bg-slate-50 p-3 hover:border-blue-200 hover:bg-blue-50">
                            <p className="text-sm font-bold text-slate-950">{alert.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{alert.detail}</p>
                          </Link>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                          Chưa có thông báo mới. Khi có cảnh báo AI hoặc việc Admin/HR cần xử lý, chúng sẽ hiện ở đây.
                        </div>
                      )}
                    </div>
                    <Link to="/web/assistant" className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-blue-600">
                      <Sparkles className="h-4 w-4" />
                      Mở trợ lý AI
                    </Link>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((value) => !value);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-transparent p-1 pr-2 transition hover:border-slate-200 hover:bg-white"
                  aria-label="Mở menu hồ sơ"
                  aria-expanded={profileOpen}
                >
                  <Avatar name={user?.name || "BIZEN"} size="sm" />
                  <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition sm:block ${profileOpen ? "rotate-180" : ""}`} />
                </button>
                {profileOpen ? (
                  <div className="animate-panel-in absolute right-0 top-12 z-30 w-[min(86vw,280px)] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/10">
                    <div className="px-3 py-3">
                      <p className="truncate text-sm font-bold text-slate-950">{user?.name || "BIZEN User"}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email || user?.role}</p>
                    </div>
                    <div className="border-t border-slate-100 py-2">
                      <Link to={homePath} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                        <Home className="h-4 w-4" />
                        Trang chủ
                      </Link>
                      {user?.role === "Admin" ? (
                        <Link to="/web/settings" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                          <Settings className="h-4 w-4" />
                          Cài đặt tài khoản
                        </Link>
                      ) : null}
                      <Link to="/web/assistant" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                        <UserRound className="h-4 w-4" />
                        Trợ lý / hồ sơ
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="grid gap-5 px-3 pb-6 pt-2 md:px-6 xl:grid-cols-[minmax(0,1fr)_360px]">
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

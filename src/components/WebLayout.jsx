import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Bell, Building2, ChevronRight, Menu, Search, Smartphone } from "lucide-react";
import { webNavItems } from "../data/mockData";
import Avatar from "./Avatar";
import AiChat from "./AiChat";

function getTitle(pathname) {
  const match = webNavItems.find((item) => pathname.startsWith(item.path));
  if (pathname.includes("/web/employees/")) return "Chi tiết nhân viên";
  if (pathname.includes("/web/payroll/")) return "Chi tiết lương";
  return match?.label || "BIZEN";
}

export default function WebLayout() {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white px-3 py-4 lg:block">
        <NavLink to="/web/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-normal text-slate-950">BIZEN</p>
            <p className="text-xs text-slate-500">Cloud HR & Payroll</p>
          </div>
        </NavLink>

        <nav className="mt-6 space-y-1">
          {webNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
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

        <NavLink
          to="/mobile/home"
          className="absolute bottom-4 left-3 right-3 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Smartphone className="h-4 w-4" />
          Mobile app demo
        </NavLink>
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
              <Avatar name="Đỗ Thanh Tâm" size="sm" />
            </div>
          </div>
        </header>

        <main className="grid gap-5 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <Outlet />
          </div>
          <div className="hidden xl:block">
            <AiChat />
          </div>
        </main>
      </div>
    </div>
  );
}

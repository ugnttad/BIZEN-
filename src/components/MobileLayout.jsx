import { NavLink, Outlet } from "react-router-dom";
import { Bell, CalendarDays, CreditCard, Home, ScanFace, UserRound } from "lucide-react";
import Avatar from "./Avatar";
import AiChat from "./AiChat";

const mobileNav = [
  { label: "Home", path: "/mobile/home", icon: Home },
  { label: "Lịch", path: "/mobile/schedule", icon: CalendarDays },
  { label: "Scan", path: "/mobile/checkin", icon: ScanFace },
  { label: "Lương", path: "/mobile/payroll", icon: CreditCard },
  { label: "Hồ sơ", path: "/mobile/profile", icon: UserRound }
];

export default function MobileLayout() {
  return (
    <div className="min-h-screen bg-slate-100 px-0 py-0 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-slate-50 shadow-soft sm:min-h-[860px] sm:rounded-[28px] sm:border sm:border-slate-200">
        <header className="flex items-center justify-between bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-blue-600">BIZEN Mobile</p>
            <h1 className="text-lg font-semibold text-slate-950">Xin chào, Đạt</h1>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/mobile/notifications" className="relative grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label="Thông báo">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500" />
            </NavLink>
            <Avatar name="Phạm Thanh Đạt" size="sm" />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-24 pt-4 no-scrollbar">
          <Outlet />
          <div className="mt-5">
            <AiChat compact />
          </div>
        </div>

        <nav className="grid grid-cols-5 border-t border-slate-200 bg-white px-2 py-2">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold ${
                    isActive ? "bg-blue-50 text-blue-700" : "text-slate-500"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

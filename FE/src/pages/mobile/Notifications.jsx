import { useEffect, useState } from "react";
import { Bell, CalendarDays, Clock3, CreditCard } from "lucide-react";
import { bizenApi } from "../../modules/api/bizenApi";
import { getMobileEmployeeId } from "../../modules/auth/mobileSession";

const icons = {
  reminder: Clock3,
  schedule: CalendarDays,
  leave: Bell,
  payroll: CreditCard
};

export default function Notifications() {
  const employeeId = getMobileEmployeeId();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!employeeId) return;
    bizenApi.notifications(employeeId).then(setNotifications).catch((err) => setError(err.message || "Không tải được thông báo."));
  }, [employeeId]);

  if (error) {
    return <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</section>;
  }

  return (
    <section className="premium-card rounded-2xl p-4">
      <h2 className="relative z-10 font-semibold text-slate-950">Thông báo</h2>
      <div className="mt-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="relative z-10 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            Chưa có thông báo mới.
          </div>
        ) : null}
        {notifications.map((notification) => {
          const Icon = icons[notification.type] || Bell;
          return (
            <div key={notification.id} className="relative z-10 flex gap-3 rounded-xl border border-slate-200 bg-white/70 p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-950">{notification.title}</p>
                  <span className="text-xs text-slate-400">{notification.time}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{notification.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

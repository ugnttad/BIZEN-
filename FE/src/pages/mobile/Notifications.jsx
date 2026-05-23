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
    return <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</section>;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="font-semibold text-slate-950">Thông báo</h2>
      <div className="mt-4 space-y-3">
        {notifications.map((notification) => {
          const Icon = icons[notification.type] || Bell;
          return (
            <div key={notification.id} className="flex gap-3 rounded-lg border border-slate-200 p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
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

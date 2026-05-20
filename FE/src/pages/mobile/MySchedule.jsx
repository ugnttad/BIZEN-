import { CalendarDays } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { scheduleWeek, shifts } from "../../data/mockData";

export default function MySchedule() {
  const myId = "BZN017";
  const mySchedule = scheduleWeek
    .map((day) => ({
      ...day,
      slots: day.shifts.filter((slot) => slot.employees.includes(myId))
    }))
    .filter((day) => day.slots.length);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-950">Lịch làm của tôi</h2>
          <CalendarDays className="h-5 w-5 text-blue-600" />
        </div>
        <div className="mt-4 space-y-3">
          {mySchedule.map((day) => (
            <div key={day.date} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-950">{day.day}</p>
                <span className="text-sm text-slate-500">{day.date}</span>
              </div>
              {day.slots.map((slot) => {
                const shift = shifts.find((item) => item.id === slot.shiftId);
                return (
                  <div key={slot.shiftId} className="mt-3 rounded-lg bg-blue-50 p-3">
                    <p className="font-semibold text-blue-900">{shift.name}</p>
                    <p className="mt-1 text-sm text-blue-700">{shift.time}</p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-amber-900">Ca 23/05 cần xác nhận</p>
          <StatusBadge status="Pending" />
        </div>
        <p className="mt-1 text-sm text-amber-800">Manager đang kiểm tra workload trước khi chốt lịch.</p>
      </section>
    </div>
  );
}

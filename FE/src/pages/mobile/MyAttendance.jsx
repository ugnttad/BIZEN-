import { useEffect, useState } from "react";
import { Clock3, MapPin } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";
import { getMobileEmployeeId } from "../../modules/auth/mobileSession";

export default function MyAttendance() {
  const employeeId = getMobileEmployeeId();
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!employeeId) return;
    bizenApi.employeeAttendance(employeeId).then(setAttendanceHistory).catch((err) => setError(err.message || "Không tải được chấm công."));
  }, [employeeId]);

  const totalHours = attendanceHistory.reduce((sum, item) => sum + item.hours, 0).toFixed(1);

  if (error) {
    return <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</section>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <Clock3 className="h-5 w-5 text-blue-600" />
          <p className="mt-3 text-xs font-medium text-slate-500">Giờ tuần này</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{totalHours}h</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <MapPin className="h-5 w-5 text-violet-600" />
          <p className="mt-3 text-xs font-medium text-slate-500">GPS hợp lệ</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">4/4</p>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-950">Chấm công của tôi</h2>
        <div className="mt-4 space-y-3">
          {attendanceHistory.map((item) => (
            <div key={item.date} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-950">{item.date}</p>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-sm text-slate-500">{item.shift}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <span className="rounded-lg bg-slate-50 px-2 py-2 text-center">{item.checkIn}</span>
                <span className="rounded-lg bg-slate-50 px-2 py-2 text-center">{item.checkOut}</span>
                <span className="rounded-lg bg-slate-50 px-2 py-2 text-center">{item.hours}h</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

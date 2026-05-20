import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, Clock3, CreditCard, ScanFace, Umbrella } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";

const mobileEmployeeId = "BZN017";

export default function EmployeeHome() {
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [shift, setShift] = useState(null);

  useEffect(() => {
    Promise.all([bizenApi.employee(mobileEmployeeId), bizenApi.employeeAttendance(mobileEmployeeId), bizenApi.payrollDetail(mobileEmployeeId), bizenApi.shifts()]).then(
      ([employeeData, attendanceRows, payrollData, shiftRows]) => {
        setEmployee(employeeData);
        setAttendance(attendanceRows.find((record) => record.date === "20/05/2026") || attendanceRows[0]);
        setPayroll(payrollData);
        setShift(shiftRows.find((item) => item.id === employeeData.shiftId));
      }
    );
  }, []);

  if (!employee || !attendance || !payroll || !shift) {
    return <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Đang tải dữ liệu nhân viên từ Neon...</section>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-slate-950 p-5 text-white">
        <p className="text-sm text-blue-100">Hôm nay bạn làm ca nào?</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">{shift.name}</h2>
        <p className="mt-1 text-sm text-slate-300">{shift.time}</p>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
          <span className="text-sm text-slate-200">Bạn đã check-in chưa?</span>
          <StatusBadge status={attendance.status} />
        </div>
        <Link to="/mobile/checkin" className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-400">
          <ScanFace className="h-5 w-5" />
          Check-in / Check-out
        </Link>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <p className="mt-3 text-xs font-medium text-slate-500">Lương tạm tính</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(payroll.finalSalary)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <Umbrella className="h-5 w-5 text-violet-600" />
          <p className="mt-3 text-xs font-medium text-slate-500">Phép còn lại</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{employee.leaveRemaining} ngày</p>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-950">Lịch hôm nay</h2>
          <CalendarDays className="h-5 w-5 text-slate-400" />
        </div>
        <div className="mt-4 rounded-lg bg-blue-50 p-3">
          <p className="font-semibold text-blue-900">{shift.name}</p>
          <p className="mt-1 text-sm text-blue-700">{shift.time} · Customer Support</p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <Link to="/mobile/attendance" className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600">
              <Clock3 className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-slate-950">Chấm công của tôi</span>
              <span className="text-sm text-slate-500">{attendance.checkIn} · {attendance.note}</span>
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </Link>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <Link to="/mobile/leave" className="flex items-center justify-between">
          <span>
            <span className="block font-semibold text-slate-950">Gửi đơn nghỉ phép</span>
            <span className="text-sm text-slate-500">Còn {employee.leaveRemaining} ngày phép</span>
          </span>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </Link>
      </section>
    </div>
  );
}

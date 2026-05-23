import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, Clock3, CreditCard, ScanFace, Umbrella } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";
import { getMobileEmployeeId } from "../../modules/auth/mobileSession";

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default function EmployeeHome() {
  const employeeId = getMobileEmployeeId();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [shift, setShift] = useState(null);
  const [error, setError] = useState("");
  const today = formatLocalDate();
  const todayDisplay = formatDisplayDate(today);

  useEffect(() => {
    let active = true;
    if (!employeeId) {
      setError("Chưa gắn hồ sơ nhân viên. Đăng xuất và đăng nhập lại sau khi HR duyệt tài khoản.");
      return;
    }

    async function load() {
      try {
        const [employeeData, attendanceRows, shiftRows] = await Promise.all([
          bizenApi.employee(employeeId),
          bizenApi.employeeAttendance(employeeId),
          bizenApi.shifts()
        ]);

        if (!active) return;

        const todayRecord = attendanceRows.find((record) => record.date === todayDisplay);
        setEmployee(employeeData);
        setAttendance(
          todayRecord || {
            date: todayDisplay,
            checkIn: "-",
            checkOut: "-",
            hours: 0,
            status: "Absent",
            note: "Chưa chấm công"
          }
        );
        setShift(shiftRows.find((item) => item.id === employeeData.shiftId) || shiftRows[0] || null);

        try {
          const payrollData = await bizenApi.payrollDetail(employeeId);
          if (active) setPayroll(payrollData);
        } catch {
          if (active) setPayroll(null);
        }
      } catch (err) {
        if (active) setError(err.message || "Không tải được dữ liệu nhân viên.");
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [employeeId, todayDisplay]);

  if (error) {
    return <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</section>;
  }

  if (!employee || !attendance) {
    return <section className="premium-card rounded-2xl p-4 text-sm text-slate-500">Đang tải dữ liệu nhân viên…</section>;
  }

  const salaryLabel = payroll?.isEstimate ? "Lương tạm tính" : "Lương tháng này";
  const salaryValue = payroll ? formatCurrency(payroll.finalSalary) : "—";

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-teal-300 to-amber-300" />
        <p className="text-sm text-blue-100">Hôm nay · {todayDisplay}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">{shift?.name || "Chưa xếp ca"}</h2>
        <p className="mt-1 text-sm text-slate-300">{shift?.time || "Liên hệ quản lý ca"}</p>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur">
          <span className="text-sm text-slate-200">{attendance.checkIn === "-" ? "Bạn chưa check-in" : `Check-in ${attendance.checkIn}`}</span>
          <StatusBadge status={attendance.status} />
        </div>
        <Link to="/mobile/checkin" className="btn-motion mt-5 flex items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-400">
          <ScanFace className="h-5 w-5" />
          Chấm công Face ID
        </Link>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="premium-card rounded-2xl p-4">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <p className="mt-3 text-xs font-medium text-slate-500">{salaryLabel}</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{salaryValue}</p>
          {payroll?.isEstimate ? <p className="mt-1 text-xs text-amber-700">HR chưa chốt bảng lương — số liệu từ công + BH</p> : null}
          {!payroll ? <p className="mt-1 text-xs text-slate-500">HR sẽ tính lương trên web</p> : null}
        </div>
        <div className="premium-card rounded-2xl p-4">
          <Umbrella className="h-5 w-5 text-violet-600" />
          <p className="mt-3 text-xs font-medium text-slate-500">Phép còn lại</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{employee.leaveRemaining} ngày</p>
        </div>
      </div>

      {shift ? (
        <section className="premium-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-950">Lịch hôm nay</h2>
            <CalendarDays className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-4 rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100">
            <p className="font-semibold text-blue-900">{shift.name}</p>
            <p className="mt-1 text-sm text-blue-700">
              {shift.time} · {employee.department}
            </p>
          </div>
        </section>
      ) : null}

      <section className="premium-card rounded-2xl p-4">
        <Link to="/mobile/attendance" className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
              <Clock3 className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-slate-950">Chấm công của tôi</span>
              <span className="text-sm text-slate-500">
                {attendance.checkIn} · {attendance.note || "Đã đồng bộ"}
              </span>
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </Link>
      </section>

      <section className="premium-card rounded-2xl p-4">
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

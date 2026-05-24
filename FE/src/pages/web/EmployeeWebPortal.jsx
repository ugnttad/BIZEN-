import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  Mail,
  Phone,
  ScanFace,
  Send,
  ShieldCheck,
  Smartphone,
  Umbrella,
  UserRound
} from "lucide-react";
import Avatar from "../../components/Avatar";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";
import { getAuthUser, setEmployeeExperiencePreference } from "../../modules/auth/authStore";
import { getFirstName, getMobileEmployeeId } from "../../modules/auth/mobileSession";

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value, days) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

function formatDisplayDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function getEmployeeId() {
  const authUser = getAuthUser();
  return authUser?.employeeId || getMobileEmployeeId();
}

function getAssignedSchedule(scheduleWeek, employeeId, shifts) {
  return scheduleWeek
    .map((day) => ({
      ...day,
      slots: (day.shifts || [])
        .filter((slot) => slot.employees?.includes(employeeId))
        .map((slot) => ({
          ...slot,
          shift: shifts.find((item) => item.id === slot.shiftId) || { id: slot.shiftId, name: slot.shiftId, time: "-" }
        }))
    }))
    .filter((day) => day.slots.length);
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-slate-500">{label}</span>
        <span className="block truncate text-sm font-semibold text-slate-950">{value || "-"}</span>
      </span>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100"
  };

  return (
    <section className="premium-card rounded-2xl p-4">
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500">{label}</p>
          <p className="mt-2 truncate text-xl font-bold tracking-normal text-slate-950">{value}</p>
          {helper ? <p className="mt-1 line-clamp-2 text-sm text-slate-500">{helper}</p> : null}
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${tones[tone] || tones.blue}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </section>
  );
}

export default function EmployeeWebPortal() {
  const employeeId = getEmployeeId();
  const tomorrow = useMemo(() => addDays(formatDateInput(new Date()), 1), []);
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [scheduleWeek, setScheduleWeek] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [payroll, setPayroll] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [faceEnrollment, setFaceEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaveForm, setLeaveForm] = useState({
    type: "Annual leave",
    from: tomorrow,
    days: 1,
    reason: ""
  });
  const [leaveError, setLeaveError] = useState("");
  const [leaveSent, setLeaveSent] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!employeeId) {
        setError("Tài khoản chưa gắn hồ sơ nhân viên. Chủ sở hữu cần duyệt hoặc gắn nhân viên trước khi dùng cổng web.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [employeeData, attendanceRows, shiftRows, scheduleRows, payrollData, leaveRows, notificationRows, faceData] = await Promise.all([
          bizenApi.employee(employeeId),
          bizenApi.employeeAttendance(employeeId),
          bizenApi.shifts(),
          bizenApi.scheduleWeek(),
          bizenApi.payrollDetail(employeeId).catch(() => null),
          bizenApi.leaves().catch(() => []),
          bizenApi.notifications(employeeId).catch(() => []),
          bizenApi.faceEnrollmentStatus(employeeId).catch(() => null)
        ]);

        if (!active) return;

        setEmployee(employeeData);
        setAttendance(attendanceRows);
        setShifts(shiftRows);
        setScheduleWeek(scheduleRows);
        setPayroll(payrollData);
        setLeaves(leaveRows);
        setNotifications(notificationRows);
        setFaceEnrollment(faceData);
      } catch (requestError) {
        if (active) setError(requestError.message || "Không tải được dữ liệu nhân viên.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [employeeId]);

  async function submitLeave(event) {
    event.preventDefault();
    if (!leaveForm.reason.trim() || Number(leaveForm.days) <= 0) {
      setLeaveError("Vui lòng nhập lý do và số ngày nghỉ hợp lệ.");
      return;
    }

    setSubmittingLeave(true);
    setLeaveError("");
    setLeaveSent(false);

    try {
      await bizenApi.createLeave({
        employeeId,
        type: leaveForm.type,
        from: leaveForm.from,
        to: addDays(leaveForm.from, Math.max(Math.ceil(Number(leaveForm.days)) - 1, 0)),
        days: Number(leaveForm.days),
        reason: leaveForm.reason,
        approver: employee?.manager || "Quản lý"
      });
      const leaveRows = await bizenApi.leaves();
      setLeaves(leaveRows);
      setLeaveForm((current) => ({ ...current, reason: "" }));
      setLeaveSent(true);
    } catch (requestError) {
      setLeaveError(requestError.message || "Không gửi được đơn nghỉ phép.");
    } finally {
      setSubmittingLeave(false);
    }
  }

  if (loading) {
    return (
      <section className="premium-card rounded-2xl p-5 text-sm font-semibold text-slate-500">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải cổng nhân viên...
        </span>
      </section>
    );
  }

  if (error || !employee) {
    return <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">{error || "Không tìm thấy hồ sơ nhân viên."}</section>;
  }

  const todayIso = formatDateInput(new Date());
  const todayDisplay = formatDisplayDate(todayIso);
  const assignedSchedule = getAssignedSchedule(scheduleWeek, employeeId, shifts);
  const todaySchedule = assignedSchedule.find((day) => day.date === todayDisplay || String(day.work_date || "").startsWith(todayIso));
  const todaySlot = todaySchedule?.slots?.[0];
  const defaultShift = shifts.find((item) => item.id === employee.shiftId);
  const activeShift = todaySlot?.shift || defaultShift;
  const todayAttendance = attendance.find((item) => item.workDate === todayIso || item.date === todayDisplay);
  const totalHours = attendance.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  const missingCheckout = attendance.filter((item) => item.needsCheckoutReview).length;
  const pendingLeaves = leaves.filter((item) => item.status === "Pending").length;
  const salaryValue = payroll?.finalSalary ? formatCurrency(payroll.finalSalary) : "Chưa có";
  const salaryHelper = payroll?.isEstimate ? "Tạm tính từ công hiện có" : payroll?.status || "Đang cập nhật";
  const faceStatus = faceEnrollment?.status === "Not submitted" ? "Chưa đăng ký" : faceEnrollment?.status || "Chưa đăng ký";

  return (
    <div>
      <PageHeader
        eyebrow="Employee Workspace"
        title={`Xin chào, ${getFirstName(employee.name)}`}
        description={`Hôm nay ${todayDisplay}. Bạn đang đăng nhập bằng tài khoản nhân viên trên bản web.`}
        actions={
          <>
            <Link
              to="/mobile/home"
              onClick={() => setEmployeeExperiencePreference("mobile")}
              className="btn-motion inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <Smartphone className="h-4 w-4" />
              Mở bản mobile
            </Link>
            <Link to="/web/me/checkin" className="btn-motion inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
              <ScanFace className="h-4 w-4" />
              Chấm công Face ID
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CalendarDays} label="Ca hôm nay" value={activeShift?.name || "Chưa xếp"} helper={activeShift?.time || "Kiểm tra với quản lý ca"} tone="blue" />
        <MetricCard icon={Clock3} label="Chấm công" value={todayAttendance?.checkIn && todayAttendance.checkIn !== "-" ? todayAttendance.checkIn : "Chưa vào ca"} helper={todayAttendance?.checkOut && todayAttendance.checkOut !== "-" ? `Ra ca ${todayAttendance.checkOut}` : todayAttendance?.note || "Face ID hoặc quản lý xác nhận"} tone="emerald" />
        <MetricCard icon={CreditCard} label="Lương tháng này" value={salaryValue} helper={salaryHelper} tone="amber" />
        <MetricCard icon={Umbrella} label="Ngày phép" value={`${employee.leaveRemaining ?? 0} ngày`} helper={pendingLeaves ? `${pendingLeaves} đơn đang chờ duyệt` : "Không có đơn chờ duyệt"} tone="violet" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <section className="premium-card rounded-2xl p-5">
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-normal text-blue-700">Hôm nay</p>
                <h2 className="mt-1 text-xl font-bold tracking-normal text-slate-950">{activeShift?.name || "Chưa có ca"}</h2>
                <p className="mt-1 text-sm text-slate-500">{activeShift?.time || "Lịch ca chưa được gán cho ngày này."}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={todayAttendance?.displayStatus || todayAttendance?.status || "Reviewed"} />
                <StatusBadge status={faceEnrollment?.status || "Not submitted"} />
              </div>
            </div>

            <div className="relative z-10 mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                <p className="text-xs font-medium text-slate-500">Vào ca</p>
                <p className="mt-2 text-lg font-bold text-slate-950">{todayAttendance?.checkIn || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                <p className="text-xs font-medium text-slate-500">Ra ca</p>
                <p className="mt-2 text-lg font-bold text-slate-950">{todayAttendance?.checkOut || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                <p className="text-xs font-medium text-slate-500">Giờ tuần này</p>
                <p className="mt-2 text-lg font-bold text-slate-950">{totalHours.toFixed(1)}h</p>
              </div>
            </div>

            {missingCheckout ? (
              <div className="relative z-10 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                Có {missingCheckout} ngày thiếu check-out, chủ sở hữu cần chốt giờ ra trước khi tính lương.
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-950">Lịch làm của tôi</h2>
                <p className="text-sm text-slate-500">Các ca đã gán trong tuần.</p>
              </div>
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              {assignedSchedule.length ? (
                assignedSchedule.map((day) => (
                  <div key={day.date} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-950">{day.day}</p>
                      <span className="text-sm text-slate-500">{day.date}</span>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {day.slots.map((slot) => (
                        <div key={`${day.date}-${slot.shiftId}`} className="rounded-xl border border-blue-100 bg-white p-3">
                          <p className="font-semibold text-blue-900">{slot.shift.name}</p>
                          <p className="mt-1 text-sm text-blue-700">{slot.shift.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Chưa có ca nào được gán trong tuần này.</div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-950">Chấm công gần đây</h2>
                <p className="text-sm text-slate-500">Dữ liệu được dùng cho bảng lương.</p>
              </div>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Ngày</th>
                    <th className="py-2 pr-4">Ca</th>
                    <th className="py-2 pr-4">Vào</th>
                    <th className="py-2 pr-4">Ra</th>
                    <th className="py-2 pr-4">Giờ</th>
                    <th className="py-2">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.slice(0, 8).map((item) => (
                    <tr key={item.workDate || item.date}>
                      <td className="py-3 pr-4 font-semibold text-slate-950">{item.date}</td>
                      <td className="py-3 pr-4 text-slate-600">{item.shift}</td>
                      <td className="py-3 pr-4 text-slate-600">{item.checkIn}</td>
                      <td className="py-3 pr-4 text-slate-600">{item.checkOut}</td>
                      <td className="py-3 pr-4 text-slate-600">{item.hours}h</td>
                      <td className="py-3">
                        <StatusBadge status={item.displayStatus || item.status} />
                      </td>
                    </tr>
                  ))}
                  {!attendance.length ? (
                    <tr>
                      <td className="py-5 text-sm text-slate-500" colSpan={6}>
                        Chưa có dữ liệu chấm công.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <Avatar name={employee.name} size="lg" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-slate-950">{employee.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {employee.id} · {employee.department}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={employee.role} />
                  <StatusBadge status={employee.status} />
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <DetailItem icon={UserRound} label="Chức vụ" value={employee.position} />
              <DetailItem icon={Mail} label="Email đăng nhập" value={employee.email} />
              <DetailItem icon={Phone} label="Điện thoại" value={employee.phone} />
              <DetailItem icon={ShieldCheck} label="Face ID" value={faceStatus} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-950">Gửi đơn nghỉ phép</h2>
                <p className="text-sm text-slate-500">Còn {employee.leaveRemaining ?? 0} ngày phép.</p>
              </div>
              <Umbrella className="h-5 w-5 text-violet-600" />
            </div>
            <form onSubmit={submitLeave} className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Loại nghỉ
                <select value={leaveForm.type} onChange={(event) => setLeaveForm({ ...leaveForm, type: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
                  <option value="Annual leave">Nghỉ phép năm</option>
                  <option value="Sick leave">Nghỉ bệnh</option>
                  <option value="Unpaid leave">Nghỉ không lương</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Từ ngày
                <input type="date" value={leaveForm.from} onChange={(event) => setLeaveForm({ ...leaveForm, from: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Số ngày
                <input type="number" min="0.5" step="0.5" value={leaveForm.days} onChange={(event) => setLeaveForm({ ...leaveForm, days: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none" />
              </label>
              <label className="sm:col-span-2 text-sm font-medium text-slate-700">
                Lý do
                <textarea value={leaveForm.reason} onChange={(event) => setLeaveForm({ ...leaveForm, reason: event.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none" />
              </label>
              {leaveError ? <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{leaveError}</p> : null}
              {leaveSent ? (
                <p className="sm:col-span-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Đã gửi đơn nghỉ phép.
                </p>
              ) : null}
              <button disabled={submittingLeave} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-300">
                {submittingLeave ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submittingLeave ? "Đang gửi" : "Gửi đơn"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-950">Đơn nghỉ gần đây</h2>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{leaves.length}</span>
            </div>
            <div className="space-y-3">
              {leaves.slice(0, 4).map((leave) => (
                <div key={leave.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{leave.type}</p>
                    <StatusBadge status={leave.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {leave.from} - {leave.to} · {leave.days} ngày
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{leave.reason}</p>
                </div>
              ))}
              {!leaves.length ? <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Chưa có đơn nghỉ phép.</div> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-950">Thông báo</h2>
              <Bell className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              {notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-950">{notification.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{notification.body}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-400">{notification.time}</p>
                </div>
              ))}
              {!notifications.length ? <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Chưa có thông báo mới.</div> : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

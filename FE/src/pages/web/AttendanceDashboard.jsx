import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Filter, MapPin, Search, ShieldAlert } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";

const statusOptions = ["All", "Present", "Late", "Absent", "Leave", "Overtime", "Missing checkout"];
const pieColors = ["#2563eb", "#f59e0b", "#ef4444", "#6d5dfc", "#10b981", "#d97706"];

function toMinutes(time) {
  const match = /^(\d{2}):(\d{2})$/.exec(time || "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function calculateHours(checkIn, checkOut) {
  const start = toMinutes(checkIn);
  const end = toMinutes(checkOut);
  if (start === null || end === null) return 0;
  const adjustedEnd = end < start ? end + 24 * 60 : end;
  return Math.round(((adjustedEnd - start) / 60) * 100) / 100;
}

function resolveShiftEnd(shiftTime) {
  const match = /(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/.exec(shiftTime || "");
  return match?.[2] || "";
}

function formatDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default function AttendanceDashboard() {
  const [attendance, setAttendance] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(formatDateInput());
  const [exportOpen, setExportOpen] = useState(false);
  const [checkoutRecord, setCheckoutRecord] = useState(null);
  const [checkoutTime, setCheckoutTime] = useState("");
  const [closingCheckout, setClosingCheckout] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");

  useEffect(() => {
    Promise.all([bizenApi.attendance(selectedDate), bizenApi.departments(), bizenApi.dashboardCharts()]).then(([attendanceRows, departmentRows, chartRows]) => {
      setAttendance(attendanceRows);
      setDepartments(departmentRows);
      setWeeklyAttendance(chartRows.weeklyAttendance || []);
    });
  }, [selectedDate]);

  const rows = useMemo(() => {
    return attendance.filter((record) => {
        const matchesDepartment = department === "All" || record.department === department;
        const matchesStatus = status === "All" || (status === "Missing checkout" ? record.needsCheckoutReview : record.status === status);
        const matchesQuery = [record.employeeName, record.employeeId].join(" ").toLowerCase().includes(query.toLowerCase());
        return matchesDepartment && matchesStatus && matchesQuery;
      });
  }, [attendance, department, status, query]);

  const summary = statusOptions
    .filter((item) => item !== "All")
    .map((item) => ({
      name: item,
      value: attendance.filter((record) => (item === "Missing checkout" ? record.needsCheckoutReview : record.status === item)).length
    }));
  const missingCheckout = attendance.filter((record) => record.needsCheckoutReview);

  async function reloadAttendance() {
    const attendanceRows = await bizenApi.attendance(selectedDate);
    setAttendance(attendanceRows);
  }

  function openCheckoutModal(record) {
    setCheckoutRecord(record);
    setCheckoutTime(resolveShiftEnd(record.shiftTime) || "17:00");
    setCheckoutMessage("");
  }

  async function closeCheckout() {
    if (!checkoutRecord || !checkoutTime) return;
    setClosingCheckout(true);
    setCheckoutMessage("");
    try {
      const totalHours = calculateHours(checkoutRecord.checkIn, checkoutTime);
      await bizenApi.upsertAttendance({
        employeeId: checkoutRecord.employeeId,
        workDate: checkoutRecord.workDate || selectedDate,
        checkIn: checkoutRecord.checkIn,
        checkOut: checkoutTime,
        totalHours,
        status: checkoutRecord.status,
        location: checkoutRecord.location,
        note: "Admin/HR chốt giờ ra thủ công do nhân viên quên check-out"
      });
      await reloadAttendance();
      setCheckoutMessage("Đã chốt giờ ra. Bản ghi này có thể đưa vào payroll.");
      window.setTimeout(() => {
        setCheckoutRecord(null);
        setCheckoutMessage("");
      }, 700);
    } catch (err) {
      setCheckoutMessage(err.message || "Không chốt được giờ ra.");
    } finally {
      setClosingCheckout(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Attendance Tracking"
        title={`Bảng chấm công ngày ${formatDisplayDate(selectedDate)}`}
        description="Theo dõi check-in, check-out, GPS, tổng giờ làm và trạng thái trong ngày."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none"
            />
            <button onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              <Download className="h-4 w-4" />
              Xuất báo cáo
            </button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Present" value={attendance.filter((item) => item.status === "Present").length} helper="đúng giờ" tone="emerald" />
        <StatCard title="Late" value={attendance.filter((item) => item.status === "Late").length} helper="đi trễ" tone="amber" />
        <StatCard title="Absent" value={attendance.filter((item) => item.status === "Absent").length} helper="vắng" tone="rose" />
        <StatCard title="Leave" value={attendance.filter((item) => item.status === "Leave").length} helper="nghỉ phép" tone="violet" />
        <StatCard title="Overtime" value={attendance.filter((item) => item.status === "Overtime").length} helper="tăng ca" tone="blue" />
        <StatCard title="Quên check-out" value={missingCheckout.length} helper="cần Admin/HR chốt" tone="amber" />
      </div>

      {missingCheckout.length ? (
        <div className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Có {missingCheckout.length} nhân viên thiếu check-out</p>
            <p className="mt-1 text-sm">Admin/HR cần chốt giờ ra trước khi tính lương. Payroll sẽ bị chặn nếu còn bản ghi thiếu check-out.</p>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Tỷ lệ trạng thái</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={2}>
                  {summary.map((_, index) => (
                    <Cell key={index} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {summary.map((item, index) => (
              <span key={item.name} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: pieColors[index % pieColors.length] }} />
                {item.name}: {item.value}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Xu hướng tuần</h2>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="present" fill="#2563eb" radius={[6, 6, 0, 0]} name="Present" />
                <Bar dataKey="late" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Late" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_180px]">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm nhân viên" className="w-full text-sm outline-none" />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={department} onChange={(event) => setDepartment(event.target.value)} className="w-full bg-white text-sm outline-none">
              <option value="All">Tất cả bộ phận</option>
              {departments.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            {statusOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <EmptyState title="Không có bản ghi chấm công" description="Bộ lọc hiện tại không trả về dữ liệu." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Vào</th>
                  <th className="px-4 py-3">Ra</th>
                  <th className="px-4 py-3">Giờ làm</th>
                  <th className="px-4 py-3">GPS</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((record) => (
                  <tr key={record.employeeId} className={record.needsCheckoutReview ? "bg-amber-50/55 hover:bg-amber-50" : "hover:bg-slate-50"}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={record.employeeName} />
                        <div>
                          <p className="font-semibold text-slate-950">{record.employeeName}</p>
                          <p className="text-xs text-slate-500">{record.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{record.checkIn}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.needsCheckoutReview ? (
                        <button
                          type="button"
                          onClick={() => openCheckoutModal(record)}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-200"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Chốt giờ ra
                        </button>
                      ) : (
                        record.checkOut
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{record.totalHours}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {record.location}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={record.displayStatus || record.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{record.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(checkoutRecord)}
        title="Chốt giờ ra thủ công"
        onClose={() => setCheckoutRecord(null)}
        footer={
          <>
            <button onClick={() => setCheckoutRecord(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Đóng
            </button>
            <button onClick={closeCheckout} disabled={closingCheckout || !checkoutTime} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-slate-300">
              {closingCheckout ? "Đang chốt..." : "Chốt giờ ra"}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            {checkoutRecord?.employeeName} đã check-in lúc <span className="font-semibold text-slate-950">{checkoutRecord?.checkIn}</span> nhưng chưa check-out.
            Hãy xác nhận giờ ra thực tế hoặc dùng giờ kết thúc ca mặc định.
          </p>
          <label className="block text-sm font-semibold text-slate-700">
            Giờ ra xác nhận
            <input
              type="time"
              value={checkoutTime}
              onChange={(event) => setCheckoutTime(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </label>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
            Tổng giờ dự kiến: {calculateHours(checkoutRecord?.checkIn, checkoutTime)}h. Bản ghi sẽ được gắn note Admin/HR chốt thủ công.
          </p>
          {checkoutMessage ? <p className="rounded-lg bg-slate-50 px-3 py-2 font-semibold text-slate-700">{checkoutMessage}</p> : null}
        </div>
      </Modal>

      <Modal
        open={exportOpen}
        title="Xuất báo cáo chấm công"
        onClose={() => setExportOpen(false)}
        footer={<button onClick={() => setExportOpen(false)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Đã hiểu</button>}
      >
        <p className="text-sm text-slate-600">Báo cáo ngày {formatDisplayDate(selectedDate)} đã sẵn sàng. Dữ liệu gồm {rows.length} bản ghi theo bộ lọc hiện tại.</p>
      </Modal>
    </div>
  );
}

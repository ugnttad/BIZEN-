import { useEffect, useMemo, useState } from "react";
import { Download, Filter, MapPin, Search, ShieldAlert } from "lucide-react";
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

const statusOptions = ["All", "Present", "Late", "Absent", "Leave", "Overtime"];
const pieColors = ["#2563eb", "#f59e0b", "#ef4444", "#6d5dfc", "#10b981"];

export default function AttendanceDashboard() {
  const [attendance, setAttendance] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    Promise.all([bizenApi.attendance(), bizenApi.departments(), bizenApi.dashboardCharts()]).then(([attendanceRows, departmentRows, chartRows]) => {
      setAttendance(attendanceRows);
      setDepartments(departmentRows);
      setWeeklyAttendance(chartRows.weeklyAttendance || []);
    });
  }, []);

  const rows = useMemo(() => {
    return attendance.filter((record) => {
        const matchesDepartment = department === "All" || record.department === department;
        const matchesStatus = status === "All" || record.status === status;
        const matchesQuery = [record.employeeName, record.employeeId].join(" ").toLowerCase().includes(query.toLowerCase());
        return matchesDepartment && matchesStatus && matchesQuery;
      });
  }, [attendance, department, status, query]);

  const summary = statusOptions
    .filter((item) => item !== "All")
    .map((item) => ({
      name: item,
      value: attendance.filter((record) => record.status === item).length
    }));
  const missingCheckout = attendance.filter((record) => record.note?.includes("Thiếu check-out"));

  return (
    <div>
      <PageHeader
        eyebrow="Attendance Tracking"
        title="Bảng chấm công ngày 20/05/2026"
        description="Theo dõi check-in, check-out, GPS, tổng giờ làm và trạng thái trong ngày."
        actions={
          <button onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Present" value={attendance.filter((item) => item.status === "Present").length} helper="đúng giờ" tone="emerald" />
        <StatCard title="Late" value={attendance.filter((item) => item.status === "Late").length} helper="đi trễ" tone="amber" />
        <StatCard title="Absent" value={attendance.filter((item) => item.status === "Absent").length} helper="vắng" tone="rose" />
        <StatCard title="Leave" value={attendance.filter((item) => item.status === "Leave").length} helper="nghỉ phép" tone="violet" />
        <StatCard title="Overtime" value={attendance.filter((item) => item.status === "Overtime").length} helper="tăng ca" tone="blue" />
      </div>

      {missingCheckout.length ? (
        <div className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Có {missingCheckout.length} nhân viên thiếu check-out</p>
            <p className="mt-1 text-sm">HR cần xác minh trước khi khóa bảng công ngày.</p>
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
              <option value="All">Tất cả phòng ban</option>
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
                  <tr key={record.employeeId} className="hover:bg-slate-50">
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
                    <td className="px-4 py-3 text-slate-600">{record.checkOut}</td>
                    <td className="px-4 py-3 text-slate-600">{record.totalHours}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {record.location}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={record.status} />
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
        open={exportOpen}
        title="Xuất báo cáo chấm công"
        onClose={() => setExportOpen(false)}
        footer={<button onClick={() => setExportOpen(false)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Đã hiểu</button>}
      >
        <p className="text-sm text-slate-600">Báo cáo ngày 20/05/2026 đã được tạo trong prototype. Dữ liệu gồm {rows.length} bản ghi theo bộ lọc hiện tại.</p>
      </Modal>
    </div>
  );
}

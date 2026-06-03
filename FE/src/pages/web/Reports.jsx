import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { downloadCsv } from "../../lib/csv";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";
import { Download } from "lucide-react";

const chartColors = ["#2563eb", "#6d5dfc", "#0891b2", "#10b981", "#f59e0b"];

function formatMonthPeriod(date = new Date()) {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export default function Reports() {
  const [summary, setSummary] = useState({ onTimeRate: 0, totalOt: 0, totalPayroll: 0, leaveRate: 0 });
  const [lateData, setLateData] = useState([]);
  const [overtimeData, setOvertimeData] = useState([]);
  const [leavePie, setLeavePie] = useState([]);
  const [payrollTrend, setPayrollTrend] = useState([]);
  const [departmentPerformance, setDepartmentPerformance] = useState([]);
  const [error, setError] = useState("");
  const monthPeriod = formatMonthPeriod();

  useEffect(() => {
    bizenApi
      .reports()
      .then((report) => {
        setSummary(report.summary || {});
        setLateData(report.lateData || []);
        setOvertimeData(report.overtimeData || []);
        setLeavePie(report.leavePie || []);
        setPayrollTrend(report.payrollTrend || []);
        setDepartmentPerformance(report.departmentPerformance || []);
      })
      .catch((requestError) => setError(requestError.message || "Không tải được báo cáo từ Neon."));
  }, []);

  function exportReportCsv() {
    downloadCsv("bizen-bao-cao-nhan-su.csv", [
      ["Báo cáo nhân sự BIZEN"],
      [],
      ["Chỉ số", "Giá trị"],
      ["Tỷ lệ đúng giờ", `${summary.onTimeRate || 0}%`],
      ["Tổng giờ OT", summary.totalOt || 0],
      ["Tiền OT", summary.totalOtPay || 0],
      ["Chi phí lương", summary.totalPayroll || 0],
      ["Tỷ lệ nghỉ phép", `${summary.leaveRate || 0}%`],
      [],
      ["Top đi trễ"],
      ["Nhân viên", "Số lần đi trễ"],
      ...lateData.map((item) => [item.name, item.late]),
      [],
      ["OT theo bộ phận"],
      ["Bộ phận", "Giờ OT"],
      ...overtimeData.map((item) => [item.department, item.hours]),
      [],
      ["Lương theo tháng"],
      ["Tháng", "Lương", "OT"],
      ...payrollTrend.map((item) => [item.month, item.payroll, item.overtime])
    ]);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Reports & Analytics"
        title="Báo cáo nhân sự"
        description="Tỷ lệ đúng giờ, nhân viên đi trễ, OT, chi phí lương, nghỉ phép và hiệu suất bộ phận từ dữ liệu Neon."
        actions={
          <button onClick={exportReportCsv} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <Download className="h-4 w-4" />
            Tải CSV
          </button>
        }
      />

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Đúng giờ" value={`${summary.onTimeRate || 0}%`} helper="trong ngày" tone="emerald" />
        <StatCard title="Tổng giờ OT" value={`${summary.totalOt || 0}h`} helper={`tháng ${monthPeriod}`} tone="violet" />
        <StatCard title="Chi phí lương" value={formatCurrency(summary.totalPayroll || 0)} helper="dự kiến" tone="blue" />
        <StatCard title="Tỷ lệ nghỉ phép" value={`${summary.leaveRate || 0}%`} helper="toàn công ty" tone="amber" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Top nhân viên đi trễ</h2>
          {lateData.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu đi trễ" description="Neon chưa có bản ghi Late cho kỳ hiện tại." />
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lateData} layout="vertical" margin={{ left: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={110} />
                  <Tooltip />
                  <Bar dataKey="late" fill="#f59e0b" radius={[0, 8, 8, 0]} name="Lần đi trễ" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Chi phí lương theo tháng</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payrollTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000000)}tr`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line dataKey="payroll" type="monotone" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} name="Payroll" />
                <Line dataKey="overtime" type="monotone" stroke="#6d5dfc" strokeWidth={2} dot={{ r: 3 }} name="OT" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Tổng giờ tăng ca theo bộ phận</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overtimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="department" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="hours" name="Giờ OT" radius={[8, 8, 0, 0]}>
                  {overtimeData.map((_, index) => (
                    <Cell key={index} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Nghỉ phép và hiệu suất</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leavePie} dataKey="value" innerRadius={48} outerRadius={84} paddingAngle={2}>
                    <Cell fill="#2563eb" />
                    <Cell fill="#dbeafe" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={departmentPerformance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <Radar dataKey="productivity" stroke="#6d5dfc" fill="#6d5dfc" fillOpacity={0.24} name="Hiệu suất" />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

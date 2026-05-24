import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Sparkles,
  TrendingUp,
  UserCheck,
  UsersRound
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";

const colors = ["#2563eb", "#6d5dfc", "#0891b2", "#10b981", "#f59e0b"];
const tooltipStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  boxShadow: "0 18px 55px rgba(15, 23, 42, 0.12)"
};

function formatDisplayDate(date = new Date()) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState({ employees: 0, checkedIn: 0, late: 0, leave: 0, payrollTotal: 0, departments: [], aiAlerts: [] });
  const [charts, setCharts] = useState({ weeklyAttendance: [], payrollTrend: [] });

  useEffect(() => {
    Promise.all([bizenApi.dashboardSummary(), bizenApi.dashboardCharts()]).then(([summaryData, chartsData]) => {
      setSummary(summaryData);
      setCharts(chartsData);
    });
  }, []);

  const payrollShort = `${Math.round((summary.payrollTotal || 0) / 1000000)} triệu`;
  const attendanceRate = summary.employees ? Math.round((summary.checkedIn / summary.employees) * 100) : 0;
  const alertCount = summary.aiAlerts.length;
  const departmentHeadcount = summary.departments.map((item, index) => ({
    ...item,
    productivity: [88, 92, 84, 89, 86][index] || 85,
    leaveRate: [5, 3, 4, 6, 5][index] || 4
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Owner Dashboard"
        title="Tổng quan vận hành hôm nay"
        description={`Dữ liệu vận hành ngày ${formatDisplayDate()} cho doanh nghiệp SME tại Đà Nẵng.`}
        actions={
          <button className="btn-motion rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/10 hover:bg-blue-600">
            Xuất báo cáo nhanh
          </button>
        }
      />

      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        <div className="premium-card rounded-2xl p-4">
          <div className="relative z-10 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Attendance health</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{attendanceRate}% nhân sự đã check-in hôm nay</p>
            </div>
          </div>
        </div>
        <div className="premium-card rounded-2xl p-4">
          <div className="relative z-10 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-normal text-slate-500">AI signal</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{alertCount} cảnh báo cần chủ sở hữu xem nhanh</p>
            </div>
          </div>
        </div>
        <div className="premium-card rounded-2xl p-4">
          <div className="relative z-10 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Payroll pulse</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">Dự kiến {payrollShort} cho kỳ tháng 05/2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Tổng nhân viên" value={summary.employees} helper={`${departmentHeadcount.length} bộ phận`} icon={UsersRound} tone="blue" trend="+2" />
        <StatCard title="Đã chấm công" value={summary.checkedIn} helper="người hôm nay" icon={UserCheck} tone="emerald" trend="+4%" />
        <StatCard title="Đi trễ" value={summary.late} helper="cần chủ sở hữu nhắc" icon={Clock3} tone="amber" trend="+1" />
        <StatCard title="Nghỉ phép" value={summary.leave} helper="đã duyệt" icon={CalendarDays} tone="violet" />
        <StatCard title="Lương dự kiến" value={payrollShort} helper="tháng 05/2026" icon={CreditCard} tone="rose" trend="+3.9%" />
      </div>

      <div className="mt-5 grid gap-5 2xl:grid-cols-[1.2fr_0.8fr]">
        <section className="premium-card rounded-2xl p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Chấm công theo tuần</h2>
              <p className="text-sm text-slate-500">Present, late, leave và absent</p>
            </div>
            <StatusBadge status="Late" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.weeklyAttendance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} />
                <Bar dataKey="present" stackId="a" fill="#2563eb" radius={[8, 8, 0, 0]} name="Đúng giờ" />
                <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Đi trễ" />
                <Bar dataKey="leave" stackId="a" fill="#6d5dfc" name="Nghỉ phép" />
                <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Vắng" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="premium-card rounded-2xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Chi phí lương</h2>
              <p className="text-sm text-slate-500">Payroll và OT theo tháng</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.payrollTrend}>
                <defs>
                  <linearGradient id="payrollFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000000}tr`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="payroll" stroke="#2563eb" strokeWidth={3} fill="url(#payrollFill)" name="Lương" />
                <Area type="monotone" dataKey="overtime" stroke="#6d5dfc" strokeWidth={2} fill="transparent" name="OT" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="premium-card rounded-2xl p-4">
          <h2 className="text-base font-semibold text-slate-950">Cảnh báo AI</h2>
          <div className="mt-4 space-y-3">
            {summary.aiAlerts.map((alert) => (
              <div key={alert.id} className="motion-card flex gap-3 rounded-xl border border-slate-200 bg-white/70 p-3 hover:border-blue-200">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${alert.type === "danger" ? "bg-rose-50 text-rose-600" : alert.type === "warning" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{alert.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{alert.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-card rounded-2xl p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-950">Nhân sự theo bộ phận</h2>
            <p className="text-sm text-slate-500">Headcount và hiệu suất dự kiến</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentHeadcount} layout="vertical" margin={{ left: 32 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="department" axisLine={false} tickLine={false} width={92} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(15, 23, 42, 0.04)" }} />
                <Bar dataKey="employees" name="Nhân viên" radius={[0, 8, 8, 0]}>
                  {departmentHeadcount.map((_, index) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

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
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";

const lateData = [
  { name: "Quốc Bảo", late: 4 },
  { name: "Bảo Châu", late: 3 },
  { name: "Thanh Đạt", late: 3 },
  { name: "Gia Huy", late: 2 },
  { name: "Văn Lộc", late: 2 }
];

const overtimeData = [
  { department: "Sales", hours: 18 },
  { department: "HR", hours: 4 },
  { department: "Warehouse", hours: 22 },
  { department: "Admin", hours: 8 },
  { department: "Support", hours: 31 }
];

const leavePie = [
  { name: "Đã dùng", value: 28 },
  { name: "Còn lại", value: 142 }
];

export default function Reports() {
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [payrollRows, setPayrollRows] = useState([]);
  const [payrollTrend, setPayrollTrend] = useState([]);
  const [departmentHeadcount, setDepartmentHeadcount] = useState([]);

  useEffect(() => {
    Promise.all([bizenApi.attendance(), bizenApi.payroll(), bizenApi.dashboardCharts(), bizenApi.dashboardSummary()]).then(([attendance, payroll, charts, summary]) => {
      setAttendanceRows(attendance);
      setPayrollRows(payroll);
      setPayrollTrend(charts.payrollTrend || []);
      setDepartmentHeadcount((summary.departments || []).map((item) => ({ ...item, productivity: 85 + Math.min(item.employees, 7), leaveRate: 5 })));
    });
  }, []);

  const onTimeRate = attendanceRows.length
    ? Math.round((attendanceRows.filter((item) => item.status === "Present" || item.status === "Overtime").length / attendanceRows.length) * 100)
    : 0;
  const totalOt = payrollRows.reduce((sum, item) => sum + item.overtimeHours, 0);
  const totalPayroll = payrollRows.reduce((sum, item) => sum + item.finalSalary, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Reports & Analytics"
        title="Báo cáo nhân sự"
        description="Tỷ lệ đúng giờ, nhân viên đi trễ, OT, chi phí lương, nghỉ phép và hiệu suất phòng ban."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Đúng giờ" value={`${onTimeRate}%`} helper="trong ngày" tone="emerald" />
        <StatCard title="Tổng giờ OT" value={`${totalOt}h`} helper="tháng 05/2026" tone="violet" />
        <StatCard title="Chi phí lương" value={formatCurrency(totalPayroll)} helper="dự kiến" tone="blue" />
        <StatCard title="Tỷ lệ nghỉ phép" value="5.2%" helper="toàn công ty" tone="amber" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Top nhân viên đi trễ</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lateData} layout="vertical" margin={{ left: 28 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={82} />
                <Tooltip />
                <Bar dataKey="late" fill="#f59e0b" radius={[0, 8, 8, 0]} name="Lần đi trễ" />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
          <h2 className="text-base font-semibold text-slate-950">Tổng giờ tăng ca</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overtimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="department" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="hours" name="Giờ OT" radius={[8, 8, 0, 0]}>
                  {overtimeData.map((_, index) => (
                    <Cell key={index} fill={["#2563eb", "#6d5dfc", "#0891b2", "#10b981", "#f59e0b"][index]} />
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
                <RadarChart data={departmentHeadcount}>
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

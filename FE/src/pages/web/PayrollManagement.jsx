import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, CheckCircle2, Download, Filter, Search } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";

const statusOptions = ["All", "Draft", "Reviewed", "Approved", "Paid"];

export default function PayrollManagement() {
  const [payrollRows, setPayrollRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [payrollTrend, setPayrollTrend] = useState([]);
  const [status, setStatus] = useState("All");
  const [department, setDepartment] = useState("All");
  const [query, setQuery] = useState("");
  const [calculateOpen, setCalculateOpen] = useState(false);

  useEffect(() => {
    Promise.all([bizenApi.payroll(), bizenApi.departments(), bizenApi.dashboardCharts()]).then(([payrollData, departmentData, chartData]) => {
      setPayrollRows(payrollData);
      setDepartments(departmentData);
      setPayrollTrend(chartData.payrollTrend || []);
    });
  }, []);

  const rows = useMemo(() => {
    return payrollRows
      .filter((row) => {
        const matchesStatus = status === "All" || row.status === status;
        const matchesDepartment = department === "All" || row.department === department;
        const matchesQuery = [row.employeeName, row.employeeId].join(" ").toLowerCase().includes(query.toLowerCase());
        return matchesStatus && matchesDepartment && matchesQuery;
      });
  }, [payrollRows, status, department, query]);

  const total = payrollRows.reduce((sum, row) => sum + row.finalSalary, 0);
  const overtime = payrollRows.reduce((sum, row) => sum + row.overtimePay, 0);
  const deduction = payrollRows.reduce((sum, row) => sum + row.deduction, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Payroll Automation"
        title="Bảng lương tháng 05/2026"
        description="Tự động tổng hợp ngày công, OT, đi trễ, thưởng phạt và lương cuối kỳ."
        actions={
          <>
            <button onClick={() => setCalculateOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <Calculator className="h-4 w-4" />
              Tính lương
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              <Download className="h-4 w-4" />
              Xuất file
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng lương dự kiến" value={formatCurrency(total)} helper="20 nhân viên" tone="blue" />
        <StatCard title="OT tháng này" value={formatCurrency(overtime)} helper="từ giờ tăng ca" tone="violet" />
        <StatCard title="Khấu trừ" value={formatCurrency(deduction)} helper="đi trễ, nghỉ không phép" tone="rose" />
        <StatCard title="Đã trả" value={payrollRows.filter((row) => row.status === "Paid").length} helper="bảng lương" tone="emerald" />
      </div>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Chi phí lương theo tháng</h2>
            <p className="text-sm text-slate-500">Đường chi phí payroll và overtime.</p>
          </div>
          <StatusBadge status="Reviewed" />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={payrollTrend}>
              <defs>
                <linearGradient id="salaryArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000000)}tr`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Area dataKey="payroll" type="monotone" stroke="#2563eb" strokeWidth={3} fill="url(#salaryArea)" name="Payroll" />
              <Area dataKey="overtime" type="monotone" stroke="#6d5dfc" strokeWidth={2} fill="transparent" name="OT" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

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
          <EmptyState title="Không có bảng lương" description="Bộ lọc hiện tại không có dữ liệu payroll." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Ngày công</th>
                  <th className="px-4 py-3">OT</th>
                  <th className="px-4 py-3">Thưởng</th>
                  <th className="px-4 py-3">Khấu trừ</th>
                  <th className="px-4 py-3">Final salary</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.employeeId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/web/payroll/${row.employeeId}`} className="flex items-center gap-3">
                        <Avatar name={row.employeeName} />
                        <span>
                          <span className="block font-semibold text-slate-950">{row.employeeName}</span>
                          <span className="text-xs text-slate-500">{row.department}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.workingDays}</td>
                    <td className="px-4 py-3 text-slate-600">{row.overtimeHours}h</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(row.bonus)}</td>
                    <td className="px-4 py-3 text-rose-600">{formatCurrency(row.deduction)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-950">{formatCurrency(row.finalSalary)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={calculateOpen}
        title="Tính lương tự động"
        onClose={() => setCalculateOpen(false)}
        footer={<button onClick={() => setCalculateOpen(false)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Hoàn tất</button>}
      >
        <div className="flex gap-3 text-sm text-slate-600">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p>Payroll tháng 05/2026 đã đồng bộ từ chấm công, OT, nghỉ phép và cấu hình công thức lương.</p>
        </div>
      </Modal>
    </div>
  );
}

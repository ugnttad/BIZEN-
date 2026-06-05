import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, Download, Filter, Plus, ReceiptText, Search, Trash2 } from "lucide-react";
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
import { downloadCsv } from "../../lib/csv";
import { formatCurrency, getCurrentPayrollMonth } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";

const statusOptions = ["All", "Draft", "Reviewed", "Approved", "Paid"];
const adjustmentCategories = ["Phụ cấp", "Thưởng", "Tạm ứng", "Phạt", "Hoàn ứng", "Chi phí khác"];

const emptyAdjustmentForm = {
  employeeId: "",
  kind: "Addition",
  category: "Phụ cấp",
  amount: "",
  note: ""
};

function isHourlyPayroll(row) {
  return row.payType === "Hourly";
}

function getPayTypeLabel(row) {
  return isHourlyPayroll(row) ? "Theo giờ" : "Theo tháng";
}

function getPayRateLabel(row) {
  return isHourlyPayroll(row) ? `${formatCurrency(row.hourlyRate || 0)}/giờ` : `${formatCurrency(row.baseSalary || 0)}/tháng`;
}

function getWorkUnitLabel(row) {
  return isHourlyPayroll(row) ? `${row.totalHours || 0}h` : `${row.workingDays}/22`;
}

export default function PayrollManagement() {
  const [payrollRows, setPayrollRows] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [payrollTrend, setPayrollTrend] = useState([]);
  const [status, setStatus] = useState("All");
  const [department, setDepartment] = useState("All");
  const [query, setQuery] = useState("");
  const [calculateOpen, setCalculateOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState(emptyAdjustmentForm);
  const [savingAdjustment, setSavingAdjustment] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculateMessage, setCalculateMessage] = useState("");
  const [adjustmentMessage, setAdjustmentMessage] = useState("");
  const payrollMonth = getCurrentPayrollMonth();

  async function loadPayrollData() {
    const [payrollData, adjustmentData, departmentData, chartData] = await Promise.all([
      bizenApi.payroll(payrollMonth),
      bizenApi.payrollAdjustments(payrollMonth),
      bizenApi.departments(),
      bizenApi.dashboardCharts()
    ]);
    setPayrollRows(payrollData);
    setAdjustments(adjustmentData);
    setDepartments(departmentData);
    setPayrollTrend(chartData.payrollTrend || []);
    setAdjustmentForm((current) => ({
      ...current,
      employeeId: current.employeeId || payrollData[0]?.employeeId || ""
    }));
  }

  useEffect(() => {
    loadPayrollData().catch(() => {
      setPayrollRows([]);
      setAdjustments([]);
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
  const insurance = payrollRows.reduce((sum, row) => sum + (row.insuranceDeduction || 0), 0);
  const deduction = payrollRows.reduce((sum, row) => sum + row.deduction, 0);
  const manualAddition = adjustments.filter((item) => item.kind === "Addition").reduce((sum, item) => sum + item.amount, 0);
  const manualDeduction = adjustments.filter((item) => item.kind === "Deduction").reduce((sum, item) => sum + item.amount, 0);

  async function runCalculatePayroll() {
    setCalculating(true);
    setCalculateMessage("");
    try {
      const result = await bizenApi.calculatePayroll(payrollMonth);
      setPayrollRows(result.items || []);
      setCalculateMessage(`Đã tính lương cho ${result.updated} nhân viên, gồm bảo hiểm và các khoản chi phí lương đã nhập.`);
    } catch (err) {
      setCalculateMessage(err.message || "Không tính được lương.");
    } finally {
      setCalculating(false);
    }
  }

  async function saveAdjustment(event) {
    event.preventDefault();
    setSavingAdjustment(true);
    setAdjustmentMessage("");
    try {
      await bizenApi.createPayrollAdjustment({
        ...adjustmentForm,
        month: payrollMonth,
        amount: Number(adjustmentForm.amount)
      });
      setAdjustmentForm({ ...emptyAdjustmentForm, employeeId: adjustmentForm.employeeId });
      setAdjustmentMessage("Đã lưu khoản chi phí. Bấm Tính lương để áp dụng vào bảng lương chính thức.");
      await loadPayrollData();
    } catch (err) {
      setAdjustmentMessage(err.message || "Không lưu được khoản chi phí lương.");
    } finally {
      setSavingAdjustment(false);
    }
  }

  async function deleteAdjustment(id) {
    await bizenApi.deletePayrollAdjustment(id);
    await loadPayrollData();
  }

  function exportPayrollCsv() {
    downloadCsv(`bizen-bang-luong-${payrollMonth.replace("/", "-")}.csv`, [
      ["Bảng lương BIZEN", payrollMonth],
      [],
      ["Nhân viên", "Mã NV", "Bộ phận", "Cách tính", "Mức lương", "Ngày công", "Tổng giờ", "OT giờ", "OT tiền", "Khoản cộng", "Khoản trừ", "Bảo hiểm NLĐ", "Khấu trừ", "Thực lĩnh", "Trạng thái"],
      ...rows.map((row) => [
        row.employeeName,
        row.employeeId,
        row.department,
        getPayTypeLabel(row),
        getPayRateLabel(row),
        row.workingDays,
        row.totalHours || 0,
        row.overtimeHours,
        row.overtimePay,
        row.bonus,
        row.manualDeduction || 0,
        row.insuranceDeduction || 0,
        row.deduction,
        row.finalSalary,
        row.status
      ])
    ]);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Tính lương"
        title={`Bảng lương tháng ${payrollMonth}`}
        description="Gộp ngày công/tổng giờ, tăng ca, thưởng, khấu trừ và bảo hiểm cho nhân viên toàn thời gian."
        actions={
          <>
            <button onClick={() => setAdjustmentOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              <Plus className="h-4 w-4" />
              Nhập chi phí
            </button>
            <button onClick={() => setCalculateOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <Calculator className="h-4 w-4" />
              Tính lương
            </button>
            <button onClick={exportPayrollCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              <Download className="h-4 w-4" />
              Xuất file
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Tổng lương dự kiến" value={formatCurrency(total)} helper={`${payrollRows.length} nhân viên`} tone="blue" />
        <StatCard title="OT tháng này" value={formatCurrency(overtime)} helper="từ giờ tăng ca" tone="violet" />
        <StatCard title="Bảo hiểm NLĐ" value={formatCurrency(insurance)} helper="BHXH + BHYT + BHTN" tone="rose" />
        <StatCard title="Tổng khấu trừ" value={formatCurrency(deduction)} helper="BH + phạt trễ" tone="amber" />
        <StatCard title="Đã trả" value={payrollRows.filter((row) => row.status === "Paid").length} helper="bảng lương" tone="emerald" />
      </div>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <ReceiptText className="h-5 w-5 text-blue-600" />
              Chi phí/điều chỉnh lương
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Khoản quản lý nhập tay cho tháng {payrollMonth}: cộng {formatCurrency(manualAddition)} · trừ {formatCurrency(manualDeduction)}.
            </p>
          </div>
          <button onClick={() => setAdjustmentOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" />
            Thêm khoản
          </button>
        </div>

        {adjustmentMessage ? <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{adjustmentMessage}</p> : null}

        {adjustments.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Nhân viên</th>
                  <th className="py-2 pr-3">Loại</th>
                  <th className="py-2 pr-3">Danh mục</th>
                  <th className="py-2 pr-3">Số tiền</th>
                  <th className="py-2 pr-3">Ghi chú</th>
                  <th className="py-2 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-slate-950">{item.employeeName}</p>
                      <p className="text-xs text-slate-500">{item.department}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.kind === "Addition" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {item.kind === "Addition" ? "Cộng" : "Trừ"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-slate-600">{item.category}</td>
                    <td className={`py-3 pr-3 font-semibold ${item.kind === "Addition" ? "text-emerald-700" : "text-rose-700"}`}>{formatCurrency(item.amount)}</td>
                    <td className="max-w-xs truncate py-3 pr-3 text-slate-500">{item.note || "-"}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => deleteAdjustment(item.id)} className="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50" aria-label="Xóa chi phí lương">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            Chưa có khoản phụ cấp, thưởng, tạm ứng hoặc khấu trừ nhập tay cho tháng này.
          </p>
        )}
      </section>

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
          <EmptyState title="Không có bảng lương" description="Bộ lọc hiện tại không có dữ liệu payroll." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Cách tính</th>
                  <th className="px-4 py-3">Công/giờ</th>
                  <th className="px-4 py-3">OT</th>
                  <th className="px-4 py-3">Khoản cộng</th>
                  <th className="px-4 py-3">Khoản trừ</th>
                  <th className="px-4 py-3">BH (8+1,5+1%)</th>
                  <th className="px-4 py-3">Thực lĩnh</th>
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
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{getPayTypeLabel(row)}</p>
                      <p className="text-xs text-slate-500">{getPayRateLabel(row)}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{getWorkUnitLabel(row)}</td>
                    <td className="px-4 py-3 text-slate-600">{row.overtimeHours}h</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">+{formatCurrency(row.bonus || 0)}</td>
                    <td className="px-4 py-3 font-semibold text-rose-700">-{formatCurrency(row.manualDeduction || 0)}</td>
                    <td className="px-4 py-3 text-rose-600">{formatCurrency(row.insuranceDeduction || 0)}</td>
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
        footer={
          <>
            <button onClick={() => setCalculateOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Đóng
            </button>
            <button onClick={runCalculatePayroll} disabled={calculating} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">
              {calculating ? "Đang tính…" : "Tính lương ngay"}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>Hệ thống lấy ngày công từ chấm công, tính lương gross rồi trừ:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>BHXH người lao động: 8%</li>
            <li>BHYT: 1,5%</li>
            <li>BHTN: 1%</li>
            <li>Phạt đi trễ: 50.000đ/lần (ước tính)</li>
            <li>Các khoản cộng/trừ do quản lý nhập trong mục Chi phí/điều chỉnh lương</li>
          </ul>
          {calculateMessage ? (
            <p className={`rounded-lg px-3 py-2 font-medium ${calculateMessage.startsWith("Chưa thể") || calculateMessage.startsWith("Không") ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
              {calculateMessage}
            </p>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={adjustmentOpen}
        title="Nhập chi phí lương"
        onClose={() => setAdjustmentOpen(false)}
        footer={
          <>
            <button onClick={() => setAdjustmentOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Đóng
            </button>
            <button type="submit" form="payroll-adjustment-form" disabled={savingAdjustment || !adjustmentForm.employeeId || !Number(adjustmentForm.amount)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">
              {savingAdjustment ? "Đang lưu..." : "Lưu khoản này"}
            </button>
          </>
        }
      >
        <form id="payroll-adjustment-form" onSubmit={saveAdjustment} className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            Nhân viên
            <select value={adjustmentForm.employeeId} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, employeeId: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
              {payrollRows.map((row) => (
                <option key={row.employeeId} value={row.employeeId}>
                  {row.employeeName} · {row.employeeId}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Loại khoản
            <select value={adjustmentForm.kind} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, kind: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
              <option value="Addition">Cộng vào lương</option>
              <option value="Deduction">Trừ khỏi lương</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Danh mục
            <select value={adjustmentForm.category} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, category: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
              {adjustmentCategories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Số tiền
            <input type="number" min="1000" step="1000" value={adjustmentForm.amount} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, amount: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="500000" />
          </label>

          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            Ghi chú
            <textarea value={adjustmentForm.note} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, note: event.target.value })} rows={3} className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="VD: Phụ cấp gửi xe tháng này, tạm ứng ca Tết..." />
          </label>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500 sm:col-span-2">
            Sau khi lưu, BIZEN AI có thể đọc khoản này ngay. Để cập nhật thực lĩnh trên bảng lương, bấm Tính lương.
          </p>
        </form>
      </Modal>
    </div>
  );
}

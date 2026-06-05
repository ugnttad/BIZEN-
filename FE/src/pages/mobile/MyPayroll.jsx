import { useEffect, useState } from "react";
import { CreditCard, Download } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency, getCurrentPayrollMonth } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";
import { getMobileEmployeeId } from "../../modules/auth/mobileSession";

export default function MyPayroll() {
  const mobileEmployeeId = getMobileEmployeeId();
  const [payroll, setPayroll] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mobileEmployeeId) {
      setError("Chưa gắn hồ sơ nhân viên.");
      return;
    }
    bizenApi
      .payrollDetail(mobileEmployeeId)
      .then(setPayroll)
      .catch((err) => setError(err.message || "Không tải được bảng lương."));
  }, [mobileEmployeeId]);

  if (error) {
    return <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</section>;
  }

  if (!payroll) {
    return <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Đang tải bảng lương…</section>;
  }

  const lines = [
    ["Lương gross", payroll.grossSalary || 0],
    ["Khoản cộng nhập tay", payroll.manualAddition || 0],
    ["BHXH (8%)", -(payroll.bhxhEmployee || 0)],
    ["BHYT (1,5%)", -(payroll.bhytEmployee || 0)],
    ["BHTN (1%)", -(payroll.bhtnEmployee || 0)],
    ["Khoản trừ nhập tay", -(payroll.manualDeduction || 0)],
    ["Phạt/tự động", -(payroll.autoDeduction ?? payroll.autoLateDeduction ?? 0)],
    ["Thực lĩnh", payroll.finalSalary]
  ];
  const isHourly = payroll.payType === "Hourly";

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-blue-600 p-5 text-white">
        <div className="flex items-center justify-between">
          <CreditCard className="h-6 w-6" />
          <StatusBadge status={payroll.status} />
        </div>
        <p className="mt-5 text-sm text-blue-100">Lương tháng {payroll.month || getCurrentPayrollMonth()}</p>
        <p className="mt-1 text-3xl font-semibold tracking-normal">{formatCurrency(payroll.finalSalary)}</p>
        {payroll.isEstimate ? <p className="mt-2 text-xs text-blue-100">Tạm tính từ ngày công — chủ sở hữu chưa chốt bảng lương chính thức</p> : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-950">Chi tiết</h2>
        <p className="mt-1 text-xs text-slate-500">
          {isHourly ? `Tổng giờ: ${payroll.totalHours || 0}h · Ngày công: ${payroll.workingDays}` : `Ngày công: ${payroll.workingDays}/22`} · OT: {payroll.overtimeHours}h
        </p>
        <div className="mt-4 space-y-3">
          {lines.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-500">{label}</span>
              <span className={`text-sm font-semibold ${value < 0 ? "text-rose-600" : "text-slate-950"}`}>{formatCurrency(Math.abs(value))}</span>
            </div>
          ))}
        </div>
        {payroll.adjustments?.length ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="text-sm font-semibold text-slate-950">Khoản quản lý nhập</h3>
            <div className="mt-2 space-y-2">
              {payroll.adjustments.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{item.category}</span>
                  <span className={`font-semibold ${item.kind === "Addition" ? "text-emerald-700" : "text-rose-700"}`}>
                    {item.kind === "Addition" ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <button type="button" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700">
          <Download className="h-4 w-4" />
          Phiếu lương (sắp có)
        </button>
      </section>
    </div>
  );
}

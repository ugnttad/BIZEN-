import { useEffect, useState } from "react";
import { CreditCard, Download } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";

const mobileEmployeeId = "BZN017";

export default function MyPayroll() {
  const [payroll, setPayroll] = useState(null);

  useEffect(() => {
    bizenApi.payrollDetail(mobileEmployeeId).then(setPayroll);
  }, []);

  if (!payroll) {
    return <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Đang tải bảng lương từ Neon...</section>;
  }

  const lines = [
    ["Base salary", payroll.baseSalary],
    ["Working days", (payroll.baseSalary / 22) * payroll.workingDays],
    ["Overtime", payroll.overtimePay],
    ["Bonus", payroll.bonus],
    ["Deduction", -payroll.deduction]
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-blue-600 p-5 text-white">
        <div className="flex items-center justify-between">
          <CreditCard className="h-6 w-6" />
          <StatusBadge status={payroll.status} />
        </div>
        <p className="mt-5 text-sm text-blue-100">Lương tháng 05/2026</p>
        <p className="mt-1 text-3xl font-semibold tracking-normal">{formatCurrency(payroll.finalSalary)}</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-950">Breakdown</h2>
        <div className="mt-4 space-y-3">
          {lines.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-500">{label}</span>
              <span className={`text-sm font-semibold ${value < 0 ? "text-rose-600" : "text-slate-950"}`}>{formatCurrency(value)}</span>
            </div>
          ))}
        </div>
        <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700">
          <Download className="h-4 w-4" />
          Xem phiếu lương
        </button>
      </section>
    </div>
  );
}

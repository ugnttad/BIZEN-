import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeDollarSign, CalendarCheck2, Clock3, MinusCircle, PlusCircle } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import Avatar from "../../components/Avatar";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";

export default function PayrollDetail() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([bizenApi.employee(id), bizenApi.payrollDetail(id), bizenApi.employeeAttendance(id)])
      .then(([employeeData, payrollData, attendanceRows]) => {
        if (!active) return;
        setEmployee(employeeData);
        setPayroll(payrollData);
        setAttendance(attendanceRows.find((record) => record.date === "20/05/2026") || attendanceRows[0] || null);
      })
      .catch(() => {
        if (active) {
          setEmployee(null);
          setPayroll(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <EmptyState title="Đang tải bảng lương" description="Đang lấy payroll từ Neon." />;
  }

  if (!employee || !payroll) {
    return (
      <div>
        <Link to="/web/payroll" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Bảng lương
        </Link>
        <EmptyState title="Không tìm thấy bảng lương" description="Mã nhân viên không có payroll trong tháng 05/2026." />
      </div>
    );
  }

  return (
    <div>
      <Link to="/web/payroll" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
        <ArrowLeft className="h-4 w-4" />
        Bảng lương
      </Link>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={employee.name} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-slate-950">{employee.name}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {employee.id} · {employee.department} · Payroll 05/2026
              </p>
            </div>
          </div>
          <StatusBadge status={payroll.status} />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Base salary" value={formatCurrency(payroll.baseSalary)} helper="theo hợp đồng" icon={BadgeDollarSign} tone="blue" />
        <StatCard title="Working days" value={`${payroll.workingDays}/22`} helper="ngày công" icon={CalendarCheck2} tone="emerald" />
        <StatCard title="Overtime" value={`${payroll.overtimeHours}h`} helper={formatCurrency(payroll.overtimePay)} icon={Clock3} tone="violet" />
        <StatCard title="Bonus" value={formatCurrency(payroll.bonus)} helper="thưởng/phụ cấp" icon={PlusCircle} tone="amber" />
        <StatCard title="Deduction" value={formatCurrency(payroll.deduction)} helper="trễ, nghỉ, phạt" icon={MinusCircle} tone="rose" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Final salary</h2>
          <p className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">{formatCurrency(payroll.finalSalary)}</p>
          <div className="mt-5 space-y-3 text-sm">
            {[
              ["Lương theo ngày công", formatCurrency((payroll.baseSalary / 22) * payroll.workingDays)],
              ["Tiền tăng ca", formatCurrency(payroll.overtimePay)],
              ["Thưởng", formatCurrency(payroll.bonus)],
              ["Khấu trừ", `-${formatCurrency(payroll.deduction)}`]
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-950">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Dữ liệu đầu vào</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-500">Chấm công hôm nay</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-slate-950">{attendance?.checkIn || "-"}</span>
                <StatusBadge status={attendance?.status || "Present"} />
              </div>
              <p className="mt-2 text-sm text-slate-500">{attendance?.note || "Đang cập nhật"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-500">Ngày nghỉ không phép</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{payroll.deduction > 800000 ? 1 : 0}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-500">Đi trễ</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{attendance?.status === "Late" ? 1 : 0}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-500">Công thức OT</p>
              <p className="mt-3 text-sm font-semibold text-slate-950">Lương giờ x 150%</p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Quy trình duyệt</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {["Draft", "Reviewed", "Approved", "Paid"].map((status) => (
            <div key={status} className="rounded-lg border border-slate-200 p-4">
              <StatusBadge status={status} />
              <p className="mt-3 text-sm text-slate-500">
                {status === payroll.status ? "Trạng thái hiện tại" : "Bước payroll"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

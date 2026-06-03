import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Clock3, CreditCard, Mail, MapPin, Phone, UserRoundCog } from "lucide-react";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency, getRecentPayrollMonths } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";

function formatTodayDisplay() {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date());
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([bizenApi.employee(id), bizenApi.payrollDetail(id), bizenApi.employeeAttendance(id), bizenApi.shifts()])
      .then(([employeeData, payrollData, attendanceRows, shiftRows]) => {
        if (!active) return;
        setEmployee(employeeData);
        setPayroll(payrollData);
        setAttendanceHistory(attendanceRows);
        setShifts(shiftRows);
      })
      .catch(() => {
        if (active) setEmployee(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (!loading && !employee) {
    return (
      <div>
        <Link to="/web/employees" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Danh sách nhân viên
        </Link>
        <EmptyState title="Không tìm thấy nhân viên" description="Mã nhân viên không tồn tại trong hệ thống." />
      </div>
    );
  }

  if (loading) {
    return <EmptyState title="Đang tải hồ sơ" description="Đang lấy dữ liệu nhân viên từ Neon." />;
  }

  const today = formatTodayDisplay();
  const attendance = attendanceHistory.find((record) => record.date === today) || attendanceHistory[0];
  const shift = shifts.find((item) => item.id === employee.shiftId);
  const employeeHistory = attendanceHistory;
  const payrollHistory = getRecentPayrollMonths(3).map((month, index, months) => ({
    month,
    value: index === months.length - 1 ? payroll?.finalSalary || employee.baseSalary : employee.baseSalary + (index === 0 ? 450000 : 650000),
    status: index === months.length - 1 ? payroll?.status || "Draft" : "Paid"
  }));

  return (
    <div>
      <Link to="/web/employees" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
        <ArrowLeft className="h-4 w-4" />
        Danh sách nhân viên
      </Link>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={employee.name} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-normal text-slate-950">{employee.name}</h1>
                <StatusBadge status={employee.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {employee.id} · {employee.position} · {employee.department}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={employee.role} />
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{employee.contractType}</span>
              </div>
            </div>
          </div>
          <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Cập nhật hồ sơ</button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Lương cơ bản" value={formatCurrency(employee.baseSalary)} helper="theo hợp đồng" icon={CreditCard} tone="blue" />
        <StatCard title="Ca mặc định" value={shift?.name || "Chưa xếp"} helper={shift?.time || "Đang cập nhật"} icon={Clock3} tone="violet" />
        <StatCard title="Ngày phép còn lại" value={`${employee.leaveRemaining} ngày`} helper="năm 2026" icon={CalendarDays} tone="emerald" />
        <StatCard title="Lương tháng này" value={formatCurrency(payroll?.finalSalary || 0)} helper={payroll?.status || "Draft"} icon={BriefcaseBusiness} tone="amber" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <PageHeader title="Thông tin cá nhân" description="Liên hệ, quản lý trực tiếp và nơi làm việc." />
          <dl className="space-y-4 text-sm">
            {[
              { icon: Mail, label: "Email", value: employee.email },
              { icon: Phone, label: "Điện thoại", value: employee.phone },
              { icon: MapPin, label: "Khu vực", value: employee.address },
              { icon: UserRoundCog, label: "Quản lý", value: employee.manager },
              { icon: CalendarDays, label: "Ngày vào làm", value: employee.startDate }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">{item.label}</dt>
                    <dd className="font-semibold text-slate-950">{item.value}</dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <PageHeader title="Lịch sử chấm công" description="Các ngày gần nhất của nhân viên." />
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                <tr>
                  <th className="py-2">Ngày</th>
                  <th className="py-2">Ca</th>
                  <th className="py-2">Vào</th>
                  <th className="py-2">Ra</th>
                  <th className="py-2">Giờ</th>
                  <th className="py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeHistory.map((item) => (
                  <tr key={item.date}>
                    <td className="py-3 font-medium text-slate-950">{item.date}</td>
                    <td className="py-3 text-slate-600">{item.shift}</td>
                    <td className="py-3 text-slate-600">{item.checkIn}</td>
                    <td className="py-3 text-slate-600">{item.checkOut}</td>
                    <td className="py-3 text-slate-600">{item.hours}</td>
                    <td className="py-3">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <PageHeader title="Lịch sử lương" description="Payroll gần nhất theo tháng." />
        <div className="grid gap-3 md:grid-cols-3">
          {payrollHistory.map((item) => (
            <div key={item.month} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-950">{item.month}</p>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-3 text-xl font-semibold text-slate-950">{formatCurrency(item.value)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

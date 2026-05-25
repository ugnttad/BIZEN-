import { cn } from "../lib/utils";

const statusStyles = {
  Present: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Late: "bg-amber-50 text-amber-700 ring-amber-100",
  Absent: "bg-rose-50 text-rose-700 ring-rose-100",
  Leave: "bg-sky-50 text-sky-700 ring-sky-100",
  Busy: "bg-rose-50 text-rose-700 ring-rose-100",
  Overtime: "bg-violet-50 text-violet-700 ring-violet-100",
  "Missing checkout": "bg-amber-50 text-amber-700 ring-amber-100",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "On leave": "bg-sky-50 text-sky-700 ring-sky-100",
  Draft: "bg-slate-100 text-slate-700 ring-slate-200",
  Reviewed: "bg-blue-50 text-blue-700 ring-blue-100",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Paid: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  Pending: "bg-amber-50 text-amber-700 ring-amber-100",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-100",
  "Not submitted": "bg-slate-100 text-slate-700 ring-slate-200",
  Suspended: "bg-slate-100 text-slate-700 ring-slate-200",
  Manager: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  HR: "bg-blue-50 text-blue-700 ring-blue-100",
  Admin: "bg-slate-900 text-white ring-slate-900",
  PlatformAdmin: "bg-slate-900 text-white ring-slate-900",
  Employee: "bg-slate-100 text-slate-700 ring-slate-200"
};

const statusLabels = {
  Present: "Đúng giờ",
  Late: "Đi trễ",
  Absent: "Vắng",
  Leave: "Nghỉ phép",
  Busy: "Bận",
  Overtime: "Tăng ca",
  "Missing checkout": "Quên check-out",
  Active: "Đang làm",
  "On leave": "Đang nghỉ",
  Inactive: "Ngừng làm",
  Draft: "Nháp",
  Reviewed: "Đã soát",
  Approved: "Đã duyệt",
  Paid: "Đã trả",
  Pending: "Chờ duyệt",
  Rejected: "Từ chối",
  "Not submitted": "Chưa đăng ký",
  Suspended: "Tạm khóa",
  Manager: "Quản lý ca",
  HR: "Phụ quyền cũ",
  Admin: "Chủ sở hữu",
  PlatformAdmin: "Chủ nền tảng",
  Employee: "Nhân viên"
};

export default function StatusBadge({ status, className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ring-1 ring-inset",
        statusStyles[status] || "bg-slate-100 text-slate-700 ring-slate-200",
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}

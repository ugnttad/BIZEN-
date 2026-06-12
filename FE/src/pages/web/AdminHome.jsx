import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarCheck2,
  CheckSquare,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  MessageCircle,
  ScanFace,
  Settings,
  Sparkles,
  UserCheck,
  UsersRound
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";

function todayIso() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date = new Date()) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

const featureCards = [
  {
    title: "Nhân viên",
    description: "Tạo hồ sơ, cấp tài khoản và quản lý trạng thái làm việc.",
    href: "/web/employees",
    icon: UsersRound,
    example: "VD: thêm nhân viên pha chế mới và cấp mật khẩu đăng nhập."
  },
  {
    title: "Xếp ca",
    description: "Lập lịch tuần, né ngày bận và lưu ca theo nhân sự thực tế.",
    href: "/web/scheduling",
    icon: CalendarCheck2,
    example: "VD: ca sáng cần 3 người, nhân viên báo bận sẽ không bị xếp."
  },
  {
    title: "Checklist ca làm",
    description: "Giao việc đầu ca/cuối ca, nhân viên nộp ảnh minh chứng.",
    href: "/web/kpis",
    icon: CheckSquare,
    example: "VD: setup bàn ghế trước 07:20, nộp ảnh để chủ quán duyệt."
  },
  {
    title: "Cộng đồng",
    description: "Nhắn tin nội bộ trong cùng doanh nghiệp để báo ca, nhắc việc và trao đổi nhanh.",
    href: "/web/community",
    icon: MessageCircle,
    example: "VD: nhân viên báo đã chuẩn bị nguyên liệu, quản lý phản hồi ngay trong workspace."
  },
  {
    title: "Chấm công",
    description: "Theo dõi check-in, GPS, thiếu check-out và trạng thái trong ngày.",
    href: "/web/attendance",
    icon: Clock3,
    example: "VD: chốt giờ ra thủ công cho nhân viên quên check-out."
  },
  {
    title: "Face ID",
    description: "Duyệt ảnh đăng ký khuôn mặt và dùng AWS Rekognition khi chấm công.",
    href: "/web/face-id",
    icon: ScanFace,
    example: "VD: chủ quán duyệt ảnh trước khi nhân viên dùng Face ID."
  },
  {
    title: "Bảng lương",
    description: "Tính lương từ công, OT, khoản cộng/trừ và xuất bảng chi tiết.",
    href: "/web/payroll",
    icon: CreditCard,
    example: "VD: tính lương tháng, kiểm tra dòng lương từng nhân viên."
  },
  {
    title: "Nghỉ phép",
    description: "Duyệt đơn nghỉ và đồng bộ vào lịch xếp ca.",
    href: "/web/leaves",
    icon: FileText,
    example: "VD: duyệt nghỉ bệnh để AI/lịch tránh ngày nhân viên vắng."
  },
  {
    title: "Báo cáo",
    description: "Xem tỷ lệ đúng giờ, OT, nghỉ phép và tải file CSV.",
    href: "/web/reports",
    icon: BarChart3,
    example: "VD: tải báo cáo chấm công/lương gửi kế toán."
  },
  {
    title: "Cài đặt",
    description: "Cấu hình giờ làm, vị trí chấm công, công thức lương và bộ phận.",
    href: "/web/settings",
    icon: Settings,
    example: "VD: chọn địa chỉ quán, bán kính GPS và giờ làm chuẩn."
  }
];

export default function AdminHome() {
  const [summary, setSummary] = useState({ employees: 0, checkedIn: 0, late: 0, leave: 0, payrollTotal: 0, aiAlerts: [] });
  const [checklistRows, setChecklistRows] = useState([]);
  const [accountRequests, setAccountRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      bizenApi.dashboardSummary().catch(() => null),
      bizenApi.kpiTasks({ date: todayIso() }).catch(() => []),
      bizenApi.accountRequests("Pending").catch(() => [])
    ])
      .then(([summaryData, tasks, accounts]) => {
        if (!active) return;
        if (summaryData) setSummary(summaryData);
        setChecklistRows(tasks || []);
        setAccountRequests(accounts || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Không tải được trang chủ quản lý.");
      });
    return () => {
      active = false;
    };
  }, []);

  const quickStats = useMemo(
    () => [
      { label: "Nhân viên", value: summary.employees || 0, helper: "đang quản lý" },
      { label: "Đã chấm công", value: summary.checkedIn || 0, helper: "hôm nay" },
      { label: "Đi trễ", value: summary.late || 0, helper: "cần theo dõi" },
      { label: "Checklist mở", value: checklistRows.filter((task) => ["Pending", "InProgress", "Rejected"].includes(task.status)).length, helper: "chưa xong" }
    ],
    [checklistRows, summary]
  );

  const pendingChecklist = checklistRows.filter((task) => task.status === "Submitted");
  const alerts = summary.aiAlerts || [];

  return (
    <div>
      <section className="brand-card relative mb-5 min-h-[210px] rounded-2xl p-5 lg:min-h-[250px]">
        <div className="absolute inset-y-4 right-4 hidden w-[58%] rounded-2xl bg-[url('/assets/bizen-home-cover.svg')] bg-contain bg-right bg-no-repeat opacity-25 blur-[1px] md:block" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.99)_0%,rgba(255,255,255,0.96)_54%,rgba(255,255,255,0.82)_100%)]" />
        <div className="absolute bottom-0 right-0 hidden h-28 w-72 rounded-tl-full bg-blue-100/35 blur-2xl md:block" />
        <div className="relative flex min-h-[170px] max-w-xl flex-col justify-center lg:min-h-[210px]">
          <p className="text-xs font-bold uppercase tracking-normal text-blue-700">BIZEN Workspace</p>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-slate-950 md:text-4xl">Quản trị nhân sự thông minh</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
            Một màn hình gọn để chủ quán bắt đầu xử lý nhân viên, ca làm, checklist, chấm công và lương trong ngày.
          </p>
        </div>
      </section>

      <PageHeader
        eyebrow="Workspace"
        title="Trang chủ quản lý"
        description={`Hôm nay ${formatDisplayDate()}. Chọn một khu vực vận hành bên dưới để bắt đầu xử lý công việc.`}
        actions={
          <Link to="/web/assistant" className="brand-button btn-motion inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            Hỏi trợ lý AI
          </Link>
        }
      />

      {error ? <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((item) => (
          <div key={item.label} className="premium-card rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{item.value}</p>
            <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
          </div>
        ))}
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} to={feature.href} className="premium-card group rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="brand-icon-tile grid h-11 w-11 place-items-center rounded-lg">
                  <Icon className="h-5 w-5" />
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </div>
              <h2 className="mt-4 text-base font-bold text-slate-950">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">{feature.example}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-950">Việc cần chủ quán xem</h2>
            <Link to="/web/kpis" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
              Xem checklist
            </Link>
          </div>
          <div className="space-y-3">
            {pendingChecklist.slice(0, 4).map((task) => (
              <div key={task.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.employeeName} · nộp {task.submittedAt ? new Date(task.submittedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "-"}</p>
                  </div>
                  <StatusBadge status={task.timeliness === "Late" ? "Late" : "Submitted"} />
                </div>
              </div>
            ))}
            {!pendingChecklist.length ? <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Chưa có checklist nào đang chờ duyệt.</p> : null}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-950">Tài khoản chờ duyệt</h2>
              <StatusBadge status="Pending" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-950">{accountRequests.length}</p>
            <Link to="/web/accounts" className="mt-3 inline-flex text-sm font-semibold text-slate-600 hover:text-slate-950">
              Mở trang tài khoản
            </Link>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-bold text-slate-950">Cảnh báo vận hành</h2>
            <div className="mt-3 space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-950">{alert.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{alert.detail}</p>
                </div>
              ))}
              {!alerts.length ? <p className="text-sm text-slate-500">Chưa có cảnh báo mới.</p> : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-bold text-slate-950">Lương dự kiến</h2>
            <p className="mt-2 text-xl font-bold text-slate-950">{formatCurrency(summary.payrollTotal || 0)}</p>
            <Link to="/web/payroll" className="mt-3 inline-flex text-sm font-semibold text-slate-600 hover:text-slate-950">
              Mở bảng lương
            </Link>
          </section>
        </aside>
      </section>
    </div>
  );
}

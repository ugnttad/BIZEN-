import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FileText,
  MapPin,
  Menu,
  ScanFace,
  Settings,
  ShieldCheck,
  UsersRound,
  X
} from "lucide-react";

const navItems = [
  { label: "Tính năng", href: "#features" },
  { label: "Ví dụ sử dụng", href: "#examples" },
  { label: "Triển khai", href: "#rollout" },
  { label: "FAQ", href: "#faq" }
];

const metrics = [
  { value: "1-20", label: "nhân sự mỗi cửa hàng" },
  { value: "GPS", label: "địa điểm chấm công" },
  { value: "Face ID", label: "xác minh nhân viên" },
  { value: "CSV", label: "xuất báo cáo ngay" }
];

const featureExamples = [
  {
    title: "Trang chủ quản lí",
    icon: Building2,
    example: "Chủ quán đăng nhập vào màn hình hub, chọn nhanh Nhân viên, Xếp ca, Chấm công, Bảng lương hoặc Báo cáo.",
    outcome: "Không bị đẩy thẳng vào dashboard, nhìn giống một hệ thống làm việc thật."
  },
  {
    title: "Nhân viên",
    icon: UsersRound,
    example: "Tạo hồ sơ pha chế, thu ngân, phục vụ, lương theo giờ, trạng thái đang làm hoặc nghỉ.",
    outcome: "Chủ quán nắm được đội hiện tại trước khi xếp ca."
  },
  {
    title: "Xếp ca AI",
    icon: CalendarCheck2,
    example: "Quán đăng ký 8 nhân viên thì AI Suggest chỉ gợi ý quanh quy mô 8 người, không ép theo mẫu 20 người.",
    outcome: "Lịch ca sát thực tế hơn cho cửa hàng nhỏ."
  },
  {
    title: "Checklist ca làm",
    icon: ClipboardCheck,
    example: "Ca sáng cần setup bàn ghế trước 7:20, quét dọn trước 7:30. Làm xong nhân viên chụp ảnh và nộp.",
    outcome: "Hệ thống ghi nhận đúng giờ hoặc trễ giờ để chủ quán kiểm tra."
  },
  {
    title: "Chấm công GPS",
    icon: MapPin,
    example: "Chủ quán chọn địa chỉ cửa hàng, hệ thống lưu latitude, longitude và bán kính cho phép.",
    outcome: "Nhân viên check-in gần quán mới được ghi nhận hợp lệ."
  },
  {
    title: "Face ID",
    icon: ScanFace,
    example: "Nhân viên đăng ký khuôn mặt, chủ quán duyệt, sau đó dùng camera để chấm công.",
    outcome: "Giảm tình trạng chấm công hộ."
  },
  {
    title: "Nghỉ phép",
    icon: Clock3,
    example: "Nhân viên gửi yêu cầu nghỉ, chủ quán duyệt hoặc từ chối kèm lý do.",
    outcome: "Lịch ca và công không bị lệch vì tin nhắn trôi trong Zalo."
  },
  {
    title: "Bảng lương",
    icon: CreditCard,
    example: "BIZEN gom giờ làm, OT và các bản ghi quên check-out cần chủ quán chốt.",
    outcome: "Chốt lương có dữ liệu đối soát trước khi trả tiền."
  },
  {
    title: "Báo cáo",
    icon: FileText,
    example: "Xuất CSV chấm công, tổng quan vận hành hoặc báo cáo nhân sự theo bộ phận.",
    outcome: "Có file thật để gửi kế toán hoặc lưu nội bộ."
  },
  {
    title: "Cài đặt cửa hàng",
    icon: Settings,
    example: "Thiết lập giờ làm chuẩn, grace period, vị trí GPS, công thức lương và bộ phận.",
    outcome: "Mỗi cửa hàng có cấu hình riêng thay vì dùng một mẫu cứng."
  }
];

const rolloutSteps = [
  "Cửa hàng đăng ký doanh nghiệp và nhập quy mô nhân sự.",
  "BIZEN duyệt tenant, tạo workspace và tài khoản chủ sở hữu.",
  "Chủ quán thêm nhân viên, cấu hình vị trí GPS, ca làm và lương.",
  "Nhân viên dùng cổng mobile để xem ca, chấm công, làm checklist và gửi nghỉ phép.",
  "Chủ quán xem báo cáo, duyệt ảnh checklist, chốt công và xuất CSV."
];

const faqs = [
  {
    question: "BIZEN phù hợp nhất với mô hình nào?",
    answer: "Cửa hàng cafe, trà sữa hoặc dịch vụ nhỏ dưới 20 nhân sự, cần quản lí ca làm, chấm công, lương và việc đầu ca/cuối ca."
  },
  {
    question: "Checklist ca làm có phải KPI không?",
    answer: "Không. Đây là danh sách việc cần làm theo ca, giống todolist vận hành có deadline và ảnh minh chứng."
  },
  {
    question: "Có dùng dữ liệu thật được không?",
    answer: "Có. Dữ liệu nhân viên, ca làm, chấm công, nghỉ phép, payroll và checklist đều đi qua API/backend thay vì chỉ hiển thị giao diện tĩnh."
  }
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", company: "" });
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function closeMenu() {
    setMobileMenuOpen(false);
  }

  function submitConsultation(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.company.trim() || form.phone.replace(/\D/g, "").length < 9) {
      setSubmitted(false);
      setFormError("Vui lòng nhập tên, tên cửa hàng và số điện thoại hợp lệ.");
      return;
    }
    setFormError("");
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" onClick={closeMenu} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-lg font-bold text-white">B</span>
            <span>
              <span className="block text-xl font-bold tracking-normal text-slate-950">BIZEN</span>
              <span className="block text-xs font-medium text-slate-500">Cloud HR & Payroll</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="py-2 hover:text-slate-950">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Đăng nhập
            </Link>
            <Link to="/register-company" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              Đăng ký doanh nghiệp
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-sm lg:hidden">
            <nav className="mx-auto grid max-w-7xl gap-2 text-sm font-semibold text-slate-700">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={closeMenu} className="rounded-lg px-3 py-2 hover:bg-slate-100">
                  {item.label}
                </a>
              ))}
              <Link to="/login" onClick={closeMenu} className="rounded-lg px-3 py-2 hover:bg-slate-100">
                Đăng nhập
              </Link>
              <Link to="/register-company" onClick={closeMenu} className="rounded-lg bg-slate-950 px-3 py-2 text-white">
                Đăng ký doanh nghiệp
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      <section className="relative min-h-[88vh] overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[url('/assets/bizen-hero-dashboard.png')] bg-cover bg-center lg:bg-right" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.99)_0%,rgba(255,255,255,0.94)_42%,rgba(255,255,255,0.72)_68%,rgba(255,255,255,0.22)_100%)]" />
        <div className="relative mx-auto flex min-h-[calc(88vh-4rem)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Quản lí nhân sự thực tế cho cửa hàng nhỏ
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              BIZEN quản lí ca làm, chấm công và lương cho cửa hàng dưới 20 người.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Một nơi để chủ quán xếp ca, kiểm tra chấm công GPS/Face ID, giao checklist theo ca, duyệt nghỉ phép và xuất báo cáo vận hành.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register-company" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                Đăng ký doanh nghiệp
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/85 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-white">
                Vào hệ thống
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm">
                  <p className="text-2xl font-bold text-slate-950">{metric.value}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-normal text-blue-700">Tính năng chính</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Từ đăng ký cửa hàng tới vận hành mỗi ngày.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              BIZEN gom các việc chủ quán thường xử lí rời rạc trên Excel, Zalo và giấy tờ thành các màn hình có hành động thật.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureExamples.slice(0, 6).map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-slate-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.example}</p>
                  <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">{feature.outcome}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="examples" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-blue-700">Ví dụ sử dụng</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Các tình huống chủ quán có thể test ngay.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Mỗi ví dụ bên phải tương ứng một module trong hệ thống. Khi khách bấm vào, họ thấy dữ liệu, bộ lọc, trạng thái và thao tác rõ ràng.
            </p>
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <p>
                  Tính năng checklist ca làm được định nghĩa là todolist vận hành. Nó không chấm điểm KPI dài hạn, mà kiểm tra việc trong ca có làm đúng hạn và có ảnh minh chứng không.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {featureExamples.slice(6).map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{feature.example}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{feature.outcome}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="rollout" className="bg-slate-950 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-blue-200">Quy trình triển khai</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">Đủ gọn để đem ra cửa hàng test trong một buổi.</h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Chủ quán không cần hiểu kỹ thuật. Họ chỉ cần đăng ký, được duyệt workspace, thêm nhân viên và bắt đầu vận hành.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <ol className="space-y-3">
              {rolloutSteps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-slate-950">{index + 1}</span>
                  <span className="text-sm leading-6 text-slate-200">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="consult" className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-normal text-blue-700">Bắt đầu dùng</p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Đăng ký doanh nghiệp hoặc gửi thông tin tư vấn.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Nếu đã có cửa hàng test, dùng thẳng form đăng ký doanh nghiệp. Nếu cần khảo sát nghiệp vụ trước, để lại thông tin ở form bên cạnh.
          </p>
          <Link to="/register-company" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Đăng ký doanh nghiệp
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <form onSubmit={submitConsultation} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Họ tên
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Nguyễn Văn An"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Số điện thoại
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="090..."
              />
            </label>
          </div>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Tên cửa hàng
            <input
              value={form.company}
              onChange={(event) => setForm({ ...form, company: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="BIZEN Coffee Đà Nẵng"
            />
          </label>
          {formError ? <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{formError}</p> : null}
          {submitted ? <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Đã ghi nhận thông tin tư vấn.</p> : null}
          <button type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
            Gửi thông tin
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </section>

      <section id="faq" className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-normal text-blue-700">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Câu hỏi thường gặp</h2>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-slate-950">
                  {faq.question}
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-slate-200 px-4 pt-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-2xl font-bold text-slate-950">BIZEN</p>
            <p className="mt-1 text-sm text-slate-500">Cloud HR & Payroll for SME Đà Nẵng</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
            <Link to="/login" className="hover:text-slate-950">
              Đăng nhập
            </Link>
            <Link to="/register-company" className="hover:text-slate-950">
              Đăng ký doanh nghiệp
            </Link>
            <Link to="/register-employee" className="hover:text-slate-950">
              Yêu cầu tài khoản nhân viên
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

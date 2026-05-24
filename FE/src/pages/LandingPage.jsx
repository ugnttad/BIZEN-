import { useState } from "react";
import { Link } from "react-router-dom";
import WorkflowStepsCard from "../components/WorkflowStepsCard";
import { demoScriptOrder, mvpDemoFeatures } from "../constants/saasWorkflow";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BellRing,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Headphones,
  Home,
  Layers3,
  Menu,
  MessageSquareText,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X
} from "lucide-react";

const navItems = [
  { label: "Trang chủ", href: "#home" },
  { label: "Giải pháp", href: "#solutions" },
  { label: "Tính năng", href: "#features" },
  { label: "Bảng giá", href: "#pricing" },
  { label: "Khách hàng", href: "#customers" },
  { label: "FAQ", href: "#faq" }
];

const metrics = [
  { value: "20+", label: "nhân viên" },
  { value: "4", label: "ca làm chuẩn" },
  { value: "98%", label: "chấm công rõ trạng thái" },
  { value: "24/7", label: "cloud dashboard" }
];

const featureTabs = mvpDemoFeatures.map((feature, index) => ({
  title: feature.title,
  icon: [Building2, Clock3, UsersRound][index],
  content: feature.pain,
  steps: feature.steps,
  skippable: feature.skippable
}));

const solutionCards = [
  {
    title: "Cho chủ doanh nghiệp",
    icon: BarChart3,
    text: "Theo dõi chi phí lương dự kiến, tỷ lệ đúng giờ, hiệu suất bộ phận và cảnh báo nhân sự."
  },
  {
    title: "Cho Admin/nhân sự",
    icon: UsersRound,
    text: "Quản lý hồ sơ, chấm công, lịch làm, nghỉ phép và bảng lương trên một dashboard gọn."
  },
  {
    title: "Cho quản lý",
    icon: BellRing,
    text: "Nắm ca làm hôm nay, người vắng, nhân sự thay ca và cảnh báo tăng ca trong bộ phận."
  },
  {
    title: "Cho nhân viên",
    icon: ShieldCheck,
    text: "Cổng web/mobile đơn giản: hôm nay làm ca nào, đã check-in chưa, lương tạm tính và ngày phép còn lại."
  }
];

const postMvpFeatures = [
  { title: "Xếp ca AI", text: "Gợi ý lịch, cảnh báo thiếu người — phát triển sau MVP." },
  { title: "Payroll tự động", text: "Gom công, OT, phạt — đã có API, demo sau khi chốt MVP chấm công." },
  { title: "Báo cáo & AI Assistant", text: "Dashboard quản trị và AI hỗ trợ vận hành — mở rộng giai đoạn Scale." }
];

const faqs = [
  {
    question: "BIZEN dùng được với dữ liệu thật không?",
    answer: "Có. Hệ thống có backend Node.js, PostgreSQL Neon và API nghiệp vụ để vận hành trên dữ liệu tập trung."
  },
  {
    question: "Có cần cài phần mềm trên máy chấm công không?",
    answer: "Ứng dụng dùng camera mobile/web, Admin/HR duyệt ảnh đăng ký và AWS Rekognition xác minh khuôn mặt khi chấm công."
  },
  {
    question: "Có phân quyền cho HR, quản lý và nhân viên không?",
    answer: "Có. Hệ thống tách dashboard quản trị, cổng web nhân viên và mobile-first cho chấm công nhanh, có nền tảng role-based access."
  }
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", company: "" });
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function closeMenu() {
    setMobileMenuOpen(false);
  }

  function goHome() {
    closeMenu();
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }

  function submitConsultation(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.company.trim() || form.phone.replace(/\D/g, "").length < 9) {
      setSubmitted(false);
      setFormError("Vui lòng nhập tên, công ty và số điện thoại hợp lệ.");
      return;
    }
    setFormError("");
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-white text-slate-950 animate-soft-appear">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/50 bg-white/90 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" onClick={goHome} className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-lg font-bold text-white transition duration-300 group-hover:scale-105 group-hover:bg-blue-700">B</span>
            <span>
              <span className="block text-xl font-bold tracking-normal text-blue-700 transition-colors group-hover:text-blue-800">BIZEN</span>
              <span className="block text-xs font-medium text-slate-500">Cloud HR & Payroll</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="relative py-2 transition-colors duration-200 hover:text-blue-700 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-blue-600 after:transition-transform after:duration-300 hover:after:scale-x-100">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login" className="btn-motion rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Đăng nhập
            </Link>
            <Link to="/register-company" className="btn-motion rounded-lg px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              Đăng ký DN
            </Link>
            <a href="#consult" className="btn-motion inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow-blue-600/20">
              Liên hệ
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="btn-motion grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="animate-panel-in border-t border-slate-100 bg-white/95 px-4 py-4 shadow-lg backdrop-blur lg:hidden">
            <nav className="mx-auto grid max-w-7xl gap-2 text-sm font-semibold text-slate-700">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={closeMenu} className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-blue-50 hover:text-blue-700">
                  {item.href === "#home" ? <Home className="h-4 w-4" /> : null}
                  {item.label}
                </a>
              ))}
              <Link to="/login" onClick={closeMenu} className="rounded-lg px-3 py-2 transition-colors hover:bg-slate-100">
                Đăng nhập
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      <section id="home" className="relative min-h-[92vh] overflow-hidden pt-16">
        <div className="hero-bg-motion absolute inset-0 bg-[url('/assets/bizen-hero-dashboard.png')] bg-cover bg-center lg:bg-right" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.99)_0%,rgba(255,255,255,0.94)_36%,rgba(255,255,255,0.60)_63%,rgba(255,255,255,0.12)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />

        <div className="relative mx-auto flex min-h-[calc(92vh-4rem)] max-w-7xl items-center px-4 pb-20 pt-12 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-sm font-semibold text-blue-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Nền tảng HRM & Payroll cho SME Đà Nẵng
            </div>
            <h1 className="animate-fade-up anim-delay-100 mt-6 text-4xl font-bold leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              Quản lý nhân sự, chấm công và tính lương trên một nền tảng.
            </h1>
            <p className="animate-fade-up anim-delay-200 mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              BIZEN giúp doanh nghiệp vừa và nhỏ số hóa quy trình HR: Face ID check-in, xếp ca AI, duyệt nghỉ phép, payroll tự động và báo cáo quản trị.
            </p>
            <div className="animate-fade-up anim-delay-300 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register-company" className="btn-motion inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30">
                Đăng ký doanh nghiệp
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-motion inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-white">
                <PlayCircle className="h-4 w-4" />
                Đăng nhập
              </Link>
            </div>
            <p className="animate-fade-up anim-delay-300 mt-3 text-sm text-slate-500">
              Khách hàng đăng ký trước → chủ nền tảng BIZEN duyệt → Admin công ty vận hành nội bộ.
            </p>

            <div className="animate-fade-up anim-delay-400 mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="motion-card rounded-lg border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur hover:shadow-soft">
                  <p className="text-2xl font-bold text-blue-700">{metric.value}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-sm font-semibold text-slate-500 sm:px-6 lg:px-8">
          <span className="transition-colors hover:text-blue-700">Sales</span>
          <span className="transition-colors hover:text-blue-700">Nhân sự</span>
          <span className="transition-colors hover:text-blue-700">Warehouse</span>
          <span className="transition-colors hover:text-blue-700">Admin</span>
          <span className="transition-colors hover:text-blue-700">Customer Support</span>
          <span className="transition-colors hover:text-blue-700">Payroll</span>
        </div>
      </section>

      <section id="solutions" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="animate-fade-up max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-normal text-blue-600">Giải pháp tất cả trong một</p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Một hệ thống cho mọi vai trò trong doanh nghiệp.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Mỗi người mở app lên là thấy ngay việc cần làm: Admin/nhân sự xử lý vận hành, quản lý theo dõi ca, nhân viên check-in và xem quyền lợi.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {solutionCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="motion-card group rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-soft">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-700 transition duration-300 group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="features" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="animate-fade-up">
            <p className="text-sm font-bold uppercase tracking-normal text-cyan-300">MVP demo (3 tính năng)</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">Pitch & Figma tập trung 3 luồng có trong sản phẩm.</h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Mỗi tính năng gắn một pain point SME và luồng bấm cụ thể — phù hợp demo live 10–15 phút.
            </p>
            <div className="mt-8 space-y-3">
              {featureTabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === index;
                return (
                  <button
                    key={tab.title}
                    type="button"
                    onClick={() => setActiveTab(index)}
                    className={`btn-motion flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left ${
                      isActive ? "border-blue-400 bg-blue-500/15 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="flex items-center gap-3 text-sm font-semibold">
                      <Icon className="h-5 w-5" />
                      {tab.title}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition ${isActive ? "rotate-180" : ""}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="animate-fade-up anim-delay-100 rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-2xl">
            <div key={featureTabs[activeTab].title} className="animate-panel-in rounded-lg bg-white p-4 text-slate-950">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-normal text-blue-600">Live workflow</p>
                  <h3 className="mt-1 text-xl font-bold">{featureTabs[activeTab].title}</h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Active</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{featureTabs[activeTab].content}</p>
              <WorkflowStepsCard
                className="mt-6 !border-slate-200 !bg-slate-50"
                title="Luồng người dùng"
                steps={featureTabs[activeTab].steps}
                skippable={featureTabs[activeTab].skippable}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="animate-fade-up">
            <p className="text-sm font-bold uppercase tracking-normal text-blue-600">Kịch bản demo live</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Thứ tự trình diễn gợi ý (10–15 phút).</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Dùng hai trình duyệt: một tab Platform Admin (bạn), một tab Admin công ty + cổng nhân viên.
            </p>
            <WorkflowStepsCard className="mt-6" title="Thứ tự demo" steps={demoScriptOrder} />
          </div>

          <div className="grid gap-4">
            {postMvpFeatures.map((item) => (
              <div key={item.title} className="motion-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-200">
                <Layers3 className="h-8 w-8 text-slate-400" />
                <h3 className="mt-3 text-lg font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                <span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Sau MVP</span>
              </div>
            ))}
            <div className="motion-card rounded-lg border border-blue-200 bg-blue-600 p-6 text-white shadow-soft">
              <BadgeCheck className="h-9 w-9 text-cyan-200" />
              <h3 className="mt-5 text-xl font-bold">Bắt đầu dùng BIZEN</h3>
              <p className="mt-2 text-sm leading-6 text-blue-50">Doanh nghiệp đăng ký — bạn duyệt tenant — triển khai cho khách trong vài phút.</p>
              <Link to="/register-company" className="btn-motion mt-6 inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50">
                Đăng ký doanh nghiệp
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="customers" className="bg-blue-50/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="animate-fade-up">
              <p className="text-sm font-bold uppercase tracking-normal text-blue-600">Khách hàng SME</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Thiết kế cho đội ngũ vận hành gọn.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Dashboard dễ đọc, không nhồi quá nhiều menu.",
                "Nhân viên chỉ cần một nút hành động chính mỗi ngày.",
                "Admin/nhân sự có bảng, bộ lọc và trạng thái rõ ràng.",
                "Quản lý nhận cảnh báo thiếu người và tăng ca."
              ].map((quote) => (
                <figure key={quote} className="motion-card rounded-lg border border-blue-100 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-soft">
                  <MessageSquareText className="h-6 w-6 text-blue-600" />
                  <blockquote className="mt-4 text-sm font-semibold leading-6 text-slate-700">“{quote}”</blockquote>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="consult" className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="animate-fade-up">
          <p className="text-sm font-bold uppercase tracking-normal text-blue-600">Đăng ký tư vấn</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Muốn triển khai BIZEN cho doanh nghiệp?</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Muốn dùng ngay? Chuyển sang form đăng ký doanh nghiệp — hệ thống tạo yêu cầu chờ bạn (chủ nền tảng) duyệt.
          </p>
          <Link to="/register-company" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800">
            Đi tới đăng ký doanh nghiệp
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-slate-700">
            <Headphones className="h-5 w-5 text-blue-600" />
            Demo, phân tích nghiệp vụ và roadmap kỹ thuật
          </div>
        </div>

        <form onSubmit={submitConsultation} className="animate-fade-up anim-delay-100 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
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
            Tên công ty
            <input
              value={form.company}
              onChange={(event) => setForm({ ...form, company: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Công ty SME tại Đà Nẵng"
            />
          </label>
          {formError ? <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{formError}</p> : null}
          {submitted ? <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Đã ghi nhận thông tin tư vấn.</p> : null}
          <button type="submit" className="btn-motion mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
            Gửi yêu cầu
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </section>

      <section id="faq" className="border-t border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-normal text-blue-600">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Câu hỏi thường gặp</h2>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="motion-card group rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-soft">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-slate-950">
                  {faq.question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-2xl font-bold text-white">BIZEN</p>
            <p className="mt-1 text-sm text-slate-400">Cloud HR & Payroll for SME Đà Nẵng</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-300">
            <Link to="/login" className="hover:text-white">
              Đăng nhập
            </Link>
            <Link to="/register-company" className="hover:text-white">
              Đăng ký doanh nghiệp
            </Link>
            <Link to="/register-employee" className="hover:text-white">
              Yêu cầu tài khoản NV
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

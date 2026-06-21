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
  ScanFace,
  Settings,
  ShieldCheck,
  UsersRound,
  X,
  Menu,
  ChevronDown,
  Sparkles,
  DollarSign,
  Briefcase,
  HelpCircle
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import SocialLinks from "../components/SocialLinks";

const navItems = [
  { label: "Tính năng", href: "#features" },
  { label: "Mobile app", to: "/mobile-guide" },
  { label: "Triển khai", href: "#rollout" },
  { label: "FAQ", href: "#faq" }
];

const metrics = [
  { value: "1-20", label: "nhân sự mỗi đơn vị" },
  { value: "GPS", label: "địa điểm chấm công" },
  { value: "Face ID", label: "xác minh nhân viên" },
  { value: "CSV", label: "xuất báo cáo ngay" }
];

const featureExamples = [
  {
    title: "Trang chủ quản lý",
    icon: Building2,
    example: "Chủ doanh nghiệp đăng nhập vào màn hình hub, chọn nhanh Nhân viên, Xếp ca, Chấm công, Bảng lương hoặc Báo cáo.",
    outcome: "Không bị đẩy thẳng vào dashboard, nhìn giống một hệ thống làm việc thật."
  },
  {
    title: "Nhân viên",
    icon: UsersRound,
    example: "Tạo hồ sơ pha chế, thu ngân, phục vụ, lương theo giờ, trạng thái đang làm hoặc nghỉ.",
    outcome: "Quản lý nắm được đội hiện tại trước khi xếp ca."
  },
  {
    title: "Xếp ca AI",
    icon: CalendarCheck2,
    example: "Doanh nghiệp đăng ký 8 nhân viên thì AI Suggest chỉ gợi ý quanh quy mô 8 người, không ép theo mẫu 20 người.",
    outcome: "Lịch ca sát thực tế hơn cho từng mô hình nhỏ."
  },
  {
    title: "Checklist ca làm",
    icon: ClipboardCheck,
    example: "Ca sáng cần setup bàn ghế trước 7:20, quét dọn trước 7:30. Làm xong nhân viên chụp ảnh và nộp.",
    outcome: "Hệ thống ghi nhận đúng giờ hoặc trễ giờ để quản lý kiểm tra."
  },
  {
    title: "Chấm công GPS",
    icon: MapPin,
    example: "Quản lý chọn địa chỉ làm việc, hệ thống lưu latitude, longitude và bán kính cho phép.",
    outcome: "Nhân viên check-in gần địa điểm làm việc mới được ghi nhận hợp lệ."
  },
  {
    title: "Face ID",
    icon: ScanFace,
    example: "Nhân viên đăng ký khuôn mặt, quản lý duyệt, sau đó dùng camera để chấm công.",
    outcome: "Giảm tình trạng chấm công hộ."
  },
  {
    title: "Nghỉ phép",
    icon: Clock3,
    example: "Nhân viên gửi yêu cầu nghỉ, quản lý duyệt hoặc từ chối kèm lý do.",
    outcome: "Lịch ca và công không bị lệch vì tin nhắn trôi trong Zalo."
  },
  {
    title: "Bảng lương",
    icon: CreditCard,
    example: "BIZEN gom giờ làm, OT và các bản ghi quên check-out cần quản lý chốt.",
    outcome: "Chốt lương có dữ liệu đối soát trước khi trả tiền."
  },
  {
    title: "Báo cáo",
    icon: FileText,
    example: "Xuất CSV chấm công, tổng quan vận hành hoặc báo cáo nhân sự theo bộ phận.",
    outcome: "Có file thật để gửi kế toán hoặc lưu nội bộ."
  },
  {
    title: "Cài đặt doanh nghiệp",
    icon: Settings,
    example: "Thiết lập giờ làm chuẩn, grace period, vị trí GPS, công thức lương và bộ phận.",
    outcome: "Mỗi doanh nghiệp có cấu hình riêng thay vì dùng một mẫu cứng."
  }
];

const rolloutSteps = [
  {
    title: "Đăng ký Cửa hàng",
    desc: "Doanh nghiệp điền tên quán, số điện thoại, quy mô nhân sự và nhận ngay không gian làm việc (workspace) riêng biệt qua Email."
  },
  {
    title: "Duyệt & Cấp tài khoản",
    desc: "Hệ thống BIZEN kiểm duyệt thông tin đăng ký nhanh chóng, khởi tạo cơ sở dữ liệu riêng (tenant) và cấp tài khoản chủ sở hữu."
  },
  {
    title: "Thiết lập Vận hành",
    desc: "Chủ quán cấu hình vị trí GPS chấm công, tạo ca làm chuẩn, các phòng ban và thêm thông tin nhân viên kèm mức lương theo giờ."
  },
  {
    title: "Nhân viên Đăng nhập di động",
    desc: "Nhân viên cài đặt ứng dụng di động dạng PWA tiện lợi, đăng ký khuôn mặt Face ID và xem lịch làm việc của mình."
  },
  {
    title: "Vận hành & Xuất báo cáo",
    desc: "Nhân viên chấm công hàng ngày bằng Face ID, làm checklist ca. Cuối tháng hệ thống tự tính lương, quản lý duyệt và xuất báo cáo CSV."
  }
];

const faqs = [
  {
    question: "BIZEN phù hợp nhất với mô hình nào?",
    answer: "Doanh nghiệp vận hành theo ca dưới 20 nhân sự như quán F&B, phòng khám, spa, xưởng, shop bán lẻ hoặc dịch vụ nhỏ cần quản lý ca làm, chấm công, lương và checklist công việc."
  },
  {
    question: "Checklist ca làm có phải KPI không?",
    answer: "Không. Đây là danh sách việc cần làm theo ca, giống todolist vận hành có deadline và ảnh minh chứng thực tế, giúp công việc trôi chảy và nhân sự tự giác."
  },
  {
    question: "Có dùng dữ liệu thật được không?",
    answer: "Có. Dữ liệu nhân viên, ca làm, chấm công, nghỉ phép, bảng lương và checklist đều đi qua API/backend thời gian thực thay vì chỉ hiển thị giao diện tĩnh."
  }
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", company: "" });
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // States for interactive widgets
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState("dashboard");
  const [numStaff, setNumStaff] = useState(12);
  const [hourlyWage, setHourlyWage] = useState(25);

  function closeMenu() {
    setMobileMenuOpen(false);
  }

  function submitConsultation(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.company.trim() || form.phone.replace(/\D/g, "").length < 9) {
      setSubmitted(false);
      setFormError("Vui lòng nhập tên, tên doanh nghiệp và số điện thoại hợp lệ.");
      return;
    }
    setFormError("");
    setSubmitted(true);
  }

  // Calculate savings values
  const hoursSaved = Math.round(numStaff * 2.8);
  const moneySaved = Math.round(numStaff * 125 * 1000).toLocaleString("vi-VN");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 font-sans selection:bg-brand-100 selection:text-brand-900">
      <SocialLinks />
      
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" onClick={closeMenu} className="flex items-center gap-3">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
            {navItems.map((item) => (
              item.to ? (
                <Link key={item.to} to={item.to} className="py-2 hover:text-slate-950 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <a key={item.href} href={item.href} className="py-2 hover:text-slate-950 transition-colors">
                  {item.label}
                </a>
              )
            ))}
            <Link to="/guide" className="py-2 text-brand-600 hover:text-brand-700 font-bold transition-colors">
              Hướng dẫn A-Z
            </Link>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
              Đăng nhập
            </Link>
            <Link to="/register-company" className="brand-button btn-motion inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold">
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

        {/* Mobile dropdown menu */}
        {mobileMenuOpen ? (
          <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-sm lg:hidden">
            <nav className="mx-auto grid max-w-7xl gap-2 text-sm font-semibold text-slate-700">
              {navItems.map((item) => (
                item.to ? (
                  <Link key={item.to} to={item.to} onClick={closeMenu} className="rounded-lg px-3 py-2 hover:bg-slate-100">
                    {item.label}
                  </Link>
                ) : (
                  <a key={item.href} href={item.href} onClick={closeMenu} className="rounded-lg px-3 py-2 hover:bg-slate-100">
                    {item.label}
                  </a>
                )
              ))}
              <Link to="/guide" onClick={closeMenu} className="rounded-lg px-3 py-2 text-brand-600 font-bold hover:bg-brand-50">
                Hướng dẫn A-Z
              </Link>
              <Link to="/login" onClick={closeMenu} className="rounded-lg px-3 py-2 hover:bg-slate-100">
                Đăng nhập
              </Link>
              <Link to="/register-company" onClick={closeMenu} className="brand-button rounded-lg px-3 py-2 text-white">
                Đăng ký doanh nghiệp
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[92vh] overflow-hidden pt-20 bg-white border-b border-slate-200 flex items-center">
        {/* Glow Background Elements */}
        <div className="ambient-grid pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
        <div className="absolute right-0 top-1/4 h-[350px] w-[350px] rounded-full bg-brand-100/40 blur-3xl -z-10" />
        <div className="absolute left-1/4 bottom-10 h-[300px] w-[300px] rounded-full bg-violet-100/35 blur-3xl -z-10" />
        <div className="absolute inset-x-0 bottom-0 h-42 bg-gradient-to-t from-slate-50 via-slate-50/70 to-transparent" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <span className="brand-eyebrow inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-brand-50 text-brand-700">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                Số hóa Nhân sự tinh gọn & Hiệu quả
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                Vận hành tinh gọn. <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-violetbrand-600">Quản trị tối ưu</span> cùng BIZEN.
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-slate-500 max-w-xl mx-auto lg:mx-0">
                BIZEN là giải pháp tất-cả-trong-một giúp cửa hàng dưới 20 nhân viên tự động hóa lập lịch ca bằng AI, chấm công chuẩn vị trí GPS & Face ID, kiểm soát việc đầu ca bằng checklist và tính bảng lương tự động chỉ trong 3 giây.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 pt-2">
                <Link to="/register-company" className="brand-button btn-motion inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold shadow-md">
                  Đăng ký dùng thử miễn phí
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/guide" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition">
                  Xem Hướng dẫn A-Z
                </Link>
                <Link to="/mobile-guide" className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-6 py-3.5 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-100/50 transition">
                  Cổng di động
                </Link>
              </div>

              {/* Metrics cards inside Hero */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-lg mx-auto lg:mx-0">
                {metrics.map((metric) => (
                  <div key={metric.label} className="premium-card rounded-xl p-3 text-left">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">{metric.value}</p>
                    <p className="mt-1.5 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Hero Content: Live Showcase Widget */}
            <div className="lg:col-span-6">
              <div className="premium-card rounded-3xl border border-slate-200 bg-white shadow-strong p-4 sm:p-6 space-y-4 max-w-xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-brand-50 rounded-full blur-2xl" />
                
                {/* Showcase Header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Demo Tính năng Trực quan</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">bizen.vn/demo-board</span>
                </div>

                {/* Showcase Tabs */}
                <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                  {["dashboard", "schedule", "attendance", "checklist"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveShowcaseTab(tab)}
                      className={`rounded-lg py-1.5 px-0.5 text-center text-[10px] sm:text-xs font-bold transition ${
                        activeShowcaseTab === tab ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {tab === "dashboard" && "Tổng quan"}
                      {tab === "schedule" && "Lịch ca"}
                      {tab === "attendance" && "Chấm công"}
                      {tab === "checklist" && "Checklist"}
                    </button>
                  ))}
                </div>

                {/* Showcase Content */}
                <div className="min-h-[190px] flex flex-col justify-center bg-slate-50/50 rounded-2xl p-4 border border-slate-100 transition-all duration-300">
                  
                  {activeShowcaseTab === "dashboard" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Trạng thái Cửa hàng hôm nay</span>
                        <span className="text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded font-semibold">Tốt</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex items-center gap-2">
                          <UsersRound className="h-5 w-5 text-brand-600 shrink-0" />
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase">Đang làm việc</span>
                            <span className="text-sm font-bold text-slate-800">8 / 10 NV</span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex items-center gap-2">
                          <ClipboardCheck className="h-5 w-5 text-violet-600 shrink-0" />
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase">Checklist ca</span>
                            <span className="text-sm font-bold text-slate-800">85% hoàn tất</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-lg font-medium">
                        <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                        Đã xác thực vị trí định vị GPS hoạt động ổn định.
                      </div>
                    </div>
                  )}

                  {activeShowcaseTab === "schedule" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Lịch tuần này (Đã tối ưu hóa)</span>
                        <span className="rounded bg-violet-100 text-violet-800 text-[8px] font-bold px-1.5 py-0.5 flex items-center gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI Suggest
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-lg border border-slate-100 bg-white p-2.5 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-[11px] font-bold text-slate-700">Ca Sáng (07:00 - 12:00)</p>
                            <p className="text-[9px] text-slate-400">Pha chế: Nguyễn Lan | Phục vụ: Trần Nam</p>
                          </div>
                          <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">Đầy</span>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-white p-2.5 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-[11px] font-bold text-slate-700">Ca Chiều (12:00 - 17:00)</p>
                            <p className="text-[9px] text-slate-400">Pha chế: Hoàng Hoa | Thu ngân: Bùi Minh</p>
                          </div>
                          <span className="text-[9px] bg-brand-50 text-brand-600 border border-brand-100 font-bold px-1.5 py-0.5 rounded">Đã gán</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeShowcaseTab === "attendance" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-xs font-bold text-slate-700">Nhật ký chấm công Face ID mới nhất</span>
                        <span className="text-[9px] text-slate-400">Thời gian thực</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-2 flex justify-between items-center">
                          <div className="flex gap-2 items-center">
                            <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-[9px] text-emerald-800">NL</div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-800">Nguyễn Lan</p>
                              <p className="text-[8px] text-slate-400">Check-in: 06:58 (Đúng giờ)</p>
                            </div>
                          </div>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Khớp Face ID</span>
                        </div>
                        <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-2 flex justify-between items-center">
                          <div className="flex gap-2 items-center">
                            <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-[9px] text-emerald-800">TN</div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-800">Trần Nam</p>
                              <p className="text-[8px] text-slate-400">Check-in: 06:59 (Đúng giờ)</p>
                            </div>
                          </div>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Khớp Face ID</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeShowcaseTab === "checklist" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Checklist công việc ca sáng</span>
                        <span className="text-[9px] text-slate-400">Nghiệm thu ảnh</span>
                      </div>
                      <div className="space-y-2 text-[10px] text-slate-600">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                          <span className="flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            Quét dọn & vệ sinh quầy pha chế
                          </span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">Ảnh: Đã nộp</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                          <span className="flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            Setup máy cà phê & kiểm tra đá
                          </span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">Ảnh: Đã nộp</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <span className="h-3.5 w-3.5 rounded-full border border-slate-200" />
                            Bàn giao két quỹ thu ngân đầu ca
                          </span>
                          <span className="text-[8px] bg-slate-100 text-slate-400 px-1 rounded">Chờ check-out</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Section Grid */}
      <section id="features" className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-0.5 rounded">Tính năng chính</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Quản lý hiệu quả, vận hành chuyên nghiệp</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              BIZEN thay thế các công việc hành chính rườm rà trên giấy tờ hay tin nhắn trôi lạc bằng giao diện tập trung và hành động thực tế.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureExamples.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="premium-card rounded-2xl p-5 bg-white space-y-3 motion-card">
                  <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{feature.example}</p>
                  <div className="border-t border-slate-100 pt-2 flex items-start gap-1.5 text-xs text-slate-700">
                    <span className="text-emerald-600 font-bold shrink-0">✓ Kết quả:</span>
                    <span className="italic text-slate-600">{feature.outcome}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Operations Value Calculator Section */}
      <section className="bg-white py-16 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute left-0 bottom-0 h-40 w-40 bg-brand-50 rounded-full blur-3xl -z-10" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left side: explanation */}
            <div className="lg:col-span-5 space-y-4 text-center lg:text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-0.5 rounded">Công cụ đo lường</span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Tính toán Giá trị Tiết kiệm cùng BIZEN</h2>
              <p className="text-sm leading-relaxed text-slate-500">
                Hãy kéo các thanh trượt điều chỉnh số lượng nhân viên và mức lương của cửa hàng cậu để xem BIZEN giúp cậu tiết kiệm bao nhiêu chi phí thất thoát và thời gian quản lý mỗi tháng.
              </p>
            </div>

            {/* Right side: Interactive Calculator widget */}
            <div className="lg:col-span-7 premium-card rounded-3xl bg-slate-50/50 p-5 sm:p-8 border border-slate-200 shadow-soft max-w-2xl mx-auto w-full">
              <div className="space-y-6">
                
                {/* Sliders container */}
                <div className="space-y-5">
                  {/* Slider 1: Staff count */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-slate-700">Số lượng nhân sự:</span>
                      <span className="text-brand-600 font-bold text-base">{numStaff} nhân viên</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="30"
                      value={numStaff}
                      onChange={(e) => setNumStaff(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>3 NV</span>
                      <span>15 NV</span>
                      <span>30 NV</span>
                    </div>
                  </div>

                  {/* Slider 2: Wage */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-slate-700">Lương trung bình theo giờ:</span>
                      <span className="text-brand-600 font-bold text-base">{hourlyWage}.000 đ/giờ</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="60"
                      value={hourlyWage}
                      onChange={(e) => setHourlyWage(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>15k/h</span>
                      <span>35k/h</span>
                      <span>60k/h</span>
                    </div>
                  </div>
                </div>

                {/* Calculation Outputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-5">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 flex gap-3 items-start shadow-sm">
                    <Clock3 className="h-6 w-6 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thời gian quản lý tiết kiệm</span>
                      <span className="text-xl font-extrabold text-slate-900">{hoursSaved} giờ / tháng</span>
                      <p className="text-[10px] text-slate-500 mt-1">Từ việc phân ca AI và tự chốt bảng lương.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4 flex gap-3 items-start shadow-sm">
                    <DollarSign className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ngăn thất thoát / Tiết kiệm</span>
                      <span className="text-xl font-extrabold text-emerald-600">~ {moneySaved} đ / tháng</span>
                      <p className="text-[10px] text-slate-500 mt-1">Nhờ chống đi trễ, chấm công hộ & sai số.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-brand-50 border border-brand-100 p-3 text-[11px] text-brand-800 flex gap-2 justify-center items-center">
                  <Sparkles className="h-4 w-4 text-brand-600 animate-pulse" />
                  <span>BIZEN giúp giảm 95% thời gian chốt lương thủ công của chủ cửa hàng.</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Rollout Steps Section with Visual Stepper */}
      <section id="rollout" className="bg-slate-900 text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-brand-600/10 rounded-full blur-3xl" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-300 bg-white/10 px-2 py-0.5 rounded">Triển khai dễ dàng</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">5 bước đưa BIZEN vào vận hành ngay</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Quy trình thiết lập tối giản, đủ gọn nhẹ để cậu đem ra cửa hàng test vận hành thật chỉ trong một buổi làm việc.
            </p>
          </div>

          {/* Visual Vertical Stepper */}
          <div className="mt-12 relative border-l-2 border-white/20 ml-4 pl-6 sm:pl-10 space-y-8 max-w-4xl py-2">
            {rolloutSteps.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Step node */}
                <span className="absolute -left-[37px] sm:-left-[53px] top-1 flex h-6 sm:h-8 w-6 sm:w-8 items-center justify-center rounded-full bg-slate-900 border-2 border-brand-500 text-xs sm:text-sm font-extrabold text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-colors duration-200 shadow-md">
                  {idx + 1}
                </span>
                
                {/* Step Card */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 hover:bg-white/10 transition-colors duration-300">
                  <h3 className="font-bold text-white text-base sm:text-lg">{step.title}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section with custom React State Accordions */}
      <section id="faq" className="bg-slate-50 py-16 border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-0.5 rounded">Giải đáp thắc mắc</span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Câu hỏi thường gặp</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">Tìm câu trả lời nhanh cho các lo lắng phổ biến trước khi đăng ký</p>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-slate-800 hover:bg-slate-50 transition text-sm sm:text-base gap-4"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown className={`h-4.5 w-4.5 text-slate-400 shrink-0 transition-transform duration-300 ${activeFaq === idx ? "rotate-180 text-brand-600" : ""}`} />
                </button>
                
                {activeFaq === idx && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50 text-xs sm:text-sm text-slate-600 leading-relaxed animate-[fadeIn_0.2s_ease-out]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-2xl font-bold text-slate-950">BIZEN</p>
            <p className="mt-1 text-sm text-slate-500">Cloud HR & Payroll for SME Đà Nẵng</p>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
              <Link to="/guide" className="text-brand-600 hover:text-brand-700 font-bold">
                Tài liệu Hướng dẫn
              </Link>
              <Link to="/login" className="hover:text-slate-950 transition-colors">
                Đăng nhập
              </Link>
              <Link to="/register-company" className="hover:text-slate-950 transition-colors">
                Đăng ký doanh nghiệp
              </Link>
              <Link to="/mobile-guide" className="hover:text-slate-950 transition-colors">
                Hướng dẫn mobile
              </Link>
            </div>
            <SocialLinks variant="footer" />
          </div>
        </div>
      </footer>
    </main>
  );
}

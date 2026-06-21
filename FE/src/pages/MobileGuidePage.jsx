import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  Home,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
  Info,
  ChevronRight,
  Sparkles,
  Share2,
  PlusSquare,
  AlertTriangle,
  Play
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import SocialLinks from "../components/SocialLinks";

export default function MobileGuidePage() {
  const [activeTab, setActiveTab] = useState("ios"); // "ios" | "android"
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadState, setDownloadState] = useState("idle"); // "idle" | "downloading" | "done"
  const [activeIosStep, setActiveIosStep] = useState(0);
  const [activeAndroidStep, setActiveAndroidStep] = useState(0);

  const simulateDownload = (e) => {
    e.preventDefault();
    if (downloadState !== "idle") return;

    setDownloadState("downloading");
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadState("done");
          // Trigger actual file download
          window.location.href = "/downloads/bizen-android-demo.apk";
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const iosSteps = [
    {
      title: "1. Mở bằng trình duyệt Safari",
      detail: "Mở trình duyệt Safari trên iPhone và truy cập link đăng nhập di động của BIZEN. Tránh sử dụng các trình duyệt tích hợp (nhúng) của Facebook, Zalo vì chúng giới hạn chức năng hệ thống.",
      mockup: (
        <div className="space-y-2 h-full flex flex-col justify-between">
          <div className="bg-slate-100 rounded-lg p-1.5 flex items-center justify-between text-[8px] text-slate-500 font-mono">
            <span className="truncate">bizen.vn/mobile/login</span>
            <span className="shrink-0 text-slate-400">↻</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center border border-slate-100 rounded-lg p-2 bg-slate-50/50">
            <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-xs mb-1">B</div>
            <p className="text-[10px] font-bold text-slate-800">Cổng đăng nhập BIZEN</p>
            <p className="text-[8px] text-slate-400 mt-0.5">Vui lòng đăng nhập...</p>
          </div>
          <div className="bg-slate-100 h-7 rounded-lg flex items-center justify-around text-slate-400 text-xs px-2 select-none border-t border-slate-200 shrink-0">
            <span>◀</span>
            <span>▶</span>
            <span className="text-brand-600 animate-bounce"><Share2 className="h-3.5 w-3.5" /></span>
            <span>📖</span>
            <span>📑</span>
          </div>
        </div>
      )
    },
    {
      title: "2. Chọn chức năng Chia sẻ (Share)",
      detail: "Bấm vào biểu tượng Chia sẻ (hình vuông có mũi tên chỉ lên) ở thanh công cụ phía dưới cùng của trình duyệt Safari để mở rộng các tùy chọn cài đặt hệ thống.",
      mockup: (
        <div className="h-full flex flex-col justify-end bg-slate-800/5 rounded-xl p-2 relative">
          <div className="absolute inset-x-2 top-2 bg-white rounded-lg p-3 shadow-md border border-slate-100 space-y-2 animate-[slideUp_0.3s_ease-out]">
            <p className="text-[9px] font-bold text-slate-800">Tùy chọn Safari</p>
            <div className="space-y-1.5 text-[8px] text-slate-600">
              <div className="p-1 hover:bg-slate-50 rounded flex justify-between">
                <span>Thêm dấu trang</span>
                <span>★</span>
              </div>
              <div className="p-1 hover:bg-slate-50 rounded flex justify-between">
                <span>Thêm vào danh sách đọc</span>
                <span>📖</span>
              </div>
              <div className="p-1 bg-brand-50 text-brand-700 rounded flex justify-between font-bold border border-brand-100 animate-pulse">
                <span className="flex items-center gap-1">
                  <PlusSquare className="h-3.5 w-3.5 text-brand-600" />
                  Thêm vào MH chính (Add to Home)
                </span>
                <span>＋</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-100 h-7 rounded-lg flex items-center justify-around text-slate-400 text-xs px-2 border-t border-slate-200 w-full shrink-0">
            <span>◀</span>
            <span>▶</span>
            <span className="text-brand-600 font-bold"><Share2 className="h-3.5 w-3.5" /></span>
            <span>📖</span>
            <span>📑</span>
          </div>
        </div>
      )
    },
    {
      title: "3. Thêm vào Màn hình chính",
      detail: "Tìm và chọn mục 'Thêm vào MH chính' (Add to Home Screen). Đặt tên hiển thị của ứng dụng là BIZEN rồi nhấn 'Thêm' (Add). Ứng dụng sẽ xuất hiện trên màn hình điện thoại của bạn.",
      mockup: (
        <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Màn hình chính điện thoại</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1 flex flex-col items-center opacity-40">
              <div className="h-8 w-8 rounded-lg bg-blue-500" />
              <span className="text-[7px]">Safari</span>
            </div>
            <div className="space-y-1 flex flex-col items-center animate-[scaleUp_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white ring-2 ring-brand-100">
                B
              </div>
              <span className="text-[8px] font-bold text-slate-700">BIZEN</span>
            </div>
            <div className="space-y-1 flex flex-col items-center opacity-40">
              <div className="h-8 w-8 rounded-lg bg-green-500" />
              <span className="text-[7px]">Tin nhắn</span>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-100 p-1.5 text-[8px] text-emerald-800 font-bold">
            ✓ Đã cài đặt xong! Mở app để chấm công.
          </div>
        </div>
      )
    }
  ];

  const androidSteps = [
    {
      title: "Cách 1: Cài đặt PWA qua Google Chrome (Khuyên dùng)",
      detail: "Mở trình duyệt Google Chrome trên điện thoại, truy cập đường dẫn di động của cửa hàng. Nhấp vào dấu 3 chấm góc trên bên phải, chọn 'Cài đặt ứng dụng' (Install App) để tự động thêm biểu tượng BIZEN ra màn hình chính di động.",
      mockup: (
        <div className="space-y-2 h-full flex flex-col justify-between">
          <div className="bg-slate-100 rounded-lg p-1.5 flex items-center justify-between text-[8px] text-slate-500 font-mono">
            <span className="truncate">bizen.vn/mobile/login</span>
            <span className="font-bold text-slate-600">⋮</span>
          </div>
          <div className="absolute right-4 top-10 bg-white rounded-lg p-2.5 shadow-md border border-slate-100 space-y-1.5 text-[8px] text-slate-600 z-10 w-28 animate-[fadeIn_0.2s_ease-out]">
            <div className="p-0.5 hover:bg-slate-50 rounded">Thẻ mới</div>
            <div className="p-0.5 hover:bg-slate-50 rounded">Tải xuống</div>
            <div className="p-0.5 bg-brand-50 text-brand-700 rounded font-bold border border-brand-100 animate-pulse">Cài đặt ứng dụng</div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center border border-slate-100 rounded-lg p-2 bg-slate-50/50">
            <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-xs mb-1">B</div>
            <p className="text-[10px] font-bold text-slate-800">Cổng di động BIZEN</p>
          </div>
        </div>
      )
    },
    {
      title: "Cách 2: Cài đặt file APK (Bản Demo nhanh)",
      detail: "Tải file cài đặt APK di động trực tiếp từ BIZEN. Khi cài đặt lần đầu, Android sẽ yêu cầu cho phép 'Cài đặt ứng dụng không rõ nguồn gốc'. Hãy bật quyền này cho trình duyệt Chrome để quá trình cài đặt tự động diễn ra.",
      mockup: (
        <div className="h-full flex flex-col justify-center bg-slate-50 rounded-xl p-3 space-y-3">
          <p className="text-[9px] font-bold text-slate-700">Cài đặt bảo mật hệ thống</p>
          <div className="rounded border border-amber-200 bg-amber-50 p-2 text-[8px] text-amber-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Cho phép nguồn này?
            </p>
            <p>Để cài đặt file APK, vui lòng cấp quyền cài đặt ứng dụng cho Google Chrome.</p>
            <div className="flex justify-between items-center border-t border-amber-200/50 pt-1.5 mt-1">
              <span>Cho phép ứng dụng từ nguồn này</span>
              <span className="h-4 w-7 rounded-full bg-brand-600 flex items-center justify-end px-0.5 transition"><span className="h-3 w-3 rounded-full bg-white" /></span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans selection:bg-brand-100 selection:text-brand-900">
      <SocialLinks />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo />
            <span className="hidden sm:inline-block h-4 w-px bg-slate-200" />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Smartphone className="h-3.5 w-3.5 text-brand-600" />
              Hướng dẫn Mobile App
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
              Trang chủ
            </Link>
            <Link to="/login" className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex transition">
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 py-12 sm:py-16">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(23,103,255,0.04)_0%,rgba(103,87,255,0.03)_100%)]" />
        <div className="absolute right-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-brand-100/30 blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="brand-eyebrow inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            Vận hành gọn nhẹ trên di động
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Cài đặt Biểu tượng BIZEN Mobile
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Hướng dẫn chi tiết từng bước tải và cài đặt biểu tượng BIZEN lên màn hình điện thoại của nhân viên để chấm công Face ID và nhận lịch làm việc hàng ngày.
          </p>
        </div>
      </section>

      {/* Main Content: OS tabs */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        
        {/* Toggle tabs */}
        <div className="flex justify-center max-w-md mx-auto bg-slate-200/60 p-1.5 rounded-xl border border-slate-200 mb-10">
          <button
            onClick={() => setActiveTab("ios")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === "ios" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span></span>
            <span>iPhone / iPad (iOS)</span>
          </button>
          <button
            onClick={() => setActiveTab("android")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === "android" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Android</span>
          </button>
        </div>

        {/* Dynamic content rendering */}
        {activeTab === "ios" ? (
          /* iOS Setup Guide */
          <div className="space-y-12 max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2 py-0.5 rounded">Cài đặt PWA Safari</span>
              <h2 className="text-2xl font-bold text-slate-900">Cách cài biểu tượng BIZEN trên iOS</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Hệ điều hành iOS không hỗ trợ cài file APK trực tiếp. BIZEN sử dụng công nghệ Progressive Web App (PWA) để cài đặt trực tiếp thông qua trình duyệt Safari vô cùng an toàn và nhanh chóng.
              </p>
            </div>

            {/* Stepper with CSS phone mockups */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {iosSteps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveIosStep(idx)}
                  className={`premium-card rounded-2xl p-5 bg-white border transition-all duration-300 cursor-pointer ${
                    activeIosStep === idx ? "border-brand-500 ring-4 ring-brand-100/50 shadow-md" : "border-slate-200 opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* CSS Smartphone Mockup */}
                  <div className="border-4 border-slate-800 rounded-[1.5rem] bg-slate-950 shadow-lg overflow-hidden aspect-[9/16] w-full max-w-[170px] mx-auto p-1.5 flex flex-col justify-between mb-5 relative">
                    {/* Notch/Dynamic Island */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-2.5 w-12 bg-slate-800 rounded-full z-20" />
                    
                    {/* Simulated Content */}
                    <div className="bg-white flex-1 rounded-[1.1rem] overflow-hidden p-2 relative">
                      {step.mockup}
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-800">{step.title}</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{step.detail}</p>
                </div>
              ))}
            </div>

            {/* iOS Important warning */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 max-w-3xl mx-auto flex gap-3 items-start">
              <ShieldCheck className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                <strong>Đường dẫn gửi cho nhân sự sử dụng iOS:</strong>{" "}
                <a
                  href="/mobile/login"
                  className="font-bold text-blue-700 hover:underline inline-flex items-center gap-0.5"
                >
                  /mobile/login <ExternalLink className="h-3 w-3" />
                </a>
                <p className="text-slate-500 text-xs mt-1">
                  Nhân viên chỉ cần nhấp vào link trên trình duyệt Safari của iPhone, thực hiện 3 bước trên là đã có app BIZEN sẵn sàng chấm công ngoài màn hình chính.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Android Setup Guide */
          <div className="space-y-12 max-w-5xl mx-auto">
            
            {/* Split layout: Download APK and PWA Install */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Option 1: Premium APK Download Card (Left) */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-soft space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-50 rounded-full blur-3xl -z-10" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 self-start px-2 py-0.5 rounded">Bản Demo Nhanh</span>
                <h3 className="text-lg font-bold text-slate-900">Cách 1: Tải File APK Android</h3>
                <p className="text-xs leading-relaxed text-slate-500">
                  Dành cho chủ cửa hàng và nhân sự muốn cài đặt nhanh tệp ứng dụng `.apk` để dùng thử demo tính năng chấm công Face ID trực tiếp trên các dòng máy Android.
                </p>

                {/* Animated Simulated Download Button */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">bizen-android-demo.apk</span>
                    <span className="font-mono text-slate-400">12.4 MB</span>
                  </div>

                  {downloadState === "idle" && (
                    <button
                      onClick={simulateDownload}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white font-bold py-2.5 text-xs shadow hover:bg-emerald-700 transition btn-motion"
                    >
                      <Download className="h-4 w-4" />
                      Tải Xuống APK Demo
                    </button>
                  )}

                  {downloadState === "downloading" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                        <span>Đang tải xuống...</span>
                        <span>{downloadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-200"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {downloadState === "done" && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-center text-xs font-bold text-emerald-800 flex gap-2 justify-center items-center">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Tải hoàn tất! Kiểm tra thư mục Tải về.
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Các bước cài đặt APK:</span>
                  <ol className="list-decimal pl-4 text-xs text-slate-500 space-y-1">
                    <li>Bấm tải file APK ở trên về máy.</li>
                    <li>Mở file và chọn **Cài đặt**.</li>
                    <li>Nếu máy hỏi bảo mật nguồn gốc, chọn **Cho phép cài đặt từ nguồn này** (như Chrome).</li>
                  </ol>
                </div>
              </div>

              {/* Option 2: Chrome PWA Guide (Right) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2 py-0.5 rounded">Cài đặt PWA Chrome</span>
                  <h3 className="text-xl font-bold text-slate-900">Cách 2: Thêm Biểu Tượng BIZEN từ Google Chrome</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Đây là phương án cài đặt tốt nhất cho máy Android. Chỉ cần mở link bằng Chrome rồi ghim ứng dụng ra màn hình chính, app sẽ chạy mượt mà như app gốc mà không cần lo lắng về cảnh báo bảo mật.
                  </p>
                </div>

                {/* Steps Accordion for Android Chrome */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {androidSteps.map((step, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveAndroidStep(idx)}
                      className={`premium-card rounded-2xl p-4 bg-white border transition-all duration-300 cursor-pointer ${
                        activeAndroidStep === idx ? "border-brand-500 ring-4 ring-brand-100/50 shadow-md" : "border-slate-200 opacity-80"
                      }`}
                    >
                      {/* Simulated Phone UI */}
                      <div className="border-4 border-slate-800 rounded-[1.2rem] bg-slate-950 shadow-md overflow-hidden aspect-[4/3] w-full max-w-[190px] mx-auto p-1 flex flex-col justify-between mb-4 relative">
                        <div className="bg-white flex-1 rounded-[0.9rem] overflow-hidden p-1.5 relative">
                          {step.mockup}
                        </div>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">{step.title}</h4>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{step.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </section>

      {/* Helpful Tips Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-slate-200 bg-white">
        <h3 className="text-center text-lg font-bold text-slate-900 mb-8">Một số lưu ý khi sử dụng BIZEN trên điện thoại</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm space-y-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Smartphone className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">Mở quyền vị trí GPS</h4>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500">
              Khi mở ứng dụng lần đầu, điện thoại sẽ hỏi quyền truy cập vị trí. Vui lòng chọn "Cho phép khi dùng ứng dụng" để chấm công đúng quy định GPS của cửa hàng.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm space-y-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">Mở quyền truy cập Camera</h4>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500">
              Công nghệ Face ID yêu cầu chụp ảnh quét khuôn mặt. BIZEN cam kết không lưu trữ dữ liệu cá nhân ngoài việc so khớp sinh trắc học chấm công nội bộ của doanh nghiệp.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm space-y-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Download className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">Tài khoản & Đăng nhập</h4>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500">
              Mỗi nhân viên sẽ có thông tin tài khoản do Chủ quán cấp (SĐT và mật khẩu riêng). Liên hệ trực tiếp quản lý của bạn để nhận thông tin này.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8 space-y-2">
          <p>© 2026 BIZEN. Bản quyền thuộc về Google DeepMind Advanced Agentic Coding Team.</p>
          <div className="flex justify-center gap-4 text-[11px] font-semibold">
            <Link to="/" className="hover:text-slate-900">Trang chủ BIZEN</Link>
            <span className="text-slate-300">|</span>
            <Link to="/login" className="hover:text-slate-900">Đăng nhập</Link>
            <span className="text-slate-300">|</span>
            <Link to="/register-company" className="hover:text-slate-900">Đăng ký</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Building2,
  UsersRound,
  CalendarCheck2,
  Clock3,
  CreditCard,
  FileText,
  MapPin,
  ScanFace,
  ClipboardCheck,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  Laptop,
  ChevronRight,
  Info,
  ExternalLink,
  BookOpen,
  Activity,
  CheckSquare,
  ShieldCheck,
  Search,
  ChevronDown
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import { getAuthUser } from "../modules/auth/authStore";

export default function UserGuidePage() {
  const user = getAuthUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSteps, setExpandedSteps] = useState({ 0: true }); // Step 1 open by default

  const toggleStep = (index) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const expandAll = () => {
    const all = {};
    stepsData.forEach((_, idx) => {
      all[idx] = true;
    });
    setExpandedSteps(all);
  };

  const collapseAll = () => {
    setExpandedSteps({});
  };

  const scrollToAndExpandStep = (idx) => {
    // Expand the step
    setExpandedSteps((prev) => ({
      ...prev,
      [idx]: true
    }));

    // Scroll to it
    setTimeout(() => {
      const element = document.getElementById(`step-card-${idx}`);
      if (element) {
        const offset = 85; // height of header + margins
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }, 100);
  };

  // Chronological 13-step A-to-Z Workflow
  const stepsData = [
    {
      title: "Đăng ký Doanh nghiệp mới",
      role: "Chủ quán",
      roleType: "owner",
      icon: Building2,
      desc: "Chủ cửa hàng thiết lập và đăng ký doanh nghiệp của mình trên trang BIZEN để bắt đầu tự động hóa quy trình quản lý.",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Quy trình bắt đầu bằng việc chủ cửa hàng đăng ký thông tin doanh nghiệp. Đây là bước khởi tạo không gian làm việc (workspace/tenant) riêng trên đám mây của BIZEN.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Truy cập trang chủ BIZEN và bấm <strong>Đăng ký Doanh nghiệp</strong>.</li>
            <li>Điền đầy đủ thông tin: Tên chủ cửa hàng, Tên cửa hàng, Email nhận tài khoản, Số điện thoại và Quy mô nhân viên dự kiến (ví dụ: 1-20 nhân viên).</li>
            <li>Nhấn <strong>Gửi thông tin</strong>. Hệ thống sẽ tiếp nhận và chuyển tiếp yêu cầu đến ban quản trị hệ thống.</li>
          </ol>
          <div className="rounded-lg bg-blue-50 p-3 border border-blue-100 mt-2">
            <span className="font-bold text-blue-800 text-xs block mb-1">💡 Mẹo nhỏ:</span>
            Mức quy mô nhân viên bạn đăng ký sẽ giúp BIZEN tối ưu hóa các thuật toán đề xuất ca làm bằng AI, đảm bảo hiệu suất tính toán nhanh và giao diện tinh gọn nhất.
          </div>
        </div>
      ),
      mockupType: "web",
      mockupTitle: "Giao diện Đăng ký Doanh nghiệp",
      mockupContent: (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Form Đăng Ký Doanh Nghiệp</p>
          <div className="space-y-2">
            <div className="rounded border border-slate-200 p-2 bg-slate-50">
              <span className="text-[8px] font-bold text-slate-400 block uppercase">Tên cửa hàng</span>
              <span className="text-[10px] font-semibold text-slate-700">Cà Phê Bizen Sài Gòn</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border border-slate-200 p-2 bg-slate-50">
                <span className="text-[8px] font-bold text-slate-400 block uppercase">Số điện thoại</span>
                <span className="text-[10px] font-semibold text-slate-700">0909 123 456</span>
              </div>
              <div className="rounded border border-slate-200 p-2 bg-slate-50">
                <span className="text-[8px] font-bold text-slate-400 block uppercase">Quy mô nhân sự</span>
                <span className="text-[10px] font-semibold text-slate-700">1 - 20 nhân viên</span>
              </div>
            </div>
          </div>
          <button className="w-full rounded bg-brand-600 text-white text-[10px] font-bold py-2 shadow-sm">Gửi thông tin đăng ký →</button>
        </div>
      )
    },
    {
      title: "Hệ thống kiểm duyệt & Cấp Workspace",
      role: "Platform Admin",
      roleType: "system",
      icon: ShieldCheck,
      desc: "Hệ thống kiểm duyệt thông tin đăng ký doanh nghiệp của cửa hàng và khởi tạo workspace (cơ sở dữ liệu biệt lập) cho khách hàng.",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Mỗi cửa hàng đăng ký trên BIZEN sẽ hoạt động trên một Tenant (workspace) riêng biệt để đảm bảo tính bảo mật và độc lập dữ liệu tuyệt đối.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Quản trị viên hệ thống BIZEN (Platform Admin) duyệt thông tin đăng ký của doanh nghiệp trong trang quản trị nền tảng.</li>
            <li>Hệ thống tự động kích hoạt workspace của cửa hàng và tạo tài khoản quản trị sở hữu (Owner/Admin) cho chủ quán.</li>
            <li>Mật khẩu đăng nhập mặc định và hướng dẫn truy cập sẽ được tự động gửi trực tiếp về địa chỉ Email mà chủ quán đã dùng để đăng ký.</li>
          </ol>
        </div>
      ),
      mockupType: "web",
      mockupTitle: "Bảng quản trị Platform Admin",
      mockupContent: (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[10px] font-bold text-slate-500">Yêu cầu kích hoạt chờ duyệt (1)</span>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-800">Cà Phê Bizen Sài Gòn</p>
              <p className="text-[8px] text-slate-400">Đăng ký bởi: admin@bizensaigon.vn</p>
            </div>
            <div className="flex gap-1.5">
              <button className="rounded bg-emerald-600 text-white text-[9px] font-bold px-2 py-1">Phê duyệt & Tạo DB</button>
              <button className="rounded bg-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-1">Hủy</button>
            </div>
          </div>
          <div className="rounded border border-slate-100 bg-slate-50 p-1.5 text-[8px] text-slate-500 font-mono text-center">
            [System Log] Creating isolated database tenant for BIZEN-SAIGON... Success.
          </div>
        </div>
      )
    },
    {
      title: "Đăng nhập & Thiết lập cửa hàng (GPS, ca làm, phòng ban)",
      role: "Chủ quán",
      roleType: "owner",
      icon: MapPin,
      desc: "Chủ quán đăng nhập vào Web Portal để cấu hình các thông số ban đầu của cửa hàng như vị trí GPS, bán kính chấm công, phòng ban và ca làm chuẩn.",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Để bắt đầu vận hành, bạn cần định nghĩa cho hệ thống biết cửa hàng của bạn ở đâu và làm việc theo những ca nào.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Đăng nhập bằng thông tin được cấp, truy cập mục <strong>Cài đặt</strong>.</li>
            <li><strong>Cấu hình GPS:</strong> Nhập tọa độ Kinh độ (Latitude), Vĩ độ (Longitude) của cửa hàng và <em>Bán kính cho phép</em> (Khuyên dùng từ 30m - 50m).</li>
            <li><strong>Tạo ca làm chuẩn:</strong> Thêm các ca mặc định của cửa hàng (ví dụ: Ca Sáng 07:00-12:00, Ca Chiều 12:00-17:00, Ca Tối 17:00-22:00).</li>
            <li><strong>Tạo bộ phận:</strong> Khởi tạo các nhóm công việc (ví dụ: Pha chế, Phục vụ, Thu ngân).</li>
          </ol>
          <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-100 text-[11px] leading-relaxed text-amber-800">
            <strong>Cảnh báo:</strong> Định vị GPS vô cùng quan trọng. Nhân viên bắt buộc phải đứng trong bán kính thiết lập mới có thể check-in trên di động.
          </div>
        </div>
      ),
      mockupType: "web",
      mockupTitle: "Bảng cấu hình Cài đặt Cửa hàng",
      mockupContent: (
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Cài đặt GPS chấm công</span>
            <div className="flex gap-2">
              <div className="flex-1 rounded border border-slate-200 bg-white p-1 text-[9px]">Lat: 10.7769</div>
              <div className="flex-1 rounded border border-slate-200 bg-white p-1 text-[9px]">Lng: 106.7009</div>
              <div className="w-16 rounded border border-slate-200 bg-white p-1 text-[9px]">Bk: 50m</div>
            </div>
          </div>
          <div className="space-y-1 border-t border-slate-100 pt-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Danh sách Ca làm việc chuẩn</span>
            <div className="flex gap-1.5">
              <span className="rounded bg-brand-50 border border-brand-100 text-brand-700 text-[8px] font-bold px-1.5 py-0.5">Ca Sáng (07:00 - 12:00)</span>
              <span className="rounded bg-brand-50 border border-brand-100 text-brand-700 text-[8px] font-bold px-1.5 py-0.5">Ca Chiều (12:00 - 17:00)</span>
            </div>
          </div>
          <div className="rounded bg-green-50 border border-green-100 p-2 flex gap-1.5 items-center">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <span className="text-[9px] text-green-800 font-semibold">Tọa độ GPS trùng khớp với định vị Google Maps.</span>
          </div>
        </div>
      )
    },
    {
      title: "Quản lý & Thêm mới Nhân viên",
      role: "Chủ quán",
      roleType: "owner",
      icon: UsersRound,
      desc: "Thêm thông tin hồ sơ của nhân viên mới vào danh sách nhân sự, cấu hình vai trò, bộ phận và thiết lập mức lương cơ bản.",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Vào mục <strong>Nhân viên</strong> trên menu để thêm các nhân viên đầu tiên cho quán.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Nhấp vào nút <strong>Thêm nhân sự mới</strong>.</li>
            <li>Nhập họ tên, số điện thoại đăng nhập, email (tùy chọn) và phân chia bộ phận (ví dụ: Pha chế).</li>
            <li><strong>Cấu hình Lương:</strong> Điền mức lương cơ bản theo giờ (ví dụ: 25.000 đ/giờ) hoặc lương cố định tháng.</li>
            <li>Hệ thống tự động kích hoạt tài khoản nhân viên. Mật khẩu mặc định sẽ khớp với số điện thoại của nhân viên đó.</li>
          </ol>
        </div>
      ),
      mockupType: "web",
      mockupTitle: "Bảng quản lý nhân viên BIZEN",
      mockupContent: (
        <div className="space-y-2">
          <div className="flex justify-between items-center pb-1">
            <span className="text-[10px] font-bold text-slate-700">Hồ sơ nhân sự (8)</span>
            <button className="bg-brand-600 text-white text-[8px] font-bold px-2 py-0.5 rounded">+ Thêm mới</button>
          </div>
          <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
            <div className="rounded border border-slate-100 p-1.5 bg-slate-50/50 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-800">Nguyễn Lan (Pha chế)</p>
                <p className="text-[8px] text-slate-400">Lương: 25,000đ/giờ | SĐT: 0912***456</p>
              </div>
              <span className="rounded bg-brand-100 text-brand-700 text-[8px] font-bold px-1.5">Admin duyệt</span>
            </div>
            <div className="rounded border border-slate-100 p-1.5 bg-slate-50/50 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-800">Trần Nam (Thu ngân)</p>
                <p className="text-[8px] text-slate-400">Lương: 27,000đ/giờ | SĐT: 0988***789</p>
              </div>
              <span className="rounded bg-brand-100 text-brand-700 text-[8px] font-bold px-1.5">Admin duyệt</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Nhân viên tải PWA & Đăng nhập di động",
      role: "Nhân viên",
      roleType: "employee",
      icon: Smartphone,
      desc: "Nhân viên truy cập ứng dụng bằng điện thoại qua đường dẫn của cửa hàng, đăng nhập và cài đặt ứng dụng PWA vào màn hình chính.",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Nhân viên không cần phải tải app nặng từ AppStore hay CHPlay. BIZEN sử dụng công nghệ Web App tiến trình (PWA).
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Nhân viên mở trình duyệt trên điện thoại (Safari trên iOS hoặc Chrome trên Android) và truy cập đường dẫn di động của cửa hàng.</li>
            <li>Đăng nhập bằng số điện thoại và mật khẩu mặc định (do quản lý cấp).</li>
            <li>Khi thấy popup nhắc nhở, nhấn <strong>Thêm vào màn hình chính</strong> (Add to Home Screen).</li>
            <li>Ứng dụng sẽ được tải về máy và hiển thị biểu tượng ngoài màn hình nền giống như app cài đặt thông thường.</li>
          </ol>
        </div>
      ),
      mockupType: "mobile",
      mockupTitle: "Lưu ứng dụng PWA trên điện thoại",
      mockupContent: (
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">B</div>
          <p className="text-xs font-bold text-slate-700">Cài đặt BIZEN</p>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-2.5 text-left text-[9px] text-blue-800 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Info className="h-3 w-3 text-blue-600 shrink-0" />
              Thêm vào Màn hình chính
            </p>
            <p>Bấm nút Chia sẻ (Share) dưới thanh công cụ trình duyệt Safari rồi chọn "Thêm vào màn hình chính" để cài đặt.</p>
          </div>
          <button className="w-full rounded bg-slate-200 text-slate-700 text-[9px] font-bold py-1.5">Để sau</button>
        </div>
      )
    },
    {
      title: "Nhân viên đăng ký khuôn mặt (Face ID Enrollment)",
      role: "Nhân viên",
      roleType: "employee",
      icon: ScanFace,
      desc: "Nhân viên tự chụp ảnh chân dung rõ nét qua camera điện thoại để đăng ký thông tin sinh trắc học Face ID chấm công.",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Để chấm công không bị gian lận, nhân viên cần cung cấp một ảnh khuôn mặt chuẩn ban đầu để hệ thống lưu trữ dữ liệu xác thực Face ID.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Trên cổng di động, nhân viên vào mục <strong>Tài khoản</strong> &rarr; chọn <strong>Thiết lập Face ID</strong>.</li>
            <li>Cho phép ứng dụng truy cập camera điện thoại.</li>
            <li>Giữ điện thoại thẳng hướng gương mặt, chụp ảnh rõ nét trong điều kiện đủ sáng.</li>
            <li>Nhấn <strong>Gửi đăng ký Face ID</strong> để gửi hồ sơ chờ chủ quán phê duyệt.</li>
          </ol>
          <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-100 text-[11px] leading-relaxed text-amber-800">
            <strong>Lưu ý quan trọng:</strong> Tránh chụp ảnh khi đeo kính râm, khẩu trang hoặc trong điều kiện ngược sáng để hệ thống nhận diện tốt nhất.
          </div>
        </div>
      ),
      mockupType: "mobile",
      mockupTitle: "Quét mặt đăng ký Face ID",
      mockupContent: (
        <div className="space-y-3 text-center">
          <p className="text-xs font-bold text-slate-700">Đăng ký khuôn mặt</p>
          <div className="mx-auto h-24 w-24 rounded-full border-4 border-brand-500 flex items-center justify-center bg-slate-50 relative overflow-hidden">
            <ScanFace className="h-10 w-10 text-brand-500" />
            <div className="absolute inset-0 bg-brand-500/10 flex items-center justify-center">
              <span className="text-[8px] font-bold text-brand-700 uppercase tracking-widest animate-pulse">Nhận dạng...</span>
            </div>
          </div>
          <p className="text-[8px] text-slate-500">Giữ gương mặt trong vòng tròn để hoàn tất.</p>
          <button className="w-full rounded bg-brand-600 text-white text-[9px] font-bold py-1.5 shadow-sm">Chụp ảnh khuôn mặt</button>
        </div>
      )
    },
    {
      title: "Chủ quán phê duyệt Face ID",
      role: "Chủ quán",
      roleType: "owner",
      icon: CheckSquare,
      desc: "Chủ quán vào Web Dashboard kiểm duyệt hình ảnh đăng ký khuôn mặt của nhân viên và bấm duyệt để kích hoạt tính năng chấm công Face ID.",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Tránh việc nhân viên tự đăng ký ảnh của người khác, chủ quán có nhiệm vụ kiểm tra và phê duyệt ảnh khuôn mặt.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Admin đăng nhập Web Portal, vào mục <strong>Face ID</strong> hoặc phần <strong>Tài khoản</strong>.</li>
            <li>Tại danh sách chờ duyệt, click xem ảnh chụp đăng ký của nhân viên đó.</li>
            <li>Nếu thấy ảnh rõ nét, đúng người, bấm <strong>Phê duyệt</strong>.</li>
            <li>Nhân viên sẽ lập tức được kích hoạt trạng thái "Sẵn sàng Chấm công" bằng khuôn mặt.</li>
          </ol>
        </div>
      ),
      mockupType: "web",
      mockupTitle: "Duyệt yêu cầu đăng ký khuôn mặt",
      mockupContent: (
        <div className="space-y-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase">Yêu cầu đăng ký Face ID mới (1)</p>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
              <ScanFace className="h-6 w-6 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-800">Trần Văn Nam</p>
              <p className="text-[8px] text-slate-400">Bộ phận: Thu ngân</p>
              <p className="text-[8px] text-slate-500 font-mono">Độ trùng khớp: 98%</p>
            </div>
            <button className="bg-brand-600 hover:bg-brand-700 text-white text-[9px] font-bold px-2.5 py-1.5 rounded transition">Duyệt ảnh</button>
          </div>
        </div>
      )
    },
    {
      title: "Lập lịch làm việc & Sử dụng AI gợi ý ca làm",
      role: "Chủ quán",
      roleType: "owner",
      icon: CalendarCheck2,
      desc: "Chủ quán xếp lịch ca làm hàng tuần cho nhân viên. Có thể phân lịch bằng tay hoặc kích hoạt AI Suggest tự động đề xuất lịch tối ưu.",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            BIZEN hỗ trợ lập lịch trực quan. Đặc biệt với tính năng AI Suggest giúp tự động phân ca.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Vào mục <strong>Xếp ca</strong> trên Web Portal.</li>
            <li>Chọn tuần hoặc tháng cần xếp lịch.</li>
            <li>Nhấp vào nút <strong>AI Suggest</strong> ở thanh công cụ.</li>
            <li>AI sẽ phân tích ca làm tiêu chuẩn của quán, tính khả dụng và giờ bận của nhân viên để gán lịch tự động tối ưu nhất.</li>
            <li>Chủ quán kiểm tra lại lịch, chỉnh sửa nếu cần và bấm <strong>Xuất bản lịch ca</strong> để cập nhật thông tin tới toàn bộ nhân viên.</li>
          </ol>
        </div>
      ),
      mockupType: "web",
      mockupTitle: "Bảng xếp ca thông minh AI Suggest",
      mockupContent: (
        <div className="space-y-3.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-700">Lịch làm việc tuần 24</span>
            <button className="bg-brand-50 text-brand-600 border border-brand-100 hover:bg-brand-100 text-[8px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-brand-600" />
              AI Gợi ý ca
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-slate-100 p-2 bg-slate-50">
              <span className="text-[8px] font-bold text-slate-400 block uppercase">Ca sáng (07-12)</span>
              <span className="text-[10px] font-bold text-slate-800">Lan, Nam, Tuấn</span>
            </div>
            <div className="rounded border border-slate-100 p-2 bg-slate-50">
              <span className="text-[8px] font-bold text-slate-400 block uppercase">Ca chiều (12-17)</span>
              <span className="text-[10px] font-bold text-slate-800">Hoa, Minh, Hùng</span>
            </div>
          </div>
          <div className="rounded bg-violet-50 border border-violet-100 p-2 text-[8px] text-violet-800 font-semibold">
            ✨ AI đã đề xuất phân ca tự động dựa trên mức lương tối ưu & giờ bận của nhân viên.
          </div>
        </div>
      )
    },
    {
      title: "Nhân viên Chấm công bằng Face ID & Định vị GPS",
      role: "Nhân viên",
      roleType: "employee",
      icon: Clock3,
      desc: "Nhân viên thực hiện Check-in/out trên di động bằng cách nhận diện khuôn mặt khi đang có mặt tại cửa hàng (định vị GPS hợp lệ).",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Chấm công hàng ngày diễn ra nhanh chóng ngay trên thiết bị cá nhân của nhân viên, cam kết minh bạch và hạn chế chấm công hộ.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Nhân viên đến cửa hàng, mở ứng dụng di động BIZEN và chọn <strong>Chấm công</strong>.</li>
            <li>Hệ thống tự động kiểm tra định vị GPS của điện thoại xem có nằm trong bán kính cho phép của quán hay không.</li>
            <li>Nếu vị trí hợp lệ, camera trước tự động bật lên quét khuôn mặt nhân viên.</li>
            <li>Hệ thống so khớp Face ID và ghi nhận giờ chấm công (Check-in/out) thành công.</li>
          </ol>
        </div>
      ),
      mockupType: "mobile",
      mockupTitle: "Màn hình chấm công di động",
      mockupContent: (
        <div className="space-y-2">
          <div className="rounded border border-slate-100 p-2 bg-slate-50/50 flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Định vị GPS:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-0.5">
              <MapPin className="h-3 w-3" /> Hợp lệ (Tại Quán)
            </span>
          </div>
          <div className="mx-auto h-20 w-20 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-slate-50 relative overflow-hidden">
            <ScanFace className="h-9 w-9 text-emerald-500" />
            <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
              <span className="text-[7px] font-bold text-emerald-700 uppercase">Khớp mặt</span>
            </div>
          </div>
          <div className="rounded bg-emerald-100 p-1.5 text-[8px] font-bold text-emerald-800 text-center">
            CHECK-IN THÀNH CÔNG: 06:58 (ĐÚNG GIỜ)
          </div>
        </div>
      )
    },
    {
      title: "Thực hiện Checklist công việc ca làm",
      role: "Nhân viên",
      roleType: "employee",
      icon: ClipboardCheck,
      desc: "Nhân viên xem và thực hiện các nhiệm vụ được giao trong ca làm, gửi kèm hình ảnh chụp thực tế để nghiệm thu công việc trước khi ra ca.",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Mỗi ca làm việc sẽ gắn liền với một danh sách Checklist để nhân viên nắm bắt nhiệm vụ và nâng cao tính tự giác.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Trên app di động, nhân viên chọn <strong>Checklist ca làm</strong>.</li>
            <li>Xem danh sách các nhiệm vụ được giao (ví dụ: quét quán, dọn quầy, bật máy pha cafe).</li>
            <li>Thực hiện công việc thực tế, bấm dấu tích hoàn thành.</li>
            <li>Với các nhiệm vụ bắt buộc nghiệm thu ảnh, nhân viên bấm nút <strong>Tải ảnh lên</strong> để chụp lại hiện trạng thực tế.</li>
            <li>Hoàn tất checklist để có thể thực hiện Check-out khi hết ca.</li>
          </ol>
        </div>
      ),
      mockupType: "mobile",
      mockupTitle: "Báo cáo Checklist trên điện thoại",
      mockupContent: (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-700">Checklist Ca Sáng</p>
          <div className="space-y-1.5 text-[9px]">
            <div className="flex justify-between items-center rounded border border-slate-100 p-1.5 bg-slate-50">
              <span className="text-slate-600">1. Vệ sinh & Lau dọn quán</span>
              <span className="text-[7px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">Đã nộp ảnh</span>
            </div>
            <div className="flex justify-between items-center rounded border border-slate-100 p-1.5 bg-slate-50">
              <span className="text-slate-600">2. Setup máy pha cà phê</span>
              <button className="bg-brand-600 text-white text-[7px] font-bold px-1 rounded">Chụp ảnh</button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Chủ quán kiểm duyệt Checklist & Đơn nghỉ phép",
      role: "Chủ quán",
      roleType: "owner",
      icon: FileText,
      desc: "Chủ quán xem báo cáo checklist, ảnh nghiệm thu thực tế của nhân viên và xét duyệt các đơn xin nghỉ phép gửi lên từ cổng di động.",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Quản lý nắm bắt trực tiếp tiến trình làm việc và xử lý các yêu cầu nghỉ phép của nhân viên ngay trên Web Dashboard.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Chủ quán vào mục <strong>Checklist ca</strong> để kiểm tra xem nhân viên đã hoàn thành công việc chưa, nhấn xem ảnh thực tế để đối soát.</li>
            <li>Vào mục <strong>Nghỉ phép</strong> để quản lý toàn bộ đơn xin nghỉ của nhân viên.</li>
            <li>Tại mỗi đơn xin nghỉ, chủ quán xem lý do, bấm <strong>Duyệt đơn</strong> hoặc <strong>Từ chối</strong> kèm lý do. Thông tin được thông báo ngay tới điện thoại của nhân viên và tự động đồng bộ gỡ bỏ ca làm tuần đó của nhân viên.</li>
          </ol>
        </div>
      ),
      mockupType: "web",
      mockupTitle: "Bảng kiểm duyệt công việc & đơn từ",
      mockupContent: (
        <div className="space-y-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase">Đơn xin nghỉ phép cần duyệt (1)</p>
          <div className="rounded border border-amber-100 bg-amber-50/50 p-2 text-[9px] space-y-1 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">Nguyễn Lan (Đơn ca sáng 25/06)</p>
              <p className="text-slate-500">Lý do: Đi khám bệnh định kỳ</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button className="bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Duyệt</button>
              <button className="bg-slate-200 text-slate-600 text-[8px] font-bold px-1 rounded">Từ chối</button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Chốt công, duyệt lương & xuất báo cáo CSV",
      role: "Chủ quán",
      roleType: "owner",
      icon: CreditCard,
      desc: "Cuối tháng, BIZEN tự động tổng hợp công, tính OT, phạt đi trễ/về sớm. Chủ quán phê duyệt bảng lương tổng và xuất file CSV gửi kế toán.",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Quá trình tính lương diễn ra tự động 100% dựa trên các bản ghi chấm công thực tế đã qua đối soát GPS/Face ID.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Truy cập mục <strong>Bảng lương</strong> khi kết thúc kỳ lương tháng.</li>
            <li>Hệ thống tự động hiển thị: Tổng giờ làm, Số giờ tăng ca (OT), Tổng tiền phạt đi trễ (nếu quá Grace Period), Tổng lương thực nhận của từng người.</li>
            <li>Click <strong>Phê duyệt bảng lương</strong> để chốt số liệu.</li>
            <li>Nhấn <strong>Xuất báo cáo CSV</strong> để tải file excel chấm công và lương chi tiết gửi ngân hàng chuyển khoản hoặc bộ phận kế toán cửa hàng.</li>
          </ol>
        </div>
      ),
      mockupType: "web",
      mockupTitle: "Báo cáo bảng lương & Bấm xuất CSV",
      mockupContent: (
        <div className="space-y-3">
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-[8px] text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-1">Tên</th>
                  <th className="p-1">Số giờ</th>
                  <th className="p-1">Trễ (p)</th>
                  <th className="p-1 text-right">Lương nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-1 font-semibold">Lan (P.chế)</td>
                  <td className="p-1">120 h</td>
                  <td className="p-1">10 p</td>
                  <td className="p-1 font-bold text-right">3,000,000đ</td>
                </tr>
                <tr>
                  <td className="p-1 font-semibold">Nam (T.ngân)</td>
                  <td className="p-1">96 h</td>
                  <td className="p-1">0 p</td>
                  <td className="p-1 font-bold text-right">2,592,000đ</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 rounded bg-brand-600 text-white text-[9px] font-bold py-1">Phê duyệt lương</button>
            <button className="rounded border border-slate-200 bg-white text-slate-700 text-[9px] font-bold px-2 py-1">Xuất CSV</button>
          </div>
        </div>
      )
    },
    {
      title: "Đồng hành cùng Trợ lý ảo AI Assistant",
      role: "Chủ quán",
      roleType: "owner",
      icon: Sparkles,
      desc: "Chủ quán sử dụng chatbot trí tuệ nhân tạo (AI Assistant) để đặt câu hỏi tự do, phân tích dữ liệu chấm công, tính hiệu suất nhân sự và đề xuất phân ca.",
      instructions: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            Trợ lý AI là điểm nhấn công nghệ của BIZEN giúp chủ cửa hàng phân tích số liệu vận hành tự động bằng ngôn ngữ tự nhiên.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Nhấp chọn mục <strong>Trợ lý AI</strong> trên menu Web Portal.</li>
            <li>Nhập câu hỏi bằng tiếng Việt tự nhiên (ví dụ: "Ai đi trễ nhiều nhất tuần này?" hoặc "Tổng kết quỹ lương dự kiến tháng tới").</li>
            <li>AI tự động tra cứu dữ liệu liên quan trong hệ thống và đưa ra câu trả lời chi tiết kèm phân tích trực quan dạng bảng biểu.</li>
          </ol>
        </div>
      ),
      mockupType: "web",
      mockupTitle: "Giao diện trò chuyện Trợ lý AI BIZEN",
      mockupContent: (
        <div className="space-y-2">
          <div className="rounded border border-slate-100 bg-slate-50 p-1.5 text-[8px] text-slate-600 flex gap-1.5">
            <span className="font-bold shrink-0 text-slate-800">[Chủ quán]:</span>
            <span>Ai đi muộn nhiều nhất tuần này?</span>
          </div>
          <div className="rounded border border-violet-100 bg-violet-50/50 p-2 text-[8px] text-violet-800 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-violet-600" />
              [BIZEN AI]:
            </p>
            <p>Tuần này nhân viên <strong>Nguyễn Lan</strong> đi muộn nhiều nhất với 2 lần (tổng cộng 15 phút). Các nhân sự khác đều đúng giờ.</p>
          </div>
        </div>
      )
    }
  ];

  const filteredSteps = stepsData.filter(
    (step) =>
      step.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo />
            <span className="hidden sm:inline-block h-4 w-px bg-slate-200" />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <BookOpen className="h-3.5 w-3.5 text-brand-600" />
              Tài liệu Hướng dẫn A-Z
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={user.role === "Employee" ? "/web/me" : "/web/dashboard"}
                className="brand-button btn-motion inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
              >
                Vào bảng điều khiển
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
                  Đăng nhập
                </Link>
                <Link to="/register-company" className="brand-button btn-motion inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold">
                  Đăng ký dùng thử
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 py-12 sm:py-16">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(23,103,255,0.04)_0%,rgba(103,87,255,0.03)_100%)]" />
        <div className="absolute right-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-brand-100/30 blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="brand-eyebrow inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            Cập nhật quy trình năm 2026
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Tài liệu Quy trình Vận hành A - Z
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Quy trình làm việc khép kín chuẩn hóa của BIZEN. Click chọn từng bước để mở rộng hướng dẫn chi tiết và xem minh họa giao diện.
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar Table of Contents */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mục lục Quy trình</h3>
              <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                {stepsData.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToAndExpandStep(idx)}
                    className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs font-semibold transition ${
                      expandedSteps[idx] ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-slate-100 text-[10px] font-bold font-mono">
                      {idx + 1}
                    </span>
                    <span className="truncate">{step.title}</span>
                  </button>
                ))}
              </nav>

              <div className="border-t border-slate-100 pt-4">
                <div className="rounded-xl bg-gradient-to-br from-brand-500/10 to-brand-600/5 p-4 border border-brand-100">
                  <h4 className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-brand-600" />
                    Chức năng Đầy đủ
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                    Các bước được liệt kê theo đúng trình tự thời gian từ lúc tạo quán đến chốt lương cuối tháng.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Master Timeline Content */}
          <main className="col-span-1 lg:col-span-3 space-y-6">
            
            {/* Control Dashboard Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-soft flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bước hướng dẫn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs sm:text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={expandAll}
                  className="flex-1 sm:flex-none text-center rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold px-3 py-2 hover:bg-slate-50 transition"
                >
                  Mở tất cả ({stepsData.length})
                </button>
                <button
                  onClick={collapseAll}
                  className="flex-1 sm:flex-none text-center rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold px-3 py-2 hover:bg-slate-50 transition"
                >
                  Thu gọn tất cả
                </button>
              </div>
            </div>

            {/* List of Accordion steps */}
            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 sm:pl-8 space-y-8 py-2">
              {filteredSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isExpanded = !!expandedSteps[idx];
                const isOwner = step.roleType === "owner";
                const isEmployee = step.roleType === "employee";
                const isSystem = step.roleType === "system";

                let roleBadgeColor = "bg-slate-100 text-slate-700";
                if (isOwner) roleBadgeColor = "bg-blue-100 text-blue-700";
                if (isEmployee) roleBadgeColor = "bg-violet-100 text-violet-700";
                if (isSystem) roleBadgeColor = "bg-emerald-100 text-emerald-700";

                return (
                  <div
                    key={idx}
                    id={`step-card-${idx}`}
                    className="relative group transition-all duration-300"
                  >
                    {/* Circle Indicator on vertical line */}
                    <span className="absolute -left-[35px] sm:-left-[43px] top-4 flex h-6 sm:h-8 w-6 sm:w-8 items-center justify-center rounded-full bg-white border-2 border-slate-300 text-[10px] sm:text-xs font-bold font-mono text-slate-500 shadow-sm group-hover:border-brand-500 transition-colors">
                      {idx + 1}
                    </span>

                    {/* Step Card Accordion */}
                    <div className="premium-card rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
                      
                      {/* Accordion Header */}
                      <button
                        onClick={() => toggleStep(idx)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition hover:bg-slate-50/50 gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`rounded-xl p-2 shrink-0 ${isOwner ? "bg-blue-50 text-blue-600" : isEmployee ? "bg-violet-50 text-violet-600" : "bg-emerald-50 text-emerald-600"}`}>
                            <StepIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
                              {step.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${roleBadgeColor}`}>
                                {step.role}
                              </span>
                              <span className="text-[11px] text-slate-400 hidden sm:inline truncate max-w-[280px]">{step.desc}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180 text-brand-600" : ""}`} />
                      </button>

                      {/* Accordion Content (Dropdown) */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-white p-4 sm:p-5 space-y-5 animate-[fadeIn_0.2s_ease-out]">
                          <p className="text-xs sm:text-sm text-slate-400 sm:hidden italic">
                            {step.desc}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            
                            {/* Left part: Instructions */}
                            <div className="md:col-span-7 space-y-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hướng dẫn chi tiết</h4>
                              {step.instructions}
                            </div>

                            {/* Right part: Interface Mockup */}
                            <div className="md:col-span-5 space-y-3">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{step.mockupTitle}</h4>
                              
                              {step.mockupType === "web" ? (
                                /* Web Browser Mockup */
                                <div className="border border-slate-200 rounded-xl bg-white shadow-soft overflow-hidden flex flex-col min-h-[190px]">
                                  <div className="bg-slate-50 px-2 py-1.5 border-b border-slate-200 flex items-center gap-1 shrink-0">
                                    <div className="flex gap-0.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                    </div>
                                    <span className="text-[8px] text-slate-400 font-mono truncate">bizen.vn/web/portal</span>
                                  </div>
                                  <div className="p-3 flex-1 flex flex-col justify-center bg-white">
                                    {step.mockupContent}
                                  </div>
                                </div>
                              ) : (
                                /* Mobile Phone Mockup */
                                <div className="border border-slate-200 rounded-xl bg-white shadow-soft overflow-hidden flex flex-col max-w-[240px] mx-auto w-full min-h-[190px]">
                                  <div className="bg-slate-900 text-white px-3 py-1 flex justify-between items-center text-[8px] shrink-0 font-mono">
                                    <span>BIZEN Phone</span>
                                    <div className="flex items-center gap-0.5">
                                      <span className="w-1 h-1 rounded-full bg-white/20" />
                                      <span>08:00</span>
                                    </div>
                                  </div>
                                  <div className="p-3 flex-1 flex flex-col justify-center bg-white">
                                    {step.mockupContent}
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>

            {/* If no search results */}
            {filteredSteps.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-soft">
                <HelpCircle className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-base font-bold text-slate-700">Không tìm thấy kết quả</h3>
                <p className="mt-2 text-xs text-slate-500 max-w-xs mx-auto">
                  Vui lòng nhập từ khóa khác để tìm các bước hướng dẫn hoặc quy trình cụ thể.
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 text-xs font-bold px-3 py-2 hover:bg-brand-100 transition"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            {/* Bottom Final CTA */}
            <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white text-center shadow-soft space-y-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
              <div className="relative space-y-4">
                <h3 className="text-2xl font-bold">Chuẩn hóa ngay quy trình vận hành hôm nay cùng BIZEN</h3>
                <p className="mx-auto max-w-xl text-sm text-white/80">
                  Hệ thống số hóa nhân sự toàn diện hàng đầu cho quán cafe và cửa hàng dịch vụ quy mô nhỏ.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <Link to="/register-company" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-700 shadow hover:bg-slate-50 transition btn-motion">
                    Đăng ký Doanh nghiệp mới
                  </Link>
                  <Link to="/login" className="rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15 transition">
                    Đăng nhập tài khoản
                  </Link>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* Simplified Footer */}
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

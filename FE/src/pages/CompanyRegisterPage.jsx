import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Building2, CheckCircle2, LinkIcon, LockKeyhole, Mail, MapPin, Phone, Send, UserRound } from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import { bizenApi } from "../modules/api/bizenApi";

const emptyForm = {
  companyName: "",
  city: "Đà Nẵng",
  businessType: "Cafe / Milk tea",
  businessAddress: "",
  taxCode: "",
  website: "",
  verificationNote: "",
  contactName: "",
  contactEmail: "",
  phone: "",
  employeeCount: "10",
  password: "",
  confirmPassword: ""
};

export default function CompanyRegisterPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [request, setRequest] = useState(null);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    const phoneDigits = form.phone.replace(/\D/g, "");
    const city = form.city.trim().toLowerCase();
    const normalizedEmail = form.contactEmail.trim().toLowerCase();
    const employeeCount = Number(form.employeeCount);
    const taxCode = form.taxCode.replace(/\D/g, "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Email admin chưa hợp lệ.");
      return;
    }
    if (form.businessAddress.trim().length < 5) {
      setError("Cần nhập địa chỉ kinh doanh để BIZEN xác minh quán/doanh nghiệp.");
      return;
    }
    if (!/^\d{10}(\d{3})?$/.test(taxCode)) {
      setError("Mã số thuế cần 10 hoặc 13 chữ số.");
      return;
    }
    if (!["đà nẵng", "da nang"].includes(city)) {
      setError("BIZEN hiện chỉ nhận đăng ký cửa hàng tại Đà Nẵng trong giai đoạn triển khai đầu.");
      return;
    }
    if (phoneDigits && !/^0?\d{9,10}$/.test(phoneDigits)) {
      setError("Số điện thoại cần 9-11 chữ số.");
      return;
    }
    if (!Number.isInteger(employeeCount) || employeeCount < 1 || employeeCount > 20) {
      setError("Quy mô nhân sự cần từ 1 đến 20 người để AI xếp ca đúng phạm vi cửa hàng nhỏ.");
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) {
      setError("Mật khẩu cần tối thiểu 8 ký tự, có chữ và số.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Xác nhận mật khẩu chưa khớp.");
      return;
    }

    setLoading(true);
    try {
      const payload = await bizenApi.createCompanyRequest({
        companyName: form.companyName,
        city: "Đà Nẵng",
        businessType: form.businessType,
        businessAddress: form.businessAddress,
        taxCode,
        website: form.website,
        verificationNote: form.verificationNote,
        contactName: form.contactName,
        contactEmail: normalizedEmail,
        phone: phoneDigits,
        employeeCount,
        password: form.password
      });
      setRequest(payload);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || "Không gửi được yêu cầu doanh nghiệp.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </Link>
            <BrandLogo className="mt-10" />
            <h1 className="mt-5 text-3xl font-semibold tracking-normal text-slate-950 md:text-4xl">Đăng ký doanh nghiệp sử dụng BIZEN</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Doanh nghiệp gửi thông tin trước. Chủ nền tảng BIZEN duyệt tenant, sau đó email đại diện mới trở thành chủ sở hữu đầu tiên — có quyền tạo nhân sự và duyệt tài khoản nhân viên.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            Sau khi được duyệt, đăng nhập bằng email admin bạn nhập bên dưới — không cần đăng ký lại.
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-normal text-blue-600">Bước 1 · Khách hàng SaaS</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Thông tin đăng ký</h2>
          </div>

          {request ? (
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div>
                  <p className="font-semibold text-emerald-900">Yêu cầu đã được gửi</p>
                  <p className="mt-1 text-sm text-emerald-800">
                    Trạng thái: <span className="font-semibold">{request.status}</span>. Chủ nền tảng BIZEN sẽ duyệt trước khi bạn đăng nhập và vận hành.
                    {request.employeeCount ? ` Quy mô AI ban đầu: ${request.employeeCount} nhân sự.` : ""}
                  </p>
                  <Link to="/login" className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:text-blue-800">
                    Về trang đăng nhập
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          <form onSubmit={submit} className="grid gap-4">
            <label className="block text-sm font-medium text-slate-700">
              Tên doanh nghiệp
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <Building2 className="h-4 w-4 text-slate-400" />
                <input required value={form.companyName} onChange={(event) => updateField("companyName", event.target.value)} className="w-full outline-none" />
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Loại hình kinh doanh
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <BadgeCheck className="h-4 w-4 text-slate-400" />
                  <input required value={form.businessType} onChange={(event) => updateField("businessType", event.target.value)} className="w-full outline-none" />
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Mã số thuế
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <BadgeCheck className="h-4 w-4 text-slate-400" />
                  <input required inputMode="numeric" value={form.taxCode} onChange={(event) => updateField("taxCode", event.target.value)} className="w-full outline-none" placeholder="10 hoặc 13 chữ số" />
                </span>
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Địa chỉ kinh doanh
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <MapPin className="h-4 w-4 text-slate-400" />
                <input required value={form.businessAddress} onChange={(event) => updateField("businessAddress", event.target.value)} className="w-full outline-none" placeholder="Số nhà, đường, phường/xã" />
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Link xác minh
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <LinkIcon className="h-4 w-4 text-slate-400" />
                  <input value={form.website} onChange={(event) => updateField("website", event.target.value)} className="w-full outline-none" placeholder="Google Maps, Facebook hoặc website" />
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Ghi chú xác minh
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <BadgeCheck className="h-4 w-4 text-slate-400" />
                  <input value={form.verificationNote} onChange={(event) => updateField("verificationNote", event.target.value)} className="w-full outline-none" placeholder="Ví dụ: tên chủ hộ, chi nhánh, giờ mở cửa" />
                </span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Người đại diện
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <UserRound className="h-4 w-4 text-slate-400" />
                  <input required value={form.contactName} onChange={(event) => updateField("contactName", event.target.value)} className="w-full outline-none" />
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Thành phố
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <input required value={form.city} onChange={(event) => updateField("city", event.target.value)} className="w-full outline-none" />
                </span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Email admin
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input required type="email" value={form.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} className="w-full outline-none" />
                </span>
                <span className="mt-1 block text-xs text-slate-500">Dùng email thật để nhận duyệt tenant và đặt lại mật khẩu khi quên.</span>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Điện thoại
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="w-full outline-none" />
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Quy mô nhân sự dự kiến
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <UserRound className="h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="number"
                    min="1"
                    max="20"
                    value={form.employeeCount}
                    onChange={(event) => updateField("employeeCount", event.target.value)}
                    className="w-full outline-none"
                  />
                </span>
                <span className="mt-1 block text-xs text-slate-500">AI Suggest sẽ dùng số này để tạo target bộ phận và số người cần cho từng ca.</span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Mật khẩu admin
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input required type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} className="w-full outline-none" />
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Nhập lại mật khẩu
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input required type="password" value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} className="w-full outline-none" />
                </span>
              </label>
            </div>

            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}

            <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">
              <Send className="h-4 w-4" />
              {loading ? "Đang gửi…" : "Gửi yêu cầu doanh nghiệp"}
            </button>

            <p className="text-center text-xs leading-5 text-slate-500">
              Nhân viên không cần đăng ký riêng; chủ/quản lý sẽ cấp email và mật khẩu sau khi tạo hồ sơ.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

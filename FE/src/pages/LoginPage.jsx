import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, LockKeyhole, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import GoogleLoginButton from "../modules/auth/GoogleLoginButton";

const roleDashboards = [
  { role: "Admin", focus: "Chi phí, cấu hình, cảnh báo rủi ro" },
  { role: "HR", focus: "Chấm công, hồ sơ, lương, nghỉ phép" },
  { role: "Manager", focus: "Ca làm, hiệu suất, thiếu nhân sự" },
  { role: "Employee", focus: "Check-in, lịch làm, lương, phép" }
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("HR");
  const [email, setEmail] = useState("hr@bizen.vn");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      setError("Email hoặc mật khẩu chưa hợp lệ.");
      return;
    }
    setError("");
    navigate(role === "Employee" ? "/mobile/home" : "/web/dashboard");
  }

  function handleGoogleSuccess(user) {
    navigate(user.role === "Employee" ? "/mobile/home" : "/web/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between bg-white px-6 py-8 md:px-12">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-600 text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-normal text-slate-950">BIZEN</p>
              <p className="text-sm text-slate-500">Cloud HR & Payroll for SME Đà Nẵng</p>
            </div>
          </div>

          <div className="my-10 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <ShieldCheck className="h-4 w-4" />
              Role-based access
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">
              Quản lý nhân sự, ca làm và lương trên một nền tảng.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
              Dashboard cho HR/Admin và mobile app cho nhân viên, tập trung vào chấm công Face ID, xếp ca AI và payroll tự động.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {roleDashboards.map((item) => (
                <div key={item.role} className="rounded-lg border border-slate-200 p-4">
                  <p className="font-semibold text-slate-950">{item.role}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.focus}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 text-sm text-slate-500 sm:grid-cols-3">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Face ID mock
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Payroll 05/2026
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              AI schedule
            </span>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10">
          <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-normal text-slate-950">Đăng nhập BIZEN</h2>
              <p className="mt-2 text-sm text-slate-500">Chọn vai trò để mở dashboard phù hợp.</p>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Vai trò
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option>Admin</option>
                <option>HR</option>
                <option>Manager</option>
                <option>Employee</option>
              </select>
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Email
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <UserRound className="h-4 w-4 text-slate-400" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full outline-none" />
              </span>
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Mật khẩu
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full outline-none" />
              </span>
            </label>

            {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}

            <button type="submit" className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              Vào hệ thống
            </button>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-normal text-slate-400">Google Auth</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <GoogleLoginButton onSuccess={handleGoogleSuccess} />

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate("/web/dashboard")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Building2 className="h-4 w-4" />
                Web demo
              </button>
              <button
                type="button"
                onClick={() => navigate("/mobile/home")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Smartphone className="h-4 w-4" />
                Mobile demo
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

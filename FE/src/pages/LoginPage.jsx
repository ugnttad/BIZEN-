import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import GoogleLoginButton from "../modules/auth/GoogleLoginButton";
import { bizenApi } from "../modules/api/bizenApi";
import WorkflowStepsCard from "../components/WorkflowStepsCard";
import { mvpDemoFeatures } from "../constants/saasWorkflow";
import { getDefaultPathForRole, saveAuthSession } from "../modules/auth/authStore";
import { saveMobileEmployee } from "../modules/auth/mobileSession";

const accessHighlights = [
  "Role lấy trực tiếp từ hồ sơ nhân viên",
  "Admin cao nhất; HR/Manager là vai trò phụ quyền",
  "Nhân viên dùng được cả web và mobile",
  "Face ID cần Admin/HR duyệt trước khi chấm công"
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function finishLogin(session) {
    saveAuthSession(session);

    if (session.user.role === "Employee" && session.user.employeeId) {
      const employee = await bizenApi.employee(session.user.employeeId);
      saveMobileEmployee(employee);
    }

    const defaultPath = getDefaultPathForRole(session.user.role);
    const from = location.state?.from;
    navigate(from && from.startsWith(defaultPath.split("/").slice(0, 2).join("/")) ? from : defaultPath, { replace: true });
  }

  async function submit(event) {
    event.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      setError("Email hoặc mật khẩu chưa hợp lệ.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const session = await bizenApi.passwordLogin({ email, password });
      await finishLogin(session);
    } catch (err) {
      setError(err.message || "Không đăng nhập được.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(user) {
    try {
      const token = localStorage.getItem("bizen_auth_token");
      const session = { token, user };
      await finishLogin(session);
    } catch (err) {
      setError(err.message || "Không hoàn tất được đăng nhập Google.");
    }
  }

  return (
    <main className="app-background relative min-h-screen overflow-hidden">
      <div className="ambient-grid pointer-events-none fixed inset-x-0 top-0 h-80" />
      <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between bg-white/70 px-6 py-8 backdrop-blur-xl md:px-12">
          <Link to="/" className="group flex w-fit items-center gap-3 rounded-xl">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-normal text-slate-950 transition-colors group-hover:text-blue-700">BIZEN</p>
              <p className="text-sm text-slate-500">Cloud HR & Payroll</p>
            </div>
          </Link>

          <div className="my-10 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <ShieldCheck className="h-4 w-4" />
              Secure access
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">
              Đăng nhập để vào đúng khu vực làm việc.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
              BIZEN tự điều hướng theo quyền tài khoản và thiết bị: nhân viên vào cổng web/mobile, đội vận hành vào web dashboard.
            </p>
            <div className="mt-8 grid gap-3">
              {accessHighlights.map((item) => (
                <div key={item} className="motion-card flex items-center gap-3 rounded-xl border border-slate-200 bg-white/70 p-4 hover:border-blue-200 hover:shadow-soft">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-500">Bảo mật đăng nhập, phân quyền và phê duyệt sinh trắc học tập trung.</p>
        </section>

        <section className="flex items-center justify-center px-6 py-10">
          <form onSubmit={submit} className="premium-card login-card w-full max-w-md rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-normal text-slate-950">Đăng nhập BIZEN</h2>
              <p className="mt-2 text-sm text-slate-500">Admin/nhân sự/quản lý ca → dashboard · Nhân viên → cổng web/mobile · Chủ nền tảng BIZEN → duyệt doanh nghiệp.</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                <Link to="/register-company" className="text-blue-700 hover:text-blue-800">
                  Đăng ký doanh nghiệp (khách hàng)
                </Link>
                <Link to="/register-employee" className="text-slate-600 hover:text-blue-700">
                  Nhân viên chưa được cấp mật khẩu?
                </Link>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Chủ nền tảng: đăng nhập bằng tài khoản Platform Admin (cấu hình SERVER) → tự vào màn duyệt tenant.
              </p>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Email
              <span className="soft-focus mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <UserRound className="h-4 w-4 text-slate-400" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full outline-none" placeholder="name@company.com" />
              </span>
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Mật khẩu
              <span className="soft-focus mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full outline-none" />
              </span>
            </label>

            {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}

            <button type="submit" disabled={loading} className="btn-motion login-submit-button mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 disabled:bg-slate-300">
              <span>{loading ? "Đang đăng nhập" : "Vào hệ thống"}</span>
            </button>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-normal text-slate-400">Google Auth</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <GoogleLoginButton onSuccess={handleGoogleSuccess} />

            <details className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">Luồng SaaS (3 tính năng demo)</summary>
              <div className="mt-3 space-y-3">
                {mvpDemoFeatures.map((feature) => (
                  <WorkflowStepsCard key={feature.id} title={feature.title} steps={feature.steps} skippable={feature.skippable} />
                ))}
              </div>
            </details>
          </form>
        </section>
      </div>
    </main>
  );
}

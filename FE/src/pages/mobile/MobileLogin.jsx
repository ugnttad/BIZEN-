import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, LockKeyhole, Mail, Smartphone } from "lucide-react";
import GoogleLoginButton from "../../modules/auth/GoogleLoginButton";
import { bizenApi } from "../../modules/api/bizenApi";
import { getDefaultPathForRole, saveAuthSession } from "../../modules/auth/authStore";
import { saveMobileEmployee } from "../../modules/auth/mobileSession";

export default function MobileLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function finishLogin(session) {
    saveAuthSession(session);

    if (session.user.role !== "Employee") {
      navigate(getDefaultPathForRole(session.user.role), { replace: true });
      return;
    }

    if (!session.user.employeeId) {
      setError("Tài khoản chưa gắn hồ sơ nhân viên. Nhờ HR duyệt tài khoản và tạo hồ sơ trước.");
      return;
    }

    const employee = await bizenApi.employee(session.user.employeeId);
    saveMobileEmployee(employee);
    navigate("/mobile/home", { replace: true });
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
      await finishLogin({ token, user });
    } catch (err) {
      setError(err.message || "Không hoàn tất được đăng nhập Google.");
    }
  }

  return (
    <main className="app-background min-h-screen px-0 py-0 sm:px-6 sm:py-8">
      <div className="ambient-grid pointer-events-none fixed inset-x-0 top-0 h-64" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-between overflow-hidden bg-white/90 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-xl sm:min-h-[860px] sm:rounded-[30px] sm:border sm:border-white/70">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-teal-400 to-amber-400" />
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-normal text-slate-950">BIZEN</p>
              <p className="text-sm text-slate-500">Employee App</p>
            </div>
          </div>

          <div className="mt-14">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <Smartphone className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-normal text-slate-950">Đăng nhập</h1>
            <p className="mt-2 text-sm text-slate-500">Dùng tài khoản nhân viên để chấm công, xem lịch và bảng lương.</p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <span className="soft-focus mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full outline-none" placeholder="name@company.com" />
              </span>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Mật khẩu
              <span className="soft-focus mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full outline-none" />
              </span>
            </label>

            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}

            <button type="submit" disabled={loading} className="btn-motion w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-300">
              {loading ? "Đang đăng nhập" : "Vào app"}
            </button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-normal text-slate-400">Google</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <GoogleLoginButton mode="mobile" onSuccess={handleGoogleSuccess} />
            <Link to="/register-employee" className="block text-center text-sm font-semibold text-blue-700 hover:text-blue-800">
              Yêu cầu tài khoản employee
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, LockKeyhole, Smartphone, UserRound } from "lucide-react";
import GoogleLoginButton from "../../modules/auth/GoogleLoginButton";

export default function MobileLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("thanhdat@bizen.vn");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      setError("Email hoặc mật khẩu chưa hợp lệ.");
      return;
    }
    navigate("/mobile/home");
  }

  function handleGoogleSuccess() {
    navigate("/mobile/home");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-0 py-0 sm:px-6 sm:py-8">
      <section className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-between bg-white p-6 shadow-soft sm:min-h-[860px] sm:rounded-[28px]">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-600 text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-normal text-slate-950">BIZEN</p>
              <p className="text-sm text-slate-500">Employee App</p>
            </div>
          </div>

          <div className="mt-14">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <Smartphone className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-normal text-slate-950">Đăng nhập</h1>
            <p className="mt-2 text-sm text-slate-500">Chấm công, lịch làm, lương và nghỉ phép.</p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3">
                <UserRound className="h-4 w-4 text-slate-400" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full outline-none" />
              </span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Mật khẩu
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full outline-none" />
              </span>
            </label>
            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
            <button type="submit" className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              Vào app
            </button>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-normal text-slate-400">Google</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <GoogleLoginButton mode="mobile" onSuccess={handleGoogleSuccess} />
          </form>
        </div>

        <button onClick={() => navigate("/web/dashboard")} className="rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700">
          Mở web dashboard
        </button>
      </section>
    </main>
  );
}

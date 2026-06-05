import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, LockKeyhole, Mail, Send } from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import { bizenApi } from "../modules/api/bizenApi";

export default function PasswordResetPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const isConfirmMode = Boolean(token);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const title = useMemo(() => (isConfirmMode ? "Đặt lại mật khẩu" : "Quên mật khẩu"), [isConfirmMode]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (isConfirmMode) {
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
        setError("Mật khẩu cần tối thiểu 8 ký tự, có chữ và số.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Xác nhận mật khẩu chưa khớp.");
        return;
      }
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) {
      setError("Email chưa hợp lệ.");
      return;
    }

    setLoading(true);
    try {
      if (isConfirmMode) {
        const payload = await bizenApi.confirmPasswordReset({ token, password });
        setMessage(payload.message || "Mật khẩu đã được cập nhật.");
        setPassword("");
        setConfirmPassword("");
      } else {
        const payload = await bizenApi.requestPasswordReset(email.trim().toLowerCase());
        setMessage(payload.message || "Nếu email tồn tại, BIZEN sẽ gửi link đặt lại mật khẩu.");
      }
    } catch (err) {
      setError(err.message || "Không xử lý được yêu cầu đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-background grid min-h-screen place-items-center px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>
        <div className="mt-8">
          <BrandLogo />
          <h1 className="mt-6 text-3xl font-bold text-slate-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isConfirmMode
              ? "Nhập mật khẩu mới cho tài khoản BIZEN. Link reset chỉ dùng được một lần."
              : "Nhập email thật đã dùng để đăng ký. BIZEN sẽ gửi link đặt lại mật khẩu nếu tài khoản đã được duyệt."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          {isConfirmMode ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Mật khẩu mới
                <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full outline-none" />
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Nhập lại mật khẩu
                <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full outline-none" />
                </span>
              </label>
            </>
          ) : (
            <label className="block text-sm font-medium text-slate-700">
              Email tài khoản
              <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <Mail className="h-4 w-4 text-slate-400" />
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full outline-none" placeholder="name@company.com" />
              </span>
            </label>
          )}

          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
          {message ? (
            <div className="flex gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{message}</p>
            </div>
          ) : null}

          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-300">
            <Send className="h-4 w-4" />
            {loading ? "Đang xử lý" : isConfirmMode ? "Cập nhật mật khẩu" : "Gửi link đặt lại mật khẩu"}
          </button>
        </form>
      </section>
    </main>
  );
}

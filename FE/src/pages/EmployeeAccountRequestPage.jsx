import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, LockKeyhole, Mail, Send, UserRound } from "lucide-react";
import WorkflowStepsCard from "../components/WorkflowStepsCard";
import { mvpDemoFeatures } from "../constants/saasWorkflow";
import { bizenApi } from "../modules/api/bizenApi";

const hrOpsFeature = mvpDemoFeatures.find((f) => f.id === "hr-ops");

export default function EmployeeAccountRequestPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Email chưa hợp lệ.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu cần tối thiểu 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Xác nhận mật khẩu chưa khớp.");
      return;
    }

    setLoading(true);
    try {
      const payload = await bizenApi.requestEmployeeAccount({ email, password });
      setResult(payload);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Không gửi được yêu cầu tài khoản.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
            <div className="mt-10 grid h-14 w-14 place-items-center rounded-lg bg-slate-950 text-white">
              <UserRound className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-normal text-slate-950 md:text-4xl">Yêu cầu tài khoản nhân viên</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Tài khoản chỉ tạo khi doanh nghiệp đã có hồ sơ nhân viên trên BIZEN. HR hoặc Admin công ty duyệt trước khi bạn đăng nhập mobile.
            </p>
          </div>

          {hrOpsFeature ? (
            <WorkflowStepsCard className="mt-8" title="Luồng bắt buộc" steps={hrOpsFeature.steps} skippable={hrOpsFeature.skippable} />
          ) : null}

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Nếu hệ thống báo chưa có hồ sơ — nhờ HR tạo employee profile trước, rồi gửi lại yêu cầu với đúng email.
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-normal text-blue-600">Bước 3 · Nhân viên</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Thông tin tài khoản</h2>
          </div>

          {result ? (
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div>
                  <p className="font-semibold text-emerald-900">{result.status === "Approved" ? "Tài khoản đã sẵn sàng" : "Yêu cầu đang chờ duyệt"}</p>
                  <p className="mt-1 text-sm text-emerald-800">
                    Email: <span className="font-semibold">{result.email}</span> · Trạng thái: <span className="font-semibold">{result.status}</span>
                  </p>
                  <Link to="/mobile/login" className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:text-blue-800">
                    Đăng nhập mobile
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          <form onSubmit={submit} className="grid gap-4">
            <label className="block text-sm font-medium text-slate-700">
              Email nhân viên (trùng hồ sơ HR)
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <Mail className="h-4 w-4 text-slate-400" />
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full outline-none" placeholder="name@company.com" />
              </span>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Mật khẩu
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full outline-none" />
              </span>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Nhập lại mật khẩu
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full outline-none" />
              </span>
            </label>

            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}

            <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">
              <Send className="h-4 w-4" />
              {loading ? "Đang gửi…" : "Gửi yêu cầu tài khoản"}
            </button>

            <Link to="/register-company" className="text-center text-sm font-semibold text-blue-700 hover:text-blue-800">
              Doanh nghiệp chưa có trên BIZEN
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}

import { useState } from "react";
import { Building2, CheckCircle2, Clock3, CreditCard, ShieldCheck, UsersRound } from "lucide-react";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import { departments } from "../../data/mockData";

export default function Settings() {
  const [settings, setSettings] = useState({
    workStart: "08:00",
    workEnd: "17:00",
    lateGrace: 10,
    payrollFormula: "Base salary / 22 x working days + OT + bonus - deduction",
    overtimeFormula: "Hourly rate x 150%",
    annualLeave: 12
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function saveSettings(event) {
    event.preventDefault();
    if (Number(settings.lateGrace) < 0 || Number(settings.annualLeave) < 0) {
      setError("Quy định đi trễ và ngày phép không được âm.");
      return;
    }
    setError("");
    setSaved(true);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Cấu hình hệ thống"
        description="Thiết lập giờ làm chuẩn, quy định đi trễ, công thức lương, OT, phòng ban và vai trò."
        actions={
          <button onClick={saveSettings} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Lưu cấu hình
          </button>
        }
      />

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <form onSubmit={saveSettings} className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
                <Clock3 className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-950">Giờ làm và đi trễ</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Giờ bắt đầu
                <input value={settings.workStart} onChange={(event) => setSettings({ ...settings, workStart: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Giờ kết thúc
                <input value={settings.workEnd} onChange={(event) => setSettings({ ...settings, workEnd: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Grace period phút
                <input type="number" value={settings.lateGrace} onChange={(event) => setSettings({ ...settings, lateGrace: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-50 text-violet-700">
                <CreditCard className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-950">Công thức lương</h2>
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-medium text-slate-700">
                Payroll formula
                <textarea value={settings.payrollFormula} onChange={(event) => setSettings({ ...settings, payrollFormula: event.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                OT formula
                <input value={settings.overtimeFormula} onChange={(event) => setSettings({ ...settings, overtimeFormula: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Số ngày phép năm
                <input type="number" value={settings.annualLeave} onChange={(event) => setSettings({ ...settings, annualLeave: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <Building2 className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-950">Phòng ban</h2>
            </div>
            <div className="space-y-2">
              {departments.map((department) => (
                <div key={department.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-sm font-semibold text-slate-950">{department.name}</span>
                  <span className="text-xs font-semibold text-slate-500">{department.targetHeadcount} người</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-950">Vai trò</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Admin", "HR", "Manager", "Employee"].map((role) => (
                <div key={role} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                  {role}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-950">Phân quyền</h2>
                <p className="mt-1 text-sm text-slate-500">Admin cấu hình, HR vận hành, Manager duyệt nhóm, Employee dùng mobile.</p>
              </div>
            </div>
          </section>
        </aside>
      </form>

      <Modal
        open={saved}
        title="Đã lưu cấu hình"
        onClose={() => setSaved(false)}
        footer={<button onClick={() => setSaved(false)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Đóng</button>}
      >
        <div className="flex gap-3 text-sm text-slate-600">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p>Cấu hình demo đã được cập nhật cho giờ làm, payroll và nghỉ phép.</p>
        </div>
      </Modal>
    </div>
  );
}

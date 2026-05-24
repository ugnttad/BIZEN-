import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Clock3, CreditCard, ShieldCheck, UsersRound } from "lucide-react";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";

export default function Settings() {
  const [settings, setSettings] = useState({
    workStart: "08:00",
    workEnd: "17:00",
    lateGraceMinutes: 10,
    payrollFormula: "Base salary / 22 x working days + OT + bonus - deduction",
    overtimeFormula: "Hourly rate x 150%",
    annualLeaveDays: 12
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([bizenApi.settings(), bizenApi.departments()])
      .then(([settingsData, departmentRows]) => {
        if (settingsData) setSettings(settingsData);
        setDepartments(departmentRows);
      })
      .catch((requestError) => setError(requestError.message || "Không tải được bộ phận/nhóm từ Neon."));
  }, []);

  async function saveSettings(event) {
    event.preventDefault();
    if (Number(settings.lateGraceMinutes) < 0 || Number(settings.annualLeaveDays) < 0) {
      setError("Quy định đi trễ và ngày phép không được âm.");
      return;
    }
    setError("");
    await bizenApi.updateSettings(settings);
    setSaved(true);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Cấu hình hệ thống"
        description="Thiết lập giờ làm chuẩn, quy định đi trễ, công thức lương, OT và bộ phận/nhóm cho cửa hàng."
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
                <input type="number" value={settings.lateGraceMinutes} onChange={(event) => setSettings({ ...settings, lateGraceMinutes: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
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
                <input type="number" value={settings.annualLeaveDays} onChange={(event) => setSettings({ ...settings, annualLeaveDays: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
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
              <h2 className="text-base font-semibold text-slate-950">Bộ phận / nhóm</h2>
            </div>
            <div className="space-y-2">
              {departments.map((department) => (
                <div key={department.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-950">{department.name}</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {department.employeeCount ?? 0}/{department.targetHeadcount} người
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.min(100, ((department.employeeCount || 0) / Math.max(1, department.targetHeadcount || 1)) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Active {department.activeCount ?? 0} · Nghỉ {department.onLeaveCount ?? 0} · Quỹ lương {formatCurrency(department.baseSalaryTotal || 0)}
                  </p>
                </div>
              ))}
              {departments.length === 0 ? <p className="text-sm text-slate-500">Chưa có bộ phận/nhóm hoặc API đang lỗi.</p> : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-950">Quyền truy cập</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Chủ sở hữu", "Nhân viên"].map((role) => (
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
                <p className="mt-1 text-sm text-slate-500">Chủ sở hữu có toàn quyền. Nhân viên chỉ dùng cổng tự phục vụ; quản lý ca là chức vụ công việc, không phải quyền riêng.</p>
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
          <p>Cấu hình đã được cập nhật cho giờ làm, payroll và nghỉ phép.</p>
        </div>
      </Modal>
    </div>
  );
}

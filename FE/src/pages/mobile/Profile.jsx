import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import Avatar from "../../components/Avatar";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";
import { clearMobileEmployeeSession, getMobileEmployeeId } from "../../modules/auth/mobileSession";

export default function Profile() {
  const navigate = useNavigate();
  const mobileEmployeeId = getMobileEmployeeId();
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mobileEmployeeId) return;
    bizenApi.employee(mobileEmployeeId).then(setEmployee).catch((err) => setError(err.message || "Không tải được hồ sơ."));
  }, [mobileEmployeeId]);

  function logout() {
    clearMobileEmployeeSession();
    navigate("/mobile/login", { replace: true });
  }

  if (error) {
    return <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</section>;
  }

  if (!employee) {
    return <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Đang tải hồ sơ từ Neon...</section>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-5 text-center">
        <Avatar name={employee.name} src={employee.avatarUrl} size="xl" className="mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-slate-950">{employee.name}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {employee.id} · {employee.department}
        </p>
        <div className="mt-3 flex justify-center">
          <StatusBadge status={employee.role} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="space-y-3">
          {[
            { icon: UserRound, label: "Chức vụ", value: employee.position },
            { icon: Mail, label: "Email", value: employee.email },
            { icon: Phone, label: "Điện thoại", value: employee.phone },
            { icon: ShieldCheck, label: "Hợp đồng", value: employee.contractType }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                <Icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-950">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700">
        <LogOut className="h-4 w-4" />
        Đăng xuất
      </button>
    </div>
  );
}

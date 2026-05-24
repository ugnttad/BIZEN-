import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Check, Filter, Send, X } from "lucide-react";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";

const emptyForm = {
  employeeId: "",
  type: "Annual leave",
  from: new Date().toISOString().slice(0, 10),
  to: new Date().toISOString().slice(0, 10),
  days: 1,
  reason: ""
};

export default function LeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([bizenApi.leaves(), bizenApi.employees()]).then(([leaveRows, employeeRows]) => {
      setRequests(leaveRows);
      setEmployees(employeeRows);
      setForm((current) => (current.employeeId ? current : { ...current, employeeId: employeeRows[0]?.id || "" }));
    });
  }, []);

  const rows = useMemo(() => {
    return requests.filter((request) => status === "All" || request.status === status);
  }, [requests, status]);

  async function updateStatus(id, nextStatus) {
    await bizenApi.updateLeaveStatus(id, nextStatus);
    setRequests((current) => current.map((request) => (request.id === id ? { ...request, status: nextStatus } : request)));
  }

  async function submitLeave(event) {
    event.preventDefault();
    if (!form.reason.trim() || Number(form.days) <= 0) {
      setError("Vui lòng nhập lý do và số ngày nghỉ hợp lệ.");
      return;
    }
    await bizenApi.createLeave({ ...form, days: Number(form.days), approver: "Võ Khánh Linh" });
    const leaveRows = await bizenApi.leaves();
    setRequests(leaveRows);
    setForm(emptyForm);
    setError("");
    setFormOpen(false);
  }

  const pending = requests.filter((request) => request.status === "Pending").length;
  const approved = requests.filter((request) => request.status === "Approved").length;
  const rejected = requests.filter((request) => request.status === "Rejected").length;

  return (
    <div>
      <PageHeader
        eyebrow="Leave Management"
        title="Đơn nghỉ phép"
        description="Nhân viên gửi đơn, chủ sở hữu duyệt và dữ liệu được đưa vào lịch làm việc."
        actions={
          <button onClick={() => setFormOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <CalendarPlus className="h-4 w-4" />
            Tạo đơn nghỉ
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Chờ duyệt" value={pending} helper="đơn mới" tone="amber" />
        <StatCard title="Đã duyệt" value={approved} helper="tích hợp lịch" tone="emerald" />
        <StatCard title="Từ chối" value={rejected} helper="cần phản hồi" tone="rose" />
        <StatCard title="Ngày phép trung bình" value="7.1" helper="ngày còn lại" tone="blue" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="px-1 text-base font-semibold text-slate-950">Danh sách đơn</h2>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="bg-white text-sm outline-none">
                {["All", "Pending", "Approved", "Rejected"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          {rows.length === 0 ? (
            <EmptyState title="Không có đơn nghỉ" description="Không có đơn phù hợp với bộ lọc hiện tại." />
          ) : (
            <div className="space-y-3">
              {rows.map((request) => (
                <div key={request.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={request.employeeName} />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">{request.employeeName}</p>
                          <StatusBadge status={request.status} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {request.type} · {request.from} - {request.to} · {request.days} ngày
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{request.reason}</p>
                      </div>
                    </div>
                    {request.status === "Pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(request.id, "Approved")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                          <Check className="h-4 w-4" />
                          Duyệt
                        </button>
                        <button onClick={() => updateStatus(request.id, "Rejected")} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                          <X className="h-4 w-4" />
                          Từ chối
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Duyệt bởi {request.approver}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Số ngày phép còn lại</h2>
            <div className="mt-4 space-y-3">
              {employees.slice(0, 6).map((employee) => (
                <div key={employee.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={employee.name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{employee.name}</p>
                      <p className="text-xs text-slate-500">{employee.department}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-blue-700">{employee.leaveRemaining} ngày</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
            <h2 className="font-semibold">Tích hợp AI Scheduling</h2>
            <p className="mt-2 text-sm">Nhân viên đã nghỉ phép sẽ bị loại khỏi danh sách xếp ca tự động trong tuần tương ứng.</p>
          </section>
        </aside>
      </div>

      <Modal
        open={formOpen}
        title="Gửi đơn nghỉ phép"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Hủy
            </button>
            <button onClick={submitLeave} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Send className="h-4 w-4" />
              Gửi
            </button>
          </>
        }
      >
        <form onSubmit={submitLeave} className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-medium text-slate-700">
            Nhân viên
            <select value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Từ ngày
                  <input type="date" value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Đến ngày
                  <input type="date" value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Số ngày
            <input type="number" min="0.5" step="0.5" value={form.days} onChange={(event) => setForm({ ...form, days: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Loại nghỉ
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
              <option>Annual leave</option>
              <option>Sick leave</option>
              <option>Unpaid leave</option>
            </select>
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-slate-700">
            Lý do
            <textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none" />
          </label>
          {error ? <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
        </form>
      </Modal>
    </div>
  );
}

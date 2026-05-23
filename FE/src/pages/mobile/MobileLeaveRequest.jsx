import { useMemo, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { bizenApi } from "../../modules/api/bizenApi";
import { getMobileEmployeeId } from "../../modules/auth/mobileSession";

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value, days) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

export default function MobileLeaveRequest() {
  const employeeId = getMobileEmployeeId();
  const tomorrow = useMemo(() => addDays(formatDateInput(new Date()), 1), []);
  const [leaveType, setLeaveType] = useState("Annual leave");
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(1);
  const [fromDate, setFromDate] = useState(tomorrow);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!reason.trim() || Number(days) <= 0) {
      setError("Vui lòng nhập lý do và số ngày nghỉ.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await bizenApi.createLeave({
        employeeId,
        type: leaveType,
        from: fromDate,
        to: addDays(fromDate, Math.max(Math.ceil(Number(days)) - 1, 0)),
        days: Number(days),
        reason,
        approver: "Manager"
      });
      setSent(true);
      setReason("");
    } catch (err) {
      setError(err.message || "Không gửi được đơn nghỉ phép.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-950">Gửi đơn nghỉ phép</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Loại nghỉ
            <select value={leaveType} onChange={(event) => setLeaveType(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none">
              <option>Annual leave</option>
              <option>Sick leave</option>
              <option>Unpaid leave</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-slate-700">
              Từ
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-3 outline-none" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Số ngày
              <input type="number" min="0.5" step="0.5" value={days} onChange={(event) => setDays(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-3 outline-none" />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Lý do
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-3 outline-none" />
          </label>
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
          <button disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white disabled:bg-slate-300">
            <Send className="h-4 w-4" />
            {submitting ? "Đang gửi" : "Gửi đơn"}
          </button>
        </form>
      </section>

      {sent ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Đơn đã gửi
          </div>
          <p className="mt-1 text-sm">Manager sẽ nhận thông báo và phản hồi trên app.</p>
        </section>
      ) : null}
    </div>
  );
}

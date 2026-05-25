import { useEffect, useState } from "react";
import { CalendarDays, CalendarX2, Loader2, Send, Trash2 } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";
import { getMobileEmployeeId } from "../../modules/auth/mobileSession";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function MySchedule() {
  const myId = getMobileEmployeeId();
  const [scheduleWeek, setScheduleWeek] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [availabilityRows, setAvailabilityRows] = useState([]);
  const [busyDate, setBusyDate] = useState(todayIso());
  const [busyReason, setBusyReason] = useState("");
  const [savingBusy, setSavingBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([bizenApi.scheduleWeek(), bizenApi.shifts(), bizenApi.scheduleAvailability(myId)])
      .then(([scheduleRows, shiftRows, availability]) => {
        setScheduleWeek(scheduleRows);
        setShifts(shiftRows);
        setAvailabilityRows(availability);
      })
      .catch((err) => setError(err.message || "Không tải được lịch làm."));
  }, [myId]);

  const mySchedule = scheduleWeek
    .map((day) => ({
      ...day,
      slots: day.shifts.filter((slot) => slot.employees.includes(myId))
    }))
    .filter((day) => day.slots.length);

  async function submitBusyDate(event) {
    event.preventDefault();
    if (!busyDate) return;

    setSavingBusy(true);
    setBusyMessage("");
    try {
      const saved = await bizenApi.createScheduleAvailability({
        employeeId: myId,
        busyDate,
        reason: busyReason
      });
      setAvailabilityRows((current) =>
        [saved, ...current.filter((item) => item.id !== saved.id && item.busyDate !== saved.busyDate)].sort((a, b) => a.busyDate.localeCompare(b.busyDate))
      );
      setBusyReason("");
      setBusyMessage("Đã gửi lịch bận. AI và chủ sở hữu sẽ né ngày này khi xếp ca.");
    } catch (err) {
      setBusyMessage(err.message || "Không gửi được lịch bận.");
    } finally {
      setSavingBusy(false);
    }
  }

  async function deleteBusyDate(id) {
    setBusyMessage("");
    try {
      await bizenApi.deleteScheduleAvailability(id);
      setAvailabilityRows((current) => current.filter((item) => item.id !== id));
      setBusyMessage("Đã xoá lịch bận.");
    } catch (err) {
      setBusyMessage(err.message || "Không xoá được lịch bận.");
    }
  }

  if (error) {
    return <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</section>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-950">Lịch làm của tôi</h2>
          <CalendarDays className="h-5 w-5 text-blue-600" />
        </div>
        <div className="mt-4 space-y-3">
          {mySchedule.length ? (
            mySchedule.map((day) => (
              <div key={day.date} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-950">{day.day}</p>
                  <span className="text-sm text-slate-500">{day.date}</span>
                </div>
                {day.slots.map((slot) => {
                  const shift = shifts.find((item) => item.id === slot.shiftId) || { name: slot.shiftId, time: "-" };
                  return (
                    <div key={slot.shiftId} className="mt-3 rounded-lg bg-blue-50 p-3">
                      <p className="font-semibold text-blue-900">{shift.name}</p>
                      <p className="mt-1 text-sm text-blue-700">{shift.time}</p>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">Chưa có ca nào được xếp cho tuần này.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-950">Báo lịch bận</h2>
          <CalendarX2 className="h-5 w-5 text-rose-600" />
        </div>

        <form onSubmit={submitBusyDate} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Ngày bận
            <input
              type="date"
              min={todayIso()}
              value={busyDate}
              onChange={(event) => setBusyDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Lý do
            <input
              value={busyReason}
              onChange={(event) => setBusyReason(event.target.value)}
              maxLength={200}
              placeholder="VD: đi học, việc gia đình, lịch cá nhân"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button
            type="submit"
            disabled={savingBusy || !busyDate}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 py-2.5 text-sm font-bold text-white disabled:bg-slate-300"
          >
            {savingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Gửi lịch bận
          </button>
        </form>

        {busyMessage ? <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">{busyMessage}</p> : null}

        <div className="mt-4 space-y-2">
          {availabilityRows.length ? (
            availabilityRows.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{item.displayDate || item.busyDate}</p>
                  <p className="truncate text-sm text-slate-500">{item.reason || "Không ghi lý do"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteBusyDate(item.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Xoá lịch bận"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">Bạn chưa báo ngày bận nào.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-amber-900">Ca 23/05 cần xác nhận</p>
          <StatusBadge status="Pending" />
        </div>
        <p className="mt-1 text-sm text-amber-800">Chủ sở hữu đang kiểm tra lịch trước khi chốt ca.</p>
      </section>
    </div>
  );
}

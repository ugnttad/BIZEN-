import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";
import { getMobileEmployeeId } from "../../modules/auth/mobileSession";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return `Tháng ${month}/${year}`;
}

function shiftMonth(monthKey, offset) {
  const [year, month] = monthKey.split("-").map(Number);
  return toIsoDate(new Date(year, month - 1 + offset, 1)).slice(0, 7);
}

function buildCalendarDays(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toIsoDate(date);
    return {
      iso,
      dateNumber: date.getDate(),
      monthKey: iso.slice(0, 7)
    };
  });
}

export default function MySchedule() {
  const myId = getMobileEmployeeId();
  const [scheduleWeek, setScheduleWeek] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [availabilityRows, setAvailabilityRows] = useState([]);
  const [busyReason, setBusyReason] = useState("");
  const [savingBusy, setSavingBusy] = useState(false);
  const [busySavingDate, setBusySavingDate] = useState("");
  const [busyMessage, setBusyMessage] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => todayIso().slice(0, 7));
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

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const busyByDate = useMemo(() => new Map(availabilityRows.map((item) => [item.busyDate, item])), [availabilityRows]);
  const selectedMonthBusyRows = useMemo(
    () => availabilityRows.filter((item) => item.busyDate?.startsWith(calendarMonth)).sort((a, b) => a.busyDate.localeCompare(b.busyDate)),
    [availabilityRows, calendarMonth]
  );

  async function toggleBusyDate(date) {
    if (date < todayIso() || savingBusy) return;

    const existing = busyByDate.get(date);
    setSavingBusy(true);
    setBusySavingDate(date);
    setBusyMessage("");
    try {
      if (existing) {
        await bizenApi.deleteScheduleAvailability(existing.id);
        setAvailabilityRows((current) => current.filter((item) => item.id !== existing.id));
        setBusyMessage("Đã bỏ ngày bận khỏi lịch.");
      } else {
        const saved = await bizenApi.createScheduleAvailability({
          employeeId: myId,
          busyDate: date,
          reason: busyReason.trim() || "Bận cá nhân"
        });
        setAvailabilityRows((current) =>
          [saved, ...current.filter((item) => item.id !== saved.id && item.busyDate !== saved.busyDate)].sort((a, b) => a.busyDate.localeCompare(b.busyDate))
        );
        setBusyMessage("Đã đánh dấu ngày bận. AI và chủ sở hữu sẽ né ngày này khi xếp ca.");
      }
    } catch (err) {
      setBusyMessage(err.message || "Không cập nhật được lịch bận.");
    } finally {
      setSavingBusy(false);
      setBusySavingDate("");
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

        <div className="mt-4 rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCalendarMonth((current) => shiftMonth(current, -1))}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-bold text-slate-950">{monthLabel(calendarMonth)}</p>
            <button
              type="button"
              onClick={() => setCalendarMonth((current) => shiftMonth(current, 1))}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Tháng sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-normal text-slate-400">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const busy = busyByDate.get(day.iso);
              const isCurrentMonth = day.monthKey === calendarMonth;
              const isPast = day.iso < todayIso();
              const isToday = day.iso === todayIso();
              const isSaving = busySavingDate === day.iso;
              return (
                <button
                  key={day.iso}
                  type="button"
                  onClick={() => toggleBusyDate(day.iso)}
                  disabled={isPast || savingBusy}
                  className={[
                    "relative grid h-11 place-items-center rounded-lg border text-sm font-bold transition",
                    busy ? "border-rose-500 bg-rose-500 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700",
                    isToday && !busy ? "border-blue-300 bg-blue-50 text-blue-700" : "",
                    !isCurrentMonth && !busy ? "bg-slate-50 text-slate-300" : "",
                    isPast ? "cursor-not-allowed opacity-45" : "active:scale-[0.98]"
                  ].join(" ")}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : day.dateNumber}
                </button>
              );
            })}
          </div>
        </div>

        <label className="mt-3 block text-sm font-semibold text-slate-700">
          Ghi chú cho ngày bận mới
          <input
            value={busyReason}
            onChange={(event) => setBusyReason(event.target.value)}
            maxLength={200}
            placeholder="VD: đi học, việc gia đình, lịch cá nhân"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        {busyMessage ? <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">{busyMessage}</p> : null}

        <div className="mt-4 space-y-2">
          {selectedMonthBusyRows.length ? (
            selectedMonthBusyRows.map((item) => (
              <div key={item.id} className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-rose-900">{item.displayDate || item.busyDate}</p>
                  <StatusBadge status="Busy" />
                </div>
                <p className="mt-1 truncate text-sm text-rose-700">{item.reason || "Bận cá nhân"}</p>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">Chưa có ngày bận trong tháng này.</p>
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

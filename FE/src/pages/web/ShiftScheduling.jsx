import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarX2,
  CalendarPlus2,
  CheckCircle2,
  GripVertical,
  Loader2,
  RotateCcw,
  Sparkles,
  UserMinus,
  UsersRound
} from "lucide-react";
import Avatar from "../../components/Avatar";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";

const demoWeek = [
  { workDate: "2026-05-18", day: "Thứ 2", date: "18/05" },
  { workDate: "2026-05-19", day: "Thứ 3", date: "19/05" },
  { workDate: "2026-05-20", day: "Hôm nay", date: "20/05" },
  { workDate: "2026-05-21", day: "Thứ 5", date: "21/05" },
  { workDate: "2026-05-22", day: "Thứ 6", date: "22/05" },
  { workDate: "2026-05-23", day: "Thứ 7", date: "23/05" },
  { workDate: "2026-05-24", day: "CN", date: "24/05" }
];

const shiftTone = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700"
};

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeWorkDate(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function parseLeaveDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function getDayKey(day) {
  return day.workDate || day.date;
}

function normalizeScheduleRows(rows, shiftRows) {
  const sourceDays = rows?.length ? rows : demoWeek;

  return sourceDays.map((row, index) => {
    const fallback = demoWeek[index] || demoWeek[0];
    const slotsByShift = new Map((row.shifts || []).map((slot) => [slot.shiftId, unique(slot.employees || [])]));

    return {
      workDate: normalizeWorkDate(row.workDate || row.work_date) || fallback.workDate,
      day: row.day || fallback.day,
      date: row.date || fallback.date,
      shifts: shiftRows.map((shift) => ({
        shiftId: shift.id,
        employees: slotsByShift.get(shift.id) || []
      }))
    };
  });
}

function serializeSchedule(days) {
  return {
    days: days.map((day) => ({
      workDate: day.workDate,
      day: day.day,
      date: day.date,
      shifts: day.shifts.map((slot) => ({
        shiftId: slot.shiftId,
        employees: unique(slot.employees)
      }))
    }))
  };
}

function getShiftTone(color) {
  return shiftTone[color] || "border-blue-200 bg-blue-50 text-blue-700";
}

function isEmployeeOnLeave(employeeId, workDate, leaveBlocks) {
  return leaveBlocks.find((leave) => leave.employeeId === employeeId && leave.from <= workDate && workDate <= leave.to);
}

function isEmployeeBusy(employeeId, workDate, busyBlocks) {
  return busyBlocks.find((busy) => busy.employeeId === employeeId && busy.busyDate === workDate);
}

function getEmployeeUnavailable(employeeId, workDate, leaveBlocks, busyBlocks) {
  const leave = isEmployeeOnLeave(employeeId, workDate, leaveBlocks);
  if (leave) {
    return {
      type: "Leave",
      label: `nghỉ ${leave.label}`,
      message: `đang nghỉ ${leave.label}`
    };
  }

  const busy = isEmployeeBusy(employeeId, workDate, busyBlocks);
  if (busy) {
    return {
      type: "Busy",
      label: `${busy.displayDate}${busy.reason ? ` - ${busy.reason}` : ""}`,
      message: `đã báo bận ngày ${busy.displayDate}${busy.reason ? ` (${busy.reason})` : ""}`
    };
  }

  return null;
}

function readDragPayload(event, fallback) {
  try {
    return JSON.parse(event.dataTransfer.getData("application/json"));
  } catch {
    return fallback;
  }
}

export default function ShiftScheduling() {
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [scheduleWeek, setScheduleWeek] = useState([]);
  const [baselineSchedule, setBaselineSchedule] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [availabilityRows, setAvailabilityRows] = useState([]);
  const [aiScheduleReasons, setAiScheduleReasons] = useState([]);
  const [dragItem, setDragItem] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([bizenApi.employees(), bizenApi.shifts(), bizenApi.scheduleWeek(), bizenApi.leaves(), bizenApi.scheduleAvailability()]).then(([employeeRows, shiftRows, scheduleRows, leaveRows, availability]) => {
      if (!active) return;
      const normalized = normalizeScheduleRows(scheduleRows, shiftRows);
      setEmployees(employeeRows);
      setShifts(shiftRows);
      setScheduleWeek(normalized);
      setBaselineSchedule(normalized);
      setLeaveRequests(leaveRows);
      setAvailabilityRows(availability);
      setAiScheduleReasons(["Không xếp nhân viên đang nghỉ phép hoặc đã báo bận.", "Cân bằng workload theo từng bộ phận/nhóm."]);
    });

    return () => {
      active = false;
    };
  }, []);

  const employeeMap = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);
  const shiftMap = useMemo(() => new Map(shifts.map((shift) => [shift.id, shift])), [shifts]);
  const leaveBlocks = useMemo(
    () =>
      leaveRequests
        .filter((request) => request.status === "Approved")
        .map((request) => ({
          employeeId: request.employeeId,
          employeeName: request.employeeName,
          from: parseLeaveDate(request.from),
          to: parseLeaveDate(request.to),
          label: `${request.from} - ${request.to}`
        }))
        .filter((request) => request.from && request.to),
    [leaveRequests]
  );
  const busyBlocks = useMemo(
    () =>
      availabilityRows
        .map((item) => ({
          ...item,
          busyDate: normalizeWorkDate(item.busyDate || item.busy_date)
        }))
        .filter((item) => item.employeeId && item.busyDate),
    [availabilityRows]
  );
  const weekDateSet = useMemo(() => new Set(scheduleWeek.map((day) => day.workDate).filter(Boolean)), [scheduleWeek]);
  const availabilityConflicts = useMemo(() => {
    const leaveItems = leaveBlocks
      .filter((leave) => scheduleWeek.some((day) => leave.from <= day.workDate && day.workDate <= leave.to))
      .map((leave) => ({
        id: `leave-${leave.employeeId}-${leave.from}-${leave.to}`,
        employeeId: leave.employeeId,
        employeeName: leave.employeeName,
        status: "Leave",
        label: leave.label
      }));

    const busyItems = busyBlocks
      .filter((busy) => weekDateSet.has(busy.busyDate))
      .map((busy) => ({
        id: busy.id,
        employeeId: busy.employeeId,
        employeeName: busy.employeeName,
        department: busy.department,
        status: "Busy",
        label: `${busy.displayDate || busy.busyDate}${busy.reason ? ` - ${busy.reason}` : ""}`
      }));

    return [...leaveItems, ...busyItems];
  }, [busyBlocks, leaveBlocks, scheduleWeek, weekDateSet]);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.status !== "Inactive"), [employees]);

  const coverage = useMemo(() => {
    let required = 0;
    let assigned = 0;
    let shortage = 0;
    let overloaded = 0;

    for (const day of scheduleWeek) {
      for (const slot of day.shifts) {
        const shift = shiftMap.get(slot.shiftId);
        const needed = Number(shift?.required || 0);
        const count = slot.employees.length;
        required += needed;
        assigned += count;
        shortage += Math.max(needed - count, 0);
        overloaded += Math.max(count - needed, 0);
      }
    }

    return { required, assigned, shortage, overloaded };
  }, [scheduleWeek, shiftMap]);

  function startDrag(event, payload) {
    setDragItem(payload);
    event.dataTransfer.effectAllowed = payload.fromDayKey ? "move" : "copy";
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.setData("text/plain", payload.employeeId);
  }

  function dropOnSlot(event, targetDayKey, targetShiftId) {
    event.preventDefault();
    const payload = readDragPayload(event, dragItem);
    const targetDay = scheduleWeek.find((day) => getDayKey(day) === targetDayKey);
    const employee = employeeMap.get(payload?.employeeId);
    if (!payload?.employeeId || !targetDay || !employee) return;

    const unavailable = getEmployeeUnavailable(payload.employeeId, targetDay.workDate, leaveBlocks, busyBlocks);
    if (unavailable) {
      setScheduleMessage(`${employee.name} ${unavailable.message}, không thể xếp vào ngày ${targetDay.date}.`);
      setDragItem(null);
      return;
    }

    setScheduleWeek((current) =>
      current.map((day) => {
        const dayKey = getDayKey(day);
        return {
          ...day,
          shifts: day.shifts.map((slot) => {
            let nextEmployees = unique(slot.employees);

            if (payload.fromDayKey && dayKey === payload.fromDayKey && slot.shiftId === payload.fromShiftId) {
              nextEmployees = nextEmployees.filter((id) => id !== payload.employeeId);
            }

            if (dayKey === targetDayKey) {
              nextEmployees = nextEmployees.filter((id) => id !== payload.employeeId);
            }

            if (dayKey === targetDayKey && slot.shiftId === targetShiftId) {
              nextEmployees = [...nextEmployees, payload.employeeId];
            }

            return { ...slot, employees: nextEmployees };
          })
        };
      })
    );
    setDirty(true);
    setDragItem(null);
    setScheduleMessage(`Đã xếp ${employee.name} vào ${targetDay.day} ${targetDay.date}. Bấm Apply Schedule để lưu.`);
  }

  function removeAssignment(dayKey, shiftId, employeeId) {
    const employee = employeeMap.get(employeeId);
    setScheduleWeek((current) =>
      current.map((day) =>
        getDayKey(day) === dayKey
          ? {
              ...day,
              shifts: day.shifts.map((slot) => (slot.shiftId === shiftId ? { ...slot, employees: slot.employees.filter((id) => id !== employeeId) } : slot))
            }
          : day
      )
    );
    setDirty(true);
    setScheduleMessage(`Đã gỡ ${employee?.name || employeeId} khỏi ca. Bấm Apply Schedule để lưu.`);
  }

  function dropToRemove(event) {
    event.preventDefault();
    const payload = readDragPayload(event, dragItem);
    if (!payload?.fromDayKey || !payload?.fromShiftId) return;
    removeAssignment(payload.fromDayKey, payload.fromShiftId, payload.employeeId);
    setDragItem(null);
  }

  function resetDraft() {
    setScheduleWeek(baselineSchedule);
    setDirty(false);
    setSuggested(false);
    setScheduleMessage("Đã hoàn tác thay đổi bản nháp.");
  }

  function autoFillMissingSlots() {
    setScheduleWeek((current) =>
      current.map((day) => {
        const assignedForDay = new Set(day.shifts.flatMap((slot) => slot.employees));
        return {
          ...day,
          shifts: day.shifts.map((slot) => {
            const shift = shiftMap.get(slot.shiftId);
            const needed = Number(shift?.required || 0);
            const nextEmployees = unique(slot.employees);

            for (const employee of activeEmployees) {
              if (nextEmployees.length >= needed) break;
              if (assignedForDay.has(employee.id)) continue;
              if (getEmployeeUnavailable(employee.id, day.workDate, leaveBlocks, busyBlocks)) continue;
              nextEmployees.push(employee.id);
              assignedForDay.add(employee.id);
            }

            return { ...slot, employees: nextEmployees };
          })
        };
      })
    );
    setDirty(true);
  }

  function suggestSchedule() {
    setSuggesting(true);
    setScheduleMessage("");
    bizenApi
      .aiSuggestSchedule()
      .then((payload) => {
        setSuggested(true);
        setAiScheduleReasons(payload.reasons || []);
        autoFillMissingSlots();
        setScheduleMessage("AI đã bổ sung nhân viên khả dụng vào các ca còn thiếu, có né lịch nghỉ và lịch bận đã báo. Bạn vẫn có thể kéo-thả để tinh chỉnh trước khi Apply.");
      })
      .finally(() => setSuggesting(false));
  }

  async function applySchedule() {
    setSaving(true);
    setSaveError("");
    try {
      const saved = await bizenApi.updateScheduleWeek(serializeSchedule(scheduleWeek));
      const normalized = normalizeScheduleRows(saved, shifts);
      setScheduleWeek(normalized);
      setBaselineSchedule(normalized);
      setDirty(false);
      setApplyOpen(false);
      setScheduleMessage("Đã lưu lịch tuần và đồng bộ xuống hệ thống.");
    } catch (error) {
      setSaveError(error.message || "Không lưu được lịch làm.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="AI-driven Scheduling"
        title="Xếp lịch tuần 18/05 - 24/05"
        description="Kéo nhân viên vào từng ca, đổi ca giữa các ngày, kiểm tra thiếu người và lưu lịch khi đã chốt."
        actions={
          <>
            <button
              onClick={suggestSchedule}
              disabled={suggesting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {suggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI Suggest Schedule
            </button>
            <button onClick={() => setApplyOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              <CalendarPlus2 className="h-4 w-4" />
              Apply Schedule
            </button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Calendar view</h2>
              <p className="text-sm text-slate-500">Kéo thẻ nhân viên từ pool hoặc giữa các ca để chỉnh lịch trực tiếp.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {dirty ? (
                <button onClick={resetDraft} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <RotateCcw className="h-4 w-4" />
                  Hoàn tác
                </button>
              ) : null}
              {suggested ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  AI đã tối ưu
                </span>
              ) : null}
              <StatusBadge status={dirty ? "Draft" : "Reviewed"} />
            </div>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Đã xếp</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{coverage.assigned}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Nhu cầu</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{coverage.required}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-bold uppercase tracking-normal text-amber-700">Còn thiếu</p>
              <p className="mt-1 text-xl font-bold text-amber-800">{coverage.shortage}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-bold uppercase tracking-normal text-blue-700">Trạng thái</p>
              <p className="mt-1 text-sm font-bold text-blue-800">{dirty ? "Bản nháp chưa lưu" : "Đã đồng bộ"}</p>
            </div>
          </div>

          {scheduleMessage ? <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{scheduleMessage}</div> : null}

          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-[1180px] grid-cols-7 gap-3">
              {scheduleWeek.map((day) => {
                const dayKey = getDayKey(day);
                return (
                  <div key={dayKey} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{day.day}</p>
                        <p className="text-xs font-semibold text-slate-500">{day.date}</p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">{day.shifts.length} ca</span>
                    </div>

                    <div className="space-y-3">
                      {day.shifts.map((slot) => {
                        const shift = shiftMap.get(slot.shiftId) || { id: slot.shiftId, name: slot.shiftId, time: "-", required: 0, color: "blue" };
                        const missing = Math.max(Number(shift.required || 0) - slot.employees.length, 0);
                        const filledRatio = shift.required ? Math.min(100, Math.round((slot.employees.length / shift.required) * 100)) : 100;
                        return (
                          <div
                            key={`${dayKey}-${slot.shiftId}`}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => dropOnSlot(event, dayKey, slot.shiftId)}
                            className={`rounded-xl border bg-white p-3 shadow-sm transition ${
                              dragItem ? "border-blue-300 ring-2 ring-blue-100" : missing ? "border-amber-200" : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className={`inline-flex max-w-full rounded-full border px-2 py-1 text-xs font-bold ${getShiftTone(shift.color)}`}>{shift.name}</p>
                                <p className="mt-2 truncate text-xs font-medium text-slate-500">{shift.time}</p>
                              </div>
                              <span className={`text-xs font-bold ${missing ? "text-amber-700" : "text-emerald-700"}`}>
                                {slot.employees.length}/{shift.required}
                              </span>
                            </div>

                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full ${missing ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${filledRatio}%` }} />
                            </div>

                            <div className="mt-3 space-y-2">
                              {slot.employees.length ? (
                                slot.employees.map((employeeId) => {
                                  const employee = employeeMap.get(employeeId);
                                  return (
                                    <div
                                      key={employeeId}
                                      draggable
                                      onDragStart={(event) => startDrag(event, { employeeId, fromDayKey: dayKey, fromShiftId: slot.shiftId })}
                                      onDragEnd={() => setDragItem(null)}
                                      className="group flex cursor-grab items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 active:cursor-grabbing"
                                    >
                                      <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
                                      <Avatar name={employee?.name || employeeId} size="sm" />
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-bold text-slate-900">{employee?.name || employeeId}</p>
                                        <p className="truncate text-[11px] text-slate-500">{employee?.department || "Nhân viên"}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeAssignment(dayKey, slot.shiftId, employeeId)}
                                        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                        aria-label="Gỡ khỏi ca"
                                      >
                                        <UserMinus className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs font-semibold text-slate-400">
                                  Thả nhân viên vào đây
                                </div>
                              )}
                            </div>

                            {missing ? (
                              <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Thiếu {missing} người
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Employee pool</h2>
            <p className="mt-1 text-sm text-slate-500">Kéo nhân viên vào một ca bất kỳ trên lịch.</p>
            <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {activeEmployees.map((employee) => (
                <div
                  key={employee.id}
                  draggable
                  onDragStart={(event) => startDrag(event, { employeeId: employee.id })}
                  onDragEnd={() => setDragItem(null)}
                  className="flex cursor-grab items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4 text-slate-300" />
                  <Avatar name={employee.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950">{employee.name}</p>
                    <p className="truncate text-xs text-slate-500">{employee.department}</p>
                  </div>
                  {leaveBlocks.some((leave) => leave.employeeId === employee.id) ? <StatusBadge status="Leave" /> : busyBlocks.some((busy) => busy.employeeId === employee.id && weekDateSet.has(busy.busyDate)) ? <StatusBadge status="Busy" /> : null}
                </div>
              ))}
            </div>
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={dropToRemove}
              className={`mt-4 rounded-lg border border-dashed px-4 py-4 text-center text-sm font-semibold ${
                dragItem?.fromDayKey ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-300 bg-slate-50 text-slate-400"
              }`}
            >
              Thả vào đây để gỡ khỏi ca
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Shift cards</h2>
            <div className="mt-4 space-y-3">
              {shifts.map((shift) => (
                <div key={shift.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className={`inline-flex min-w-0 rounded-full border px-2 py-1 text-xs font-bold ${getShiftTone(shift.color)}`}>{shift.name}</p>
                    <span className="shrink-0 text-sm font-semibold text-blue-700">{shift.required} người</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{shift.time}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Employee availability</h2>
            <div className="mt-4 space-y-3">
              {availabilityConflicts.length ? (
                availabilityConflicts.map((item) => {
                  const employee = employeeMap.get(item.employeeId);
                  const name = item.employeeName || employee?.name || item.employeeId;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{name}</p>
                          <p className="truncate text-xs text-slate-500">{item.label}</p>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <CalendarX2 className="h-4 w-4 text-slate-400" />
                    <span>Không có nghỉ phép hoặc lịch bận trong tuần này.</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <h2 className="font-semibold">Conflict warning</h2>
                <p className="mt-1 text-sm">
                  {coverage.shortage
                    ? `Lịch hiện còn thiếu ${coverage.shortage} vị trí so với nhu cầu ca.`
                    : "Các ca đang đủ người theo nhu cầu hiện tại."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Lý do AI sắp lịch</h2>
            <div className="mt-4 space-y-3">
              {(suggested ? aiScheduleReasons : aiScheduleReasons.slice(0, 2)).map((reason) => (
                <div key={reason} className="flex gap-2 text-sm text-slate-600">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <p>{reason}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <Modal
        open={applyOpen}
        title="Áp dụng lịch làm"
        onClose={() => setApplyOpen(false)}
        footer={
          <>
            <button onClick={() => setApplyOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Hủy
            </button>
            <button onClick={applySchedule} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">
              {saving ? "Đang lưu..." : "Áp dụng"}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex gap-3">
            <UsersRound className="h-5 w-5 shrink-0 text-blue-600" />
            <p>Lịch tuần 18/05 - 24/05 sẽ được lưu xuống hệ thống và dùng làm bản lịch hiện tại cho nhân viên.</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            Đã xếp {coverage.assigned}/{coverage.required} vị trí. {coverage.shortage ? `Còn thiếu ${coverage.shortage} vị trí.` : "Tất cả ca đã đủ người."}
          </div>
          {saveError ? <p className="rounded-lg bg-rose-50 px-3 py-2 font-semibold text-rose-700">{saveError}</p> : null}
        </div>
      </Modal>
    </div>
  );
}

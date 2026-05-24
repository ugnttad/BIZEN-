import { useEffect, useState } from "react";
import { AlertTriangle, CalendarPlus2, CheckCircle2, Loader2, Sparkles, UsersRound } from "lucide-react";
import Avatar from "../../components/Avatar";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";

const shiftTone = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700"
};

export default function ShiftScheduling() {
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [scheduleWeek, setScheduleWeek] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [aiScheduleReasons, setAiScheduleReasons] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    Promise.all([bizenApi.employees(), bizenApi.shifts(), bizenApi.scheduleWeek(), bizenApi.leaves()]).then(([employeeRows, shiftRows, scheduleRows, leaveRows]) => {
      setEmployees(employeeRows);
      setShifts(shiftRows);
      setScheduleWeek(scheduleRows);
      setLeaveRequests(leaveRows);
      setAiScheduleReasons(["Không xếp nhân viên đang nghỉ phép.", "Cân bằng workload theo từng bộ phận/nhóm."]);
    });
  }, []);

  function suggestSchedule() {
    setSuggesting(true);
    bizenApi.aiSuggestSchedule().then((payload) => {
      setSuggesting(false);
      setSuggested(true);
      setAiScheduleReasons(payload.reasons || []);
    });
  }

  const approvedLeaves = leaveRequests.filter((request) => request.status === "Approved");
  const leaveEmployees = approvedLeaves
    .map((request) => employees.find((employee) => employee.id === request.employeeId))
    .filter(Boolean);

  return (
    <div>
      <PageHeader
        eyebrow="AI-driven Scheduling"
        title="Xếp lịch tuần 18/05 - 24/05"
        description="Tạo lịch theo nhu cầu từng ca, ngày nghỉ, giới hạn giờ làm và cân bằng workload."
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

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Calendar view</h2>
              <p className="text-sm text-slate-500">Admin/HR/Manager có thể chỉnh thủ công từng ca.</p>
            </div>
            {suggested ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                AI đã tối ưu
              </span>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-7">
            {scheduleWeek.map((day) => (
              <div key={day.date} className="min-h-[520px] rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-950">{day.day}</p>
                  <p className="text-xs text-slate-500">{day.date}</p>
                </div>
                <div className="space-y-3">
                  {day.shifts.map((slot) => {
                    const shift = shifts.find((item) => item.id === slot.shiftId) || { name: slot.shiftId, time: "-", required: 0, color: "blue" };
                    const conflict = slot.employees.length < shift.required;
                    return (
                      <div key={`${day.date}-${slot.shiftId}`} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${shiftTone[shift.color]}`}>{shift.name}</p>
                            <p className="mt-2 text-xs text-slate-500">{shift.time}</p>
                          </div>
                          <span className={`text-xs font-semibold ${conflict ? "text-amber-600" : "text-emerald-600"}`}>
                            {slot.employees.length}/{shift.required}
                          </span>
                        </div>
                        <div className="mt-3 flex -space-x-2">
                          {slot.employees.slice(0, 5).map((employeeId) => {
                            const employee = employees.find((item) => item.id === employeeId);
                            return <Avatar key={employeeId} name={employee?.name || employeeId} size="sm" className="ring-2 ring-white" />;
                          })}
                        </div>
                        {slot.employees.length > 5 ? <p className="mt-2 text-xs font-medium text-slate-500">+{slot.employees.length - 5} nhân viên</p> : null}
                        {conflict ? (
                          <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Thiếu nhân sự
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Shift cards</h2>
            <div className="mt-4 space-y-3">
              {shifts.map((shift) => (
                <div key={shift.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-950">{shift.name}</p>
                    <span className="text-sm font-semibold text-blue-700">{shift.required} người</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{shift.time}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Employee availability</h2>
            <div className="mt-4 space-y-3">
              {leaveEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={employee.name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{employee.name}</p>
                      <p className="text-xs text-slate-500">{employee.department}</p>
                    </div>
                  </div>
                  <StatusBadge status="Leave" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <h2 className="font-semibold">Conflict warning</h2>
                <p className="mt-1 text-sm">Kho sớm ngày 21/05 chỉ đạt 2/4 người. AI đề xuất điều Mai Quang Tín hoặc giảm yêu cầu ca.</p>
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
            <button onClick={() => setApplyOpen(false)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Áp dụng
            </button>
          </>
        }
      >
        <div className="flex gap-3 text-sm text-slate-600">
          <UsersRound className="h-5 w-5 shrink-0 text-blue-600" />
          <p>Lịch tuần 18/05 - 24/05 sẽ được gửi thông báo đến nhân viên liên quan.</p>
        </div>
      </Modal>
    </div>
  );
}

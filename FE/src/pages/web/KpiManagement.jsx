import { useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, ClipboardCheck, Eye, Filter, Loader2, Plus, Trash2, XCircle } from "lucide-react";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";

const presets = [
  {
    title: "Setup bàn ghế đầu ca",
    description: "Sắp xếp bàn ghế, kiểm tra khăn giấy, menu và khu vực khách trước giờ mở bán.",
    dueTime: "07:20"
  },
  {
    title: "Quét dọn khu vực khách",
    description: "Quét sàn, lau bàn, kiểm tra thùng rác và chụp ảnh khu vực sau khi hoàn tất.",
    dueTime: "07:30"
  },
  {
    title: "Chuẩn bị nguyên liệu pha chế",
    description: "Refill topping, kiểm tra đá, sữa, trà nền và ghi chú nếu thiếu nguyên liệu.",
    dueTime: "09:00"
  },
  {
    title: "Nấu trà sữa nền khi vắng khách",
    description: "Chuẩn bị mẻ trà sữa nền theo công thức quán và chụp ảnh khu vực bếp/quầy sau khi hoàn tất.",
    dueTime: "14:30"
  },
  {
    title: "Checklist cuối ca",
    description: "Lau quầy, kiểm kho vật tư nhanh, tắt thiết bị không dùng và chụp ảnh bàn giao cuối ca.",
    dueTime: "22:00"
  }
];

const emptyForm = {
  employeeId: "",
  workDate: todayIso(),
  shiftId: "",
  title: presets[0].title,
  description: presets[0].description,
  dueTime: presets[0].dueTime,
  requiresPhoto: true,
  minPhotoCount: 1
};

const filterStatuses = ["All", "Pending", "InProgress", "Submitted", "Approved", "Rejected", "Late", "Missed"];

const statusLabels = {
  All: "Tất cả",
  Pending: "Chưa làm",
  InProgress: "Đang làm",
  Submitted: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Làm lại",
  Late: "Trễ",
  Missed: "Quá hạn"
};

const timelinessLabels = {
  Open: "Đang mở",
  OnTime: "Đúng hạn",
  Late: "Nộp trễ",
  Missed: "Quá hạn"
};

function todayIso() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function taskTone(task) {
  if (task.timeliness === "Late" || task.timeliness === "Missed") return "text-amber-700";
  if (task.status === "Approved") return "text-emerald-700";
  if (task.status === "Rejected") return "text-rose-700";
  return "text-slate-500";
}

export default function KpiManagement() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [filters, setFilters] = useState({ date: todayIso(), status: "All", employeeId: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [reviewTask, setReviewTask] = useState(null);
  const [reviewReason, setReviewReason] = useState("");
  const [photoTask, setPhotoTask] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([bizenApi.employees(), bizenApi.shifts()])
      .then(([employeeRows, shiftRows]) => {
        setEmployees(employeeRows);
        setShifts(shiftRows);
        setForm((current) => ({
          ...current,
          employeeId: current.employeeId || employeeRows[0]?.id || "",
          shiftId: current.shiftId || shiftRows[0]?.id || ""
        }));
      })
      .catch((requestError) => setError(requestError.message || "Không tải được nhân viên/ca làm."));
  }, []);

  useEffect(() => {
    let active = true;
    bizenApi
      .kpiTasks(filters)
      .then((rows) => {
        if (active) setTasks(rows);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Không tải được KPI ca làm.");
      });
    return () => {
      active = false;
    };
  }, [filters]);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const stats = useMemo(
    () => ({
      pending: tasks.filter((task) => ["Pending", "InProgress"].includes(task.status)).length,
      submitted: tasks.filter((task) => task.status === "Submitted").length,
      late: tasks.filter((task) => ["Late", "Missed"].includes(task.timeliness)).length,
      approved: tasks.filter((task) => task.status === "Approved").length
    }),
    [tasks]
  );

  function applyPreset(preset) {
    setForm((current) => ({
      ...current,
      title: preset.title,
      description: preset.description,
      dueTime: preset.dueTime
    }));
  }

  async function reloadTasks(nextFilters = filters) {
    const rows = await bizenApi.kpiTasks(nextFilters);
    setTasks(rows);
  }

  async function createTask(event) {
    event.preventDefault();
    if (!form.employeeId || !form.title.trim()) {
      setError("Chọn nhân viên và nhập tên KPI.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const rows = await bizenApi.createKpiTask({
        ...form,
        shiftId: form.shiftId || undefined,
        minPhotoCount: form.requiresPhoto ? Number(form.minPhotoCount || 1) : 0
      });
      setTasks(rows);
      setFilters((current) => ({ ...current, date: form.workDate }));
      setFormOpen(false);
    } catch (requestError) {
      setError(requestError.message || "Không tạo được KPI.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Xóa KPI "${task.title}"?`)) return;
    setError("");
    try {
      await bizenApi.deleteKpiTask(task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (requestError) {
      setError(requestError.message || "Không xóa được KPI.");
    }
  }

  async function approveTask(task) {
    setError("");
    try {
      const updated = await bizenApi.reviewKpiTask(task.id, { status: "Approved" });
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (requestError) {
      setError(requestError.message || "Không duyệt được KPI.");
    }
  }

  async function rejectTask() {
    if (!reviewTask) return;
    if (!reviewReason.trim()) {
      setError("Nhập lý do để nhân viên biết cần làm lại gì.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await bizenApi.reviewKpiTask(reviewTask.id, { status: "Rejected", rejectionReason: reviewReason.trim() });
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setReviewTask(null);
      setReviewReason("");
    } catch (requestError) {
      setError(requestError.message || "Không từ chối được KPI.");
    } finally {
      setSaving(false);
    }
  }

  async function openPhoto(task) {
    if (!task.firstPhotoId) return;
    setPhotoTask(task);
    setLoadingPhoto(true);
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
      setPhotoUrl("");
    }

    try {
      const blob = await bizenApi.kpiTaskPhoto(task.firstPhotoId);
      setPhotoUrl(URL.createObjectURL(blob));
    } catch (requestError) {
      setError(requestError.message || "Không tải được ảnh KPI.");
      setPhotoTask(null);
    } finally {
      setLoadingPhoto(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Shift KPI"
        title="KPI ca làm"
        description="Giao nhiệm vụ theo ca, nhận ảnh minh chứng từ nhân viên và kiểm tra đúng hạn/trễ hạn trước khi duyệt."
        actions={
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tạo KPI
          </button>
        }
      />

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Đang mở" value={stats.pending} helper="chưa nộp" tone="amber" />
        <StatCard title="Chờ duyệt" value={stats.submitted} helper="cần xem ảnh" tone="blue" />
        <StatCard title="Trễ/quá hạn" value={stats.late} helper="cần nhắc nhân viên" tone="rose" />
        <StatCard title="Đã duyệt" value={stats.approved} helper="hoàn tất" tone="emerald" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">Danh sách KPI</h2>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="bg-white text-sm outline-none">
                  {filterStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(event) => setFilters({ ...filters, date: event.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {tasks.length === 0 ? (
            <EmptyState title="Chưa có KPI" description="Tạo KPI đầu ca hoặc dùng mẫu gợi ý bên phải để giao việc cho nhân viên." />
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <article key={task.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={task.status === "Pending" ? "KpiPending" : task.status} />
                        <span className={`rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold ${taskTone(task)}`}>{timelinessLabels[task.timeliness] || task.timeliness}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{task.dueTime}</span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-slate-950">{task.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{task.description || "Không có mô tả."}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <Avatar name={task.employeeName} size="sm" />
                          <strong className="text-slate-800">{task.employeeName}</strong>
                        </span>
                        <span>{task.shiftName || "Ca chưa chọn"} · {task.shiftTime || task.workDate}</span>
                        <span>{task.photoCount} ảnh</span>
                      </div>
                      {task.employeeNote ? <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Ghi chú nhân viên: {task.employeeNote}</p> : null}
                      {task.rejectionReason ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">Lý do làm lại: {task.rejectionReason}</p> : null}
                      <p className="mt-3 text-xs text-slate-400">
                        Nộp: {formatDateTime(task.submittedAt)} · Duyệt: {formatDateTime(task.reviewedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {task.firstPhotoId ? (
                        <button onClick={() => openPhoto(task)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                          <Eye className="h-4 w-4" />
                          Xem ảnh
                        </button>
                      ) : null}
                      {task.status === "Submitted" ? (
                        <>
                          <button onClick={() => approveTask(task)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              setReviewTask(task);
                              setReviewReason("");
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Làm lại
                          </button>
                        </>
                      ) : null}
                      <button onClick={() => deleteTask(task)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        <Trash2 className="h-4 w-4" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              <h2 className="font-semibold">Mẫu KPI theo quán</h2>
            </div>
            <p className="mt-2 text-sm text-blue-800">Dùng nhanh các mẫu phổ biến cho cafe/trà sữa, sau đó chỉnh theo vận hành riêng của quán.</p>
            <div className="mt-4 space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.title}
                  onClick={() => {
                    applyPreset(preset);
                    setFormOpen(true);
                  }}
                  className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-left text-sm font-semibold text-blue-900 hover:bg-blue-100"
                >
                  {preset.title}
                  <span className="mt-1 block text-xs font-medium text-blue-600">Deadline gợi ý {preset.dueTime}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-950">Lọc theo nhân viên</h2>
            <select
              value={filters.employeeId}
              onChange={(event) => setFilters({ ...filters, employeeId: event.target.value })}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none"
            >
              <option value="">Tất cả nhân viên</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </section>
        </aside>
      </div>

      <Modal
        open={formOpen}
        title="Tạo KPI cho ca làm"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Hủy
            </button>
            <button onClick={createTask} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tạo KPI
            </button>
          </>
        }
      >
        <form onSubmit={createTask} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Mẫu nhanh
            <select
              onChange={(event) => {
                const preset = presets.find((item) => item.title === event.target.value);
                if (preset) applyPreset(preset);
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none"
              value={presets.find((item) => item.title === form.title)?.title || ""}
            >
              <option value="">Tự nhập</option>
              {presets.map((preset) => (
                <option key={preset.title} value={preset.title}>
                  {preset.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Nhân viên
            <select value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} · {employee.department}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Ngày làm
            <input type="date" value={form.workDate} onChange={(event) => setForm({ ...form, workDate: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Ca làm
            <select value={form.shiftId} onChange={(event) => setForm({ ...form, shiftId: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
              <option value="">Không gắn ca</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name} · {shift.time}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Deadline
            <input type="time" value={form.dueTime} onChange={(event) => setForm({ ...form, dueTime: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Số ảnh tối thiểu
            <input
              type="number"
              min="0"
              max="3"
              value={form.minPhotoCount}
              onChange={(event) => setForm({ ...form, minPhotoCount: event.target.value })}
              disabled={!form.requiresPhoto}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none disabled:bg-slate-50"
            />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Tên KPI
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none" />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Mô tả
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none" />
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.requiresPhoto}
              onChange={(event) => setForm({ ...form, requiresPhoto: event.target.checked, minPhotoCount: event.target.checked ? Math.max(1, Number(form.minPhotoCount || 1)) : 0 })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Bắt buộc ảnh minh chứng
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(reviewTask)}
        title="Yêu cầu nhân viên làm lại"
        onClose={() => setReviewTask(null)}
        footer={
          <>
            <button onClick={() => setReviewTask(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Hủy
            </button>
            <button onClick={rejectTask} disabled={saving} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
              Gửi lý do
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Nhân viên sẽ thấy lý do này và có thể nộp lại ảnh KPI.</p>
        <textarea
          value={reviewReason}
          onChange={(event) => setReviewReason(event.target.value)}
          rows={4}
          placeholder="VD: Ảnh chưa thấy rõ khu vực bàn ghế sau khi setup."
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </Modal>

      <Modal
        open={Boolean(photoTask)}
        title={photoTask?.title || "Ảnh KPI"}
        onClose={() => setPhotoTask(null)}
        footer={
          <button onClick={() => setPhotoTask(null)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Đóng
          </button>
        }
      >
        {loadingPhoto ? (
          <div className="grid min-h-72 place-items-center text-sm text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : photoUrl ? (
          <div>
            <img src={photoUrl} alt={photoTask?.title || "Ảnh KPI"} className="max-h-[70vh] w-full rounded-lg object-contain ring-1 ring-slate-200" />
            <p className="mt-3 text-sm text-slate-500">
              {photoTask?.employeeName} · Nộp {formatDateTime(photoTask?.submittedAt)} · {timelinessLabels[photoTask?.timeliness] || photoTask?.timeliness}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            <Camera className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2">Chưa có ảnh minh chứng.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

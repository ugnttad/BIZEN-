import { useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, Clock3, Loader2, Send, UploadCloud } from "lucide-react";
import Modal from "../../components/Modal";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";

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
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(value));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Không đọc được ảnh."));
    reader.readAsDataURL(file);
  });
}

function statusTone(task) {
  if (task.status === "Approved") return "border-emerald-200 bg-emerald-50";
  if (task.status === "Rejected") return "border-rose-200 bg-rose-50";
  if (task.timeliness === "Late" || task.timeliness === "Missed") return "border-amber-200 bg-amber-50";
  return "border-slate-200 bg-white";
}

export default function MyKpis() {
  const [tasks, setTasks] = useState([]);
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [note, setNote] = useState("");
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    bizenApi
      .kpiTasks({ date })
      .then((rows) => {
        if (active) setTasks(rows);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Không tải được checklist ca làm.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [date]);

  const summary = useMemo(
    () => ({
      open: tasks.filter((task) => ["Pending", "InProgress", "Rejected"].includes(task.status)).length,
      submitted: tasks.filter((task) => task.status === "Submitted").length,
      done: tasks.filter((task) => task.status === "Approved").length
    }),
    [tasks]
  );

  async function updateProgress(task, status) {
    setUpdatingId(task.id);
    setMessage("");
    setError("");
    try {
      const updated = await bizenApi.updateKpiProgress(task.id, status);
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(status === "InProgress" ? "Đã đánh dấu đang làm việc này." : "Đã đưa việc này về trạng thái chưa làm.");
    } catch (requestError) {
      setError(requestError.message || "Không cập nhật được tiến độ.");
    } finally {
      setUpdatingId("");
    }
  }

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []).slice(0, 3);
    if (!files.length) return;
    const invalid = files.find((file) => !file.type.startsWith("image/"));
    if (invalid) {
      setError("Chỉ chọn ảnh JPEG, PNG hoặc WebP.");
      return;
    }

    try {
      const payloads = await Promise.all(files.map(readFileAsDataUrl));
      setImages(payloads);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Không đọc được ảnh.");
    }
  }

  async function submitTask() {
    if (!selectedTask) return;
    if (selectedTask.requiresPhoto && images.length < selectedTask.minPhotoCount) {
      setError(`Việc này cần tối thiểu ${selectedTask.minPhotoCount} ảnh minh chứng.`);
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const updated = await bizenApi.submitKpiTask(selectedTask.id, { note, images });
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedTask(null);
      setNote("");
      setImages([]);
      setMessage(updated.timeliness === "Late" ? "Đã nộp việc này. Hệ thống ghi nhận là nộp trễ." : "Đã nộp checklist, chờ chủ quán duyệt.");
    } catch (requestError) {
      setError(requestError.message || "Không nộp được việc này.");
    } finally {
      setSubmitting(false);
    }
  }

  function openSubmit(task) {
    setSelectedTask(task);
    setNote(task.employeeNote || "");
    setImages([]);
    setError("");
    setMessage("");
  }

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-teal-300 to-amber-300" />
        <p className="text-sm text-blue-100">Checklist ca làm</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">Nhiệm vụ hôm nay</h2>
        <p className="mt-1 text-sm text-slate-300">Làm xong thì chụp ảnh nộp minh chứng để chủ quán duyệt.</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <p className="text-lg font-bold">{summary.open}</p>
            <p className="text-xs text-slate-300">Cần làm</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <p className="text-lg font-bold">{summary.submitted}</p>
            <p className="text-xs text-slate-300">Chờ duyệt</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <p className="text-lg font-bold">{summary.done}</p>
            <p className="text-xs text-slate-300">Đã duyệt</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-sm font-semibold text-slate-700">
          Ngày làm việc
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </section>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{message}</p> : null}

      {loading ? (
        <section className="grid min-h-40 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </section>
      ) : tasks.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center">
          <ClipboardIcon />
          <h3 className="mt-3 font-semibold text-slate-950">Chưa có việc cho ngày này</h3>
          <p className="mt-1 text-sm text-slate-500">Khi chủ quán giao nhiệm vụ theo ca, danh sách sẽ hiện ở đây.</p>
        </section>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <article key={task.id} className={`rounded-2xl border p-4 ${statusTone(task)}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={task.status === "Pending" ? "KpiPending" : task.status} />
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{timelinessLabels[task.timeliness] || task.timeliness}</span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-950">{task.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{task.description || "Không có mô tả."}</p>
                </div>
                <div className="shrink-0 rounded-xl bg-white/90 px-3 py-2 text-center ring-1 ring-slate-200">
                  <Clock3 className="mx-auto h-4 w-4 text-slate-400" />
                  <p className="mt-1 text-xs font-bold text-slate-700">{task.dueTime}</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
                <p>{task.shiftName || "Ca làm"} · {task.shiftTime || task.workDate}</p>
                <p className="mt-1">Ảnh yêu cầu: {task.requiresPhoto ? `${task.minPhotoCount} ảnh` : "Không bắt buộc"}</p>
                {task.submittedAt ? <p className="mt-1">Đã nộp: {formatDateTime(task.submittedAt)}</p> : null}
              </div>

              {task.rejectionReason ? <p className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700">Cần làm lại: {task.rejectionReason}</p> : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {task.status === "Pending" || task.status === "Rejected" ? (
                  <button
                    onClick={() => updateProgress(task, "InProgress")}
                    disabled={updatingId === task.id}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm active:scale-[0.98] disabled:opacity-60"
                  >
                    {updatingId === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Bắt đầu
                  </button>
                ) : null}
                {["Pending", "InProgress", "Rejected"].includes(task.status) ? (
                  <button
                    onClick={() => openSubmit(task)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                  >
                    <Camera className="h-4 w-4" />
                    Nộp ảnh
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selectedTask)}
        title={selectedTask?.title || "Nộp checklist"}
        onClose={() => setSelectedTask(null)}
        footer={
          <>
            <button onClick={() => setSelectedTask(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Hủy
            </button>
            <button onClick={submitTask} disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Nộp
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            Deadline {selectedTask?.dueTime}. Hệ thống sẽ tự ghi nhận thời gian nộp và đánh dấu đúng hạn/trễ hạn.
          </p>
          <label className="block rounded-xl border border-dashed border-blue-200 bg-blue-50 p-4 text-center text-sm font-semibold text-blue-800">
            <UploadCloud className="mx-auto h-7 w-7" />
            <span className="mt-2 block">Chụp ảnh hoặc chọn ảnh minh chứng</span>
            <input type="file" accept="image/*" capture="environment" multiple onChange={handleFiles} className="hidden" />
          </label>
          {images.length ? (
            <div className="grid grid-cols-3 gap-2">
              {images.map((image, index) => (
                <img key={`${selectedTask?.id || "kpi"}-${index}`} src={image} alt={`Ảnh minh chứng ${index + 1}`} className="aspect-square rounded-xl object-cover ring-1 ring-slate-200" />
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
              {selectedTask?.requiresPhoto ? `Việc này cần tối thiểu ${selectedTask?.minPhotoCount} ảnh.` : "Ảnh không bắt buộc nhưng nên có để chủ quán kiểm tra nhanh."}
            </p>
          )}
          <label className="block text-sm font-semibold text-slate-700">
            Ghi chú
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="VD: Đã setup xong, khu vực bàn 1-6 sạch."
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

function ClipboardIcon() {
  return (
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
      <CheckCircle2 className="h-6 w-6" />
    </span>
  );
}

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Search, ShieldCheck, UserRound, XCircle } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import RejectionReasonModal from "../../components/RejectionReasonModal";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";

const statusTabs = ["All", "Pending", "Approved", "Rejected", "Revoked"];
const defaultRejectionReason = "Ảnh chưa rõ khuôn mặt";

function FaceEnrollmentImage({ id }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    bizenApi
      .faceEnrollmentImage(id)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (active) setSrc("");
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  if (!src) {
    return <div className="grid h-full w-full place-items-center bg-slate-900 text-xs font-semibold text-slate-400">Đang tải ảnh</div>;
  }

  return <img src={src} alt="" className="h-full w-full object-cover" />;
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function FaceEnrollmentReview() {
  const [status, setStatus] = useState("Pending");
  const [query, setQuery] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState("");
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(defaultRejectionReason);

  function loadEnrollments(nextStatus = status) {
    setLoading(true);
    setError("");
    bizenApi
      .faceEnrollments(nextStatus)
      .then(setEnrollments)
      .catch((err) => setError(err.message || "Không tải được danh sách Face ID."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadEnrollments(status);
  }, [status]);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return enrollments;
    return enrollments.filter((item) => [item.employeeId, item.employeeName, item.department].join(" ").toLowerCase().includes(normalized));
  }, [enrollments, query]);

  async function reviewEnrollment(id, nextStatus, reason = "") {
    setReviewingId(id);
    setError("");
    try {
      await bizenApi.reviewFaceEnrollment(id, {
        status: nextStatus,
        reviewedBy: "Chủ sở hữu",
        rejectionReason: reason
      });
      loadEnrollments(status);
      return true;
    } catch (err) {
      setError(err.message || "Không cập nhật được trạng thái Face ID.");
      return false;
    } finally {
      setReviewingId("");
    }
  }

  function openRejectionModal(item) {
    setRejectionTarget(item);
    setRejectionReason(defaultRejectionReason);
  }

  function closeRejectionModal() {
    setRejectionTarget(null);
    setRejectionReason(defaultRejectionReason);
  }

  async function rejectEnrollment() {
    if (!rejectionTarget) return;
    const updated = await reviewEnrollment(rejectionTarget.id, "Rejected", rejectionReason.trim());
    if (updated) closeRejectionModal();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Security / Face ID"
        title="Duyệt đăng ký khuôn mặt"
        description="Chủ sở hữu kiểm tra ảnh đăng ký trước khi hệ thống index khuôn mặt vào AWS Rekognition."
        actions={
          <button onClick={() => loadEnrollments(status)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        }
      />

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm nhân viên hoặc bộ phận" className="w-full text-sm outline-none" />
          </label>
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((item) => (
              <button
                key={item}
                onClick={() => setStatus(item)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  status === item ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div> : null}

      <section className="mt-5">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Đang tải yêu cầu Face ID...</div>
        ) : rows.length === 0 ? (
          <EmptyState title="Không có yêu cầu Face ID" description="Chưa có nhân viên nào gửi ảnh đăng ký ở trạng thái này." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {rows.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="grid sm:grid-cols-[180px_1fr]">
                  <div className="aspect-[4/5] bg-slate-950 sm:aspect-auto">
                    <FaceEnrollmentImage id={item.id} />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-slate-950">{item.employeeName}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.employeeId} · {item.department || "Chưa có bộ phận"}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    <div className="mt-4 grid gap-2 text-sm">
                      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Gửi lúc</span>
                        <span className="font-semibold text-slate-900">{formatDateTime(item.requestedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Confidence</span>
                        <span className="font-semibold text-slate-900">{item.faceConfidence ? `${Math.round(item.faceConfidence)}%` : "-"}</span>
                      </div>
                      {item.reviewedAt ? (
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                          <span className="text-slate-500">Duyệt lúc</span>
                          <span className="font-semibold text-slate-900">{formatDateTime(item.reviewedAt)}</span>
                        </div>
                      ) : null}
                    </div>

                    {item.rejectionReason ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{item.rejectionReason}</p> : null}

                    {item.status === "Pending" ? (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => reviewEnrollment(item.id, "Approved")}
                          disabled={reviewingId === item.id}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectionModal(item)}
                          disabled={reviewingId === item.id}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {item.status === "Approved" ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <UserRound className="h-4 w-4 text-slate-500" />}
                        {item.status === "Approved" ? `AWS FaceId: ${item.rekognitionFaceId || "-"}` : `Reviewed by ${item.reviewedBy || "Chủ sở hữu"}`}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          )}
        </section>
      <RejectionReasonModal
        open={Boolean(rejectionTarget)}
        value={rejectionReason}
        onChange={setRejectionReason}
        onClose={closeRejectionModal}
        onSubmit={rejectEnrollment}
        submitting={reviewingId === rejectionTarget?.id}
        description={rejectionTarget ? `Từ chối đăng ký Face ID của ${rejectionTarget.employeeName}.` : ""}
        submitLabel="Từ chối"
      />
    </div>
  );
}

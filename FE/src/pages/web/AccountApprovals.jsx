import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Search, ShieldOff, UserCheck, XCircle } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";

const statusTabs = ["Pending", "All", "Approved", "Rejected", "Suspended"];

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

export default function AccountApprovals() {
  const [status, setStatus] = useState("Pending");
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState("");
  const [error, setError] = useState("");

  function loadRequests(nextStatus = status) {
    setLoading(true);
    setError("");
    bizenApi
      .accountRequests(nextStatus)
      .then(setRequests)
      .catch((err) => setError(err.message || "Khong tai duoc yeu cau tai khoan."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRequests(status);
  }, [status]);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return requests;
    return requests.filter((item) => [item.name, item.email, item.employeeId, item.department, item.role].join(" ").toLowerCase().includes(normalized));
  }, [requests, query]);

  async function review(id, nextStatus) {
    setReviewingId(id);
    setError("");
    try {
      await bizenApi.reviewAccountRequest(id, { status: nextStatus });
      loadRequests(status);
    } catch (err) {
      setError(err.message || "Khong cap nhat duoc tai khoan.");
    } finally {
      setReviewingId("");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Access control"
        title="Tài khoản đăng nhập"
        description="Khi Admin/HR tạo nhân viên kèm mật khẩu, tài khoản được cấp ngay. Màn này dùng để xem, duyệt yêu cầu tự đăng ký và khóa tài khoản khi cần."
        actions={
          <button onClick={() => loadRequests(status)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        }
      />

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm nhân viên, email, bộ phận" className="w-full text-sm outline-none" />
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
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Đang tải tài khoản...</div>
        ) : rows.length === 0 ? (
          <EmptyState title="Không có tài khoản" description="Không có tài khoản nào ở trạng thái này." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_0.7fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-normal text-slate-500 lg:grid">
              <span>Nhan vien</span>
              <span>Bộ phận</span>
              <span>Role</span>
              <span>Tạo lúc</span>
              <span className="text-right">Xử lý</span>
            </div>
            <div className="divide-y divide-slate-100">
              {rows.map((item) => (
                <article key={item.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_0.7fr] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      <p className="truncate text-sm font-semibold text-slate-950">{item.name}</p>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {item.employeeId || "Company account"} - {item.email}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">{item.department || item.position || "-"}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.role} />
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-sm text-slate-600">{formatDateTime(item.createdAt)}</p>
                  <div className="flex justify-start gap-2 lg:justify-end">
                    {item.status === "Pending" || item.status === "Rejected" ? (
                      <button
                        onClick={() => review(item.id, "Approved")}
                        disabled={reviewingId === item.id}
                        className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300"
                        aria-label="Approve account"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    ) : null}
                    {item.status === "Pending" ? (
                      <button
                        onClick={() => review(item.id, "Rejected")}
                        disabled={reviewingId === item.id}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:text-slate-300"
                        aria-label="Reject account"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    ) : null}
                    {item.status === "Approved" ? (
                      <button
                        onClick={() => review(item.id, "Suspended")}
                        disabled={reviewingId === item.id}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:text-slate-300"
                        aria-label="Suspend account"
                      >
                        <ShieldOff className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

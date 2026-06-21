import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, LogOut, RefreshCw, Search, XCircle } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import BrandLogo from "../../components/BrandLogo";
import RejectionReasonModal from "../../components/RejectionReasonModal";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";
import { clearAuthSession, getAuthUser } from "../../modules/auth/authStore";

const statusTabs = ["Pending", "All", "Approved", "Rejected"];
const defaultRejectionReason = "Chưa đủ thông tin doanh nghiệp";

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

export default function PlatformCompanyRequests() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const [status, setStatus] = useState("Pending");
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState("");
  const [error, setError] = useState("");
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(defaultRejectionReason);

  function loadRequests(nextStatus = status) {
    setLoading(true);
    setError("");
    bizenApi
      .companyRequests(nextStatus)
      .then(setRequests)
      .catch((err) => setError(err.message || "Không tải được yêu cầu doanh nghiệp."))
      .finally(() => setLoading(false));
  }

  function loadCompanies() {
    setCompaniesLoading(true);
    setError("");
    bizenApi
      .platformCompanies()
      .then(setCompanies)
      .catch((err) => setError(err.message || "Không tải được danh sách doanh nghiệp."))
      .finally(() => setCompaniesLoading(false));
  }

  useEffect(() => {
    loadRequests(status);
  }, [status]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return requests;
    return requests.filter((item) =>
      [item.companyName, item.contactName, item.contactEmail, item.city, item.taxCode, item.businessAddress, item.website].join(" ").toLowerCase().includes(normalized)
    );
  }, [requests, query]);

  const companyRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return companies;
    return companies.filter((item) =>
      [item.name, item.ownerName, item.ownerEmail, item.contactEmail, item.city, item.taxCode, item.businessAddress, item.website].join(" ").toLowerCase().includes(normalized)
    );
  }, [companies, query]);

  const totalActiveEmployees = useMemo(
    () => companies.reduce((sum, item) => sum + Number(item.activeEmployeeCount || item.employeeCount || 0), 0),
    [companies]
  );

  async function review(id, nextStatus, reason = "") {
    setReviewingId(id);
    setError("");
    try {
      await bizenApi.reviewCompanyRequest(id, { status: nextStatus, rejectionReason: reason });
      loadRequests(status);
      loadCompanies();
      return true;
    } catch (err) {
      setError(err.message || "Không cập nhật được yêu cầu doanh nghiệp.");
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

  async function rejectRequest() {
    if (!rejectionTarget) return;
    const updated = await review(rejectionTarget.id, "Rejected", rejectionReason.trim());
    if (updated) closeRejectionModal();
  }

  function logout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link to="/platform/companies" className="flex items-center gap-3">
            <BrandLogo compact />
            <div>
              <p className="text-lg font-semibold text-slate-950">BIZEN Platform</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </Link>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-blue-600">Chủ nền tảng BIZEN</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">Duyệt doanh nghiệp đăng ký SaaS</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Bạn là người bán sản phẩm — duyệt tenant trước khi khách vào hệ thống. Approve sẽ tạo company và tài khoản chủ sở hữu đầu tiên.
            </p>
          </div>
          <button
            onClick={() => {
              loadRequests(status);
              loadCompanies();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm công ty, người liên hệ, email" className="w-full text-sm outline-none" />
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

        <section className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Doanh nghiệp đang quản lý</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{companies.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Nhân sự active trên hệ thống</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{totalActiveEmployees}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Request đang xem</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{rows.length}</p>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Doanh nghiệp đã duyệt</h2>
              <p className="text-sm text-slate-500">Danh sách tenant thật đang tồn tại trong BIZEN.</p>
            </div>
            <p className="text-sm font-semibold text-slate-600">{companyRows.length} doanh nghiệp</p>
          </div>

          {companiesLoading ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Đang tải danh sách doanh nghiệp...</div>
          ) : companyRows.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Chưa có doanh nghiệp nào khớp bộ lọc.</div>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {companyRows.map((company) => (
                <article key={company.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-950">{company.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{company.businessType || "Chưa có loại hình"} · {company.city}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Đã duyệt</span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Owner/Admin</p>
                      <p className="mt-1 truncate font-semibold text-slate-900">{company.ownerEmail || company.contactEmail || "-"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Mã số thuế</p>
                      <p className="mt-1 font-semibold text-slate-900">{company.taxCode || "-"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Nhân sự active</p>
                      <p className="mt-1 font-semibold text-slate-900">{company.activeEmployeeCount ?? company.employeeCount ?? 0}/{company.requestedEmployeeCount || 20}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Duyệt lúc</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatDateTime(company.approvedAt || company.createdAt)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 md:col-span-2">
                      <p className="text-slate-500">Địa chỉ</p>
                      <p className="mt-1 font-semibold text-slate-900">{company.businessAddress || "-"}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-950">Yêu cầu đăng ký doanh nghiệp</h2>
          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Đang tải yêu cầu…</div>
          ) : rows.length === 0 ? (
            <EmptyState title="Không có yêu cầu doanh nghiệp" description="Không có request nào ở trạng thái này." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {rows.map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <h2 className="truncate text-base font-semibold text-slate-950">{item.companyName}</h2>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{item.city}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Người đại diện</p>
                      <p className="mt-1 font-semibold text-slate-900">{item.contactName}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Email admin</p>
                      <p className="mt-1 truncate font-semibold text-slate-900">{item.contactEmail}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Điện thoại</p>
                      <p className="mt-1 font-semibold text-slate-900">{item.phone || "-"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Quy mô AI</p>
                      <p className="mt-1 font-semibold text-slate-900">{item.employeeCount || 20} nhân sự</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Mã số thuế</p>
                      <p className="mt-1 font-semibold text-slate-900">{item.taxCode || "-"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Loại hình</p>
                      <p className="mt-1 font-semibold text-slate-900">{item.businessType || "-"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 md:col-span-2">
                      <p className="text-slate-500">Địa chỉ kinh doanh</p>
                      <p className="mt-1 font-semibold text-slate-900">{item.businessAddress || "-"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 md:col-span-2">
                      <p className="text-slate-500">Link/Ghi chú xác minh</p>
                      <p className="mt-1 break-words font-semibold text-slate-900">{[item.website, item.verificationNote].filter(Boolean).join(" - ") || "-"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Gửi lúc</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatDateTime(item.requestedAt)}</p>
                    </div>
                  </div>

                  {item.rejectionReason ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{item.rejectionReason}</p> : null}

                  {item.status === "Pending" ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => review(item.id, "Approved")}
                        disabled={reviewingId === item.id}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Duyệt
                      </button>
                      <button
                        onClick={() => openRejectionModal(item)}
                        disabled={reviewingId === item.id}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
                      >
                        <XCircle className="h-4 w-4" />
                        Từ chối
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <RejectionReasonModal
        open={Boolean(rejectionTarget)}
        value={rejectionReason}
        onChange={setRejectionReason}
        onClose={closeRejectionModal}
        onSubmit={rejectRequest}
        submitting={reviewingId === rejectionTarget?.id}
        description={rejectionTarget ? `Từ chối yêu cầu của ${rejectionTarget.companyName}.` : ""}
        submitLabel="Từ chối"
      />
    </main>
  );
}

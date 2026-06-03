import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit3, Filter, Plus, Search, ShieldCheck, Trash2, UserRoundPlus } from "lucide-react";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { cafeShopConstraints, contractTypes, employeeRoles, hospitalityPositions } from "../../constants/hospitality";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";
import { getAuthUser } from "../../modules/auth/authStore";

const emptyForm = {
  name: "",
  department: "",
  position: "",
  role: "Employee",
  contractType: "Toàn thời gian",
  baseSalary: "",
  status: "Active",
  email: "",
  phone: "",
  accountPassword: ""
};

const legacyDepartmentLabels = {
  HR: "Thu ngân",
  Admin: "Quản lý cửa hàng",
  Sales: "Phục vụ / Order",
  Warehouse: "Kho / Tạp vụ",
  "Customer Support": "Phục vụ / Order"
};

const departmentPositionOptions = {
  "Quan ly cua hang": ["Chủ sở hữu", "Quản lý cửa hàng", "Quản lý ca", "Trưởng ca"],
  "Pha che": ["Pha chế", "Barista", "Pha chế trà sữa", "Trưởng ca pha chế"],
  "Pha che / Bar": ["Pha chế", "Barista", "Pha chế trà sữa", "Trưởng ca pha chế"],
  "Thu ngan": ["Thu ngân", "Thu ngân trưởng", "Kế toán cửa hàng"],
  "Phuc vu": ["Phục vụ", "Order", "Runner", "Trưởng ca phục vụ"],
  "Phuc vu / Order": ["Phục vụ", "Order", "Runner", "Nhân viên bán hàng", "Trưởng ca phục vụ"],
  "Phuc vu / ban hang": ["Phục vụ", "Order", "Runner", "Nhân viên bán hàng", "Trưởng ca phục vụ"],
  "Topping / Bep nhe": ["Nhân viên topping", "Chuẩn bị nguyên liệu", "Bếp nhẹ"],
  Bep: ["Nhân viên topping", "Chuẩn bị nguyên liệu", "Bếp nhẹ"],
  "Bep / kho": ["Nhân viên topping", "Chuẩn bị nguyên liệu", "Thủ kho"],
  "Kho / Tap vu": ["Thủ kho", "Tạp vụ", "Giao hàng", "Bảo vệ"],
  "Van phong / nhan su": ["Kế toán cửa hàng", "Quản lý cửa hàng"]
};

function stripVietnamese(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function getDepartmentLabel(name) {
  return legacyDepartmentLabels[name] || name || "Chưa có bộ phận";
}

function getDepartmentKey(name) {
  return stripVietnamese(getDepartmentLabel(name));
}

function getPositionOptions(departmentName, role) {
  if (role === "Admin") return ["Chủ sở hữu", "Quản lý cửa hàng"];
  const base = departmentPositionOptions[getDepartmentKey(departmentName)] || hospitalityPositions;
  return base;
}

function normalizePosition(departmentName, role, currentPosition) {
  const options = getPositionOptions(departmentName, role);
  return options.includes(currentPosition) ? currentPosition : options[0];
}

function normalizePhone(value = "") {
  return value.replace(/\D/g, "");
}

function isOperational(employee) {
  return employee.status !== "Inactive";
}

export default function EmployeeManagement() {
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const authUser = getAuthUser();
  const canMutateEmployees = authUser?.role === "Admin";
  const roleOptions = employeeRoles;
  const canEditEmployee = () => canMutateEmployees;
  const positionOptions = useMemo(() => getPositionOptions(form.department, form.role), [form.department, form.role]);
  const operationalCount = useMemo(() => rows.filter(isOperational).length, [rows]);
  const ownerCount = useMemo(() => rows.filter((employee) => employee.role === "Admin" && isOperational(employee)).length, [rows]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([bizenApi.employees(), bizenApi.departments()])
      .then(([employees, departmentRows]) => {
        if (active) {
          setRows(employees);
          setDepartments(departmentRows);
          setForm((current) => ({
            ...current,
            department: current.department || departmentRows[0]?.name || "Phục vụ"
          }));
        }
      })
      .catch(() => {
        if (active) setRows([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((employee) => {
      const matchesQuery = [employee.name, employee.id, employee.position, employee.email].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesDepartment = department === "All" || employee.department === department;
      return matchesQuery && matchesDepartment;
    });
  }, [rows, query, department]);

  function openCreate() {
    setModalMode("create");
    setEditingId(null);
    setForm({
      ...emptyForm,
      department: departments[0]?.name || "Phục vụ",
      position: normalizePosition(departments[0]?.name || "Phục vụ", "Employee", "")
    });
    setFormError("");
  }

  function openEdit(employee) {
    setModalMode("edit");
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      department: employee.department,
      role: employee.role,
      position: normalizePosition(employee.department, employee.role, employee.position),
      contractType: employee.contractType,
      baseSalary: employee.baseSalary,
      status: employee.status,
      email: employee.email,
      phone: employee.phone,
      accountPassword: ""
    });
    setFormError("");
  }

  function updateDepartment(nextDepartment) {
    setForm((current) => ({
      ...current,
      department: nextDepartment,
      position: normalizePosition(nextDepartment, current.role, current.position)
    }));
  }

  function updateRole(nextRole) {
    setForm((current) => ({
      ...current,
      department:
        nextRole === "Admin"
          ? departments.find((item) => getDepartmentKey(item.name) === "Quan ly cua hang")?.name || current.department
          : current.department,
      role: nextRole,
      position: normalizePosition(
        nextRole === "Admin"
          ? departments.find((item) => getDepartmentKey(item.name) === "Quan ly cua hang")?.name || current.department
          : current.department,
        nextRole,
        current.position
      )
    }));
  }

  async function saveEmployee(event) {
    event.preventDefault();
    if (!canMutateEmployees) {
      setFormError("Bạn chỉ có quyền xem hồ sơ nhân viên.");
      return;
    }

    const trimmedName = form.name.trim();
    const normalizedEmail = form.email.trim().toLowerCase();
    const salary = Number(form.baseSalary);
    const phoneDigits = normalizePhone(form.phone);
    const editingEmployee = rows.find((employee) => employee.id === editingId);
    const nextOperationalCount = modalMode === "create" ? operationalCount + 1 : operationalCount;
    const nextOwnerCount =
      form.role === "Admin"
        ? ownerCount + (editingEmployee?.role === "Admin" ? 0 : 1)
        : ownerCount - (editingEmployee?.role === "Admin" ? 1 : 0);

    if (nextOperationalCount > cafeShopConstraints.maxActiveEmployees) {
      setFormError(`BIZEN đang ràng buộc tối đa ${cafeShopConstraints.maxActiveEmployees} nhân sự đang làm cho một quán cafe/trà sữa trong giai đoạn triển khai hiện tại.`);
      return;
    }

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 80) {
      setFormError("Họ tên cần từ 2 đến 80 ký tự.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFormError("Email đăng nhập chưa hợp lệ.");
      return;
    }

    if (rows.some((employee) => employee.id !== editingId && employee.email?.toLowerCase() === normalizedEmail)) {
      setFormError("Email này đã được dùng cho nhân viên khác trong danh sách.");
      return;
    }

    if (phoneDigits && !cafeShopConstraints.phonePattern.test(phoneDigits)) {
      setFormError("Số điện thoại cần 9-11 chữ số, phù hợp số điện thoại Việt Nam.");
      return;
    }

    if (salary < cafeShopConstraints.minBaseSalary || salary > cafeShopConstraints.maxBaseSalary) {
      setFormError(`Lương cơ bản cần nằm trong khoảng ${formatCurrency(cafeShopConstraints.minBaseSalary)} - ${formatCurrency(cafeShopConstraints.maxBaseSalary)}.`);
      return;
    }

    if (nextOwnerCount > cafeShopConstraints.maxOwners) {
      setFormError("Mỗi quán chỉ nên có tối đa 1 hồ sơ chủ sở hữu để giữ mô hình vận hành gọn.");
      return;
    }

    if (form.role === "Admin" && getDepartmentKey(form.department) !== "Quan ly cua hang") {
      setFormError("Chủ sở hữu phải thuộc bộ phận Quản lý cửa hàng.");
      return;
    }

    if (form.role === "Employee" && ["Chủ sở hữu", "Chủ doanh nghiệp"].includes(form.position)) {
      setFormError("Nhân viên không được chọn chức vụ chủ sở hữu.");
      return;
    }

    if (!positionOptions.includes(form.position)) {
      setFormError("Chức vụ phải khớp với bộ phận làm việc đã chọn.");
      return;
    }

    if ((modalMode === "create" || form.accountPassword) && !cafeShopConstraints.passwordPattern.test(form.accountPassword)) {
      setFormError("Mật khẩu cần ít nhất 8 ký tự, có chữ và số để nhân viên dùng app ngay.");
      return;
    }

    const departmentId = departments.find((item) => item.name === form.department)?.id;
    if (!departmentId) {
      setFormError("Chọn bộ phận/nhóm hợp lệ.");
      return;
    }

    const payload = {
      ...form,
      name: trimmedName,
      email: normalizedEmail,
      phone: phoneDigits,
      departmentId,
      baseSalary: salary,
      accountPassword: form.accountPassword || undefined
    };

    try {
      if (modalMode === "edit") {
        const updated = await bizenApi.updateEmployee(editingId, payload);
        setRows((current) => current.map((employee) => (employee.id === editingId ? updated : employee)));
      } else {
        const created = await bizenApi.createEmployee(payload);
        setRows((current) => [created, ...current]);
      }
      setModalMode(null);
    } catch (error) {
      setFormError(error.message || "Không thể lưu nhân viên.");
    }
  }

  async function deleteEmployee() {
    try {
      await bizenApi.deleteEmployee(deleteTarget.id);
      setRows((current) => current.filter((employee) => employee.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      setFormError(error.message || "Không thể xóa nhân viên.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Quản lý nhân sự"
        title="Hồ sơ nhân viên"
        description="Mô hình gọn cho cửa hàng nhỏ: chủ sở hữu có toàn quyền, nhân viên dùng web/mobile để chấm công, xem lịch, lương và nghỉ phép."
        actions={
          canMutateEmployees ? (
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Thêm nhân viên
            </button>
          ) : null
        }
      />

      <section className="mb-4 grid gap-3 md:grid-cols-4">
        {[
          { label: "Quy mô", value: `${cafeShopConstraints.minRecommendedEmployees}-${cafeShopConstraints.maxActiveEmployees}`, helper: `${operationalCount} nhân sự đang làm` },
          { label: "Hồ sơ chủ", value: `${ownerCount}/${cafeShopConstraints.maxOwners}`, helper: "nếu chủ cũng chấm công" },
          { label: "Mức lương", value: "1-30 triệu", helper: "ràng buộc theo tháng" },
          { label: "Chức vụ", value: "Theo bộ phận", helper: "cafe/trà sữa nhỏ" }
        ].map((rule) => (
          <div key={rule.label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              {rule.label}
            </div>
            <p className="mt-2 text-lg font-bold text-slate-950">{rule.value}</p>
            <p className="mt-1 text-xs text-slate-500">{rule.helper}</p>
          </div>
        ))}
      </section>

      <section className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_220px]">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, mã, chức vụ" className="w-full text-sm outline-none" />
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select value={department} onChange={(event) => setDepartment(event.target.value)} className="w-full bg-white text-sm outline-none">
            <option value="All">Tất cả bộ phận</option>
            {departments.map((item) => (
              <option key={item.id} value={item.name}>
                {getDepartmentLabel(item.name)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loading ? (
        <LoadingState rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="Không tìm thấy nhân viên" description="Bộ lọc hiện tại không có nhân viên phù hợp." />
      ) : (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Bộ phận/nhóm</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Hợp đồng</th>
                  <th className="px-4 py-3">Lương cơ bản</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/web/employees/${employee.id}`} className="flex items-center gap-3">
                        <Avatar name={employee.name} src={employee.avatarUrl} />
                        <span>
                          <span className="block font-semibold text-slate-950">{employee.name}</span>
                          <span className="block text-xs text-slate-500">
                            {employee.id} · {employee.position}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{getDepartmentLabel(employee.department)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={employee.role} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{employee.contractType}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(employee.baseSalary)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={employee.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {canEditEmployee(employee) ? (
                          <>
                            <button onClick={() => openEdit(employee)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100" aria-label="Sửa">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(employee)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50" aria-label="Xóa">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Chỉ xem</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal
        open={Boolean(modalMode)}
        title={modalMode === "edit" ? "Sửa nhân viên" : "Thêm nhân viên"}
        onClose={() => setModalMode(null)}
        footer={
          <>
            <button onClick={() => setModalMode(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Hủy
            </button>
            <button onClick={saveEmployee} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Lưu
            </button>
          </>
        }
      >
        <form onSubmit={saveEmployee} className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-medium text-slate-700">
            Họ tên
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Bộ phận làm việc
            <select value={form.department} onChange={(event) => updateDepartment(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
              {departments.map((item) => (
                <option key={item.id} value={item.name}>
                  {getDepartmentLabel(item.name)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Dùng cho lịch ca, chấm công, lương và báo cáo; không phải quyền truy cập.</p>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Quyền truy cập
            <select value={form.role} onChange={(event) => updateRole(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
              {roleOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Chủ sở hữu có toàn quyền. Nhân viên chỉ vào cổng tự phục vụ; quản lý ca là chức vụ công việc, không phải quyền riêng.</p>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Chức vụ công việc
            <select
              value={form.position}
              onChange={(event) => setForm({ ...form, position: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {positionOptions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Tên công việc thực tế, tự đổi theo bộ phận và quyền truy cập để tránh lệch như làm bếp nhưng chức vụ phục vụ.</p>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Loại hợp đồng
            <select value={form.contractType} onChange={(event) => setForm({ ...form, contractType: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
              {contractTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Lương cơ bản (VNĐ/tháng)
            <input type="number" value={form.baseSalary} onChange={(event) => setForm({ ...form, baseSalary: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Email
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Điện thoại
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-slate-700">
            Mật khẩu đăng nhập {modalMode === "edit" ? "(để trống nếu không đổi)" : ""}
            <input
              type="password"
              value={form.accountPassword}
              onChange={(event) => setForm({ ...form, accountPassword: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder={modalMode === "edit" ? "Nhập mật khẩu mới nếu cần reset" : "Tối thiểu 8 ký tự"}
            />
            <p className="mt-1 text-xs text-slate-500">Email + mật khẩu này dùng để đăng nhập web/mobile theo vai trò hệ thống ở trên.</p>
          </label>
          {formError ? <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{formError}</p> : null}
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Hủy
            </button>
            <button onClick={deleteEmployee} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
              Xóa
            </button>
          </>
        }
      >
        <div className="flex gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-rose-50 text-rose-600">
            <UserRoundPlus className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-600">
            Xóa hồ sơ <span className="font-semibold text-slate-950">{deleteTarget?.name}</span> khỏi danh sách nhân viên.
          </p>
        </div>
      </Modal>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit3, Filter, Plus, Search, Trash2, UserRoundPlus } from "lucide-react";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";

const emptyForm = {
  name: "",
  department: "Sales",
  position: "",
  role: "Employee",
  contractType: "Full-time",
  baseSalary: "",
  status: "Active",
  email: "",
  phone: ""
};

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

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([bizenApi.employees(), bizenApi.departments()])
      .then(([employees, departmentRows]) => {
        if (active) setRows(employees);
        if (active) setDepartments(departmentRows);
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
    setForm(emptyForm);
    setFormError("");
  }

  function openEdit(employee) {
    setModalMode("edit");
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      department: employee.department,
      position: employee.position,
      role: employee.role,
      contractType: employee.contractType,
      baseSalary: employee.baseSalary,
      status: employee.status,
      email: employee.email,
      phone: employee.phone
    });
    setFormError("");
  }

  async function saveEmployee(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.position.trim() || Number(form.baseSalary) <= 0 || !form.email.includes("@")) {
      setFormError("Vui lòng nhập tên, chức vụ, email và lương hợp lệ.");
      return;
    }

    const departmentId = departments.find((item) => item.name === form.department)?.id || "sales";
    const payload = {
      ...form,
      departmentId,
      baseSalary: Number(form.baseSalary)
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
      setFormError(error.message || "Không thể lưu nhân viên vào Neon.");
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
        eyebrow="Employee Management"
        title="Hồ sơ nhân viên"
        description="Quản lý thông tin cá nhân, phòng ban, hợp đồng, lương cơ bản và trạng thái làm việc."
        actions={
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Thêm nhân viên
          </button>
        }
      />

      <section className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_220px]">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, mã, chức vụ" className="w-full text-sm outline-none" />
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select value={department} onChange={(event) => setDepartment(event.target.value)} className="w-full bg-white text-sm outline-none">
            <option value="All">Tất cả phòng ban</option>
            {departments.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
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
                  <th className="px-4 py-3">Phòng ban</th>
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
                        <Avatar name={employee.name} />
                        <span>
                          <span className="block font-semibold text-slate-950">{employee.name}</span>
                          <span className="block text-xs text-slate-500">
                            {employee.id} · {employee.position}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{employee.department}</td>
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
                        <button onClick={() => openEdit(employee)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100" aria-label="Sửa">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(employee)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50" aria-label="Xóa">
                          <Trash2 className="h-4 w-4" />
                        </button>
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
            Phòng ban
            <select value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
              {departments.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Vai trò
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none">
              <option>Employee</option>
              <option>Manager</option>
              <option>HR</option>
              <option>Admin</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Chức vụ
            <input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Lương cơ bản
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
            Xóa hồ sơ <span className="font-semibold text-slate-950">{deleteTarget?.name}</span> khỏi danh sách demo.
          </p>
        </div>
      </Modal>
    </div>
  );
}

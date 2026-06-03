import { useEffect, useState } from "react";
import { Camera, CheckCircle2, Loader2, Mail, MapPin, Phone, Save, UserRound } from "lucide-react";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import { readImageFileAsDataUrl } from "../lib/imageFiles";
import { bizenApi } from "../modules/api/bizenApi";
import { updateAuthUser } from "../modules/auth/authStore";
import { saveMobileEmployee } from "../modules/auth/mobileSession";

export default function ProfileEditorPage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", avatarUrl: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    bizenApi
      .profile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        const employee = data.employee;
        setForm({
          name: employee?.name || data.user?.name || "",
          phone: employee?.phone || "",
          address: employee?.address || "",
          avatarUrl: employee?.avatarUrl || data.user?.pictureUrl || ""
        });
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Không tải được hồ sơ.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setForm((current) => ({ ...current, avatarUrl: dataUrl }));
      setError("");
    } catch (avatarError) {
      setError(avatarError.message || "Không đọc được ảnh đại diện.");
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await bizenApi.updateProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
        avatarUrl: form.avatarUrl
      });
      setProfile(result);
      updateAuthUser({
        name: result.user?.name,
        pictureUrl: result.user?.pictureUrl
      });
      if (result.employee) saveMobileEmployee(result.employee);
      setMessage("Đã lưu hồ sơ.");
    } catch (requestError) {
      setError(requestError.message || "Không lưu được hồ sơ.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </section>
    );
  }

  const employee = profile?.employee;
  const role = employee?.role || profile?.user?.role;
  const department = employee?.department || "Workspace";

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
        <div className="relative mx-auto w-fit">
          <Avatar name={form.name} src={form.avatarUrl} size="xl" className="mx-auto ring-4 ring-white" />
          <label className="absolute bottom-0 right-0 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-slate-950 text-white shadow-lg">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          </label>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-950">{form.name || "BIZEN User"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {employee?.id || profile?.user?.email} · {department}
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <StatusBadge status={role} />
          {employee?.status ? <StatusBadge status={employee.status} /> : null}
        </div>
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
          Avatar sẽ hiển thị ở hồ sơ, cộng đồng và các khu vực nhận diện nhân viên.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-normal text-blue-700">Profile</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Chỉnh sửa hồ sơ</h2>
          <p className="mt-2 text-sm text-slate-500">Thông tin này dùng cho cộng đồng nội bộ và hồ sơ nhân viên.</p>
        </div>

        {error ? <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
        {message ? (
          <p className="mb-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </p>
        ) : null}

        <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Họ tên
            <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <UserRound className="h-4 w-4 text-slate-400" />
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full outline-none" />
            </span>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Email
            <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500">
              <Mail className="h-4 w-4 text-slate-400" />
              <input value={employee?.email || profile?.user?.email || ""} disabled className="w-full bg-transparent outline-none" />
            </span>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Số điện thoại
            <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <Phone className="h-4 w-4 text-slate-400" />
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full outline-none" placeholder="090..." />
            </span>
          </label>

          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Địa chỉ
            <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <MapPin className="h-4 w-4 text-slate-400" />
              <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="w-full outline-none" placeholder="Đà Nẵng" />
            </span>
          </label>

          <button disabled={saving || !form.name.trim()} className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-300">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Đang lưu" : "Lưu hồ sơ"}
          </button>
        </form>
      </section>
    </div>
  );
}

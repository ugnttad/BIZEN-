import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Clock3, CreditCard, Loader2, MapPin, Navigation, Search, ShieldCheck, UsersRound } from "lucide-react";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import { formatCurrency } from "../../lib/utils";
import { bizenApi } from "../../modules/api/bizenApi";

export default function Settings() {
  const [settings, setSettings] = useState({
    workStart: "08:00",
    workEnd: "17:00",
    lateGraceMinutes: 10,
    payrollFormula: "Base salary / 22 x working days + OT + bonus - deduction",
    overtimeFormula: "Hourly rate x 150%",
    annualLeaveDays: 12,
    storeAddress: "Hải Châu, Đà Nẵng",
    storeLatitude: 16.0678,
    storeLongitude: 108.2208,
    geofenceRadiusMeters: 200,
    geofenceEnabled: true
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("Hải Châu, Đà Nẵng");
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [placeSearching, setPlaceSearching] = useState(false);
  const [placeConfigured, setPlaceConfigured] = useState(true);
  const [placeDropdownOpen, setPlaceDropdownOpen] = useState(false);
  const [placeMessage, setPlaceMessage] = useState("");
  const [selectingPlaceId, setSelectingPlaceId] = useState("");

  useEffect(() => {
    Promise.all([bizenApi.settings(), bizenApi.departments()])
      .then(([settingsData, departmentRows]) => {
        if (settingsData) {
          setSettings(settingsData);
          setPlaceQuery(settingsData.storeAddress || "");
        }
        setDepartments(departmentRows);
      })
      .catch((requestError) => setError(requestError.message || "Không tải được bộ phận/nhóm từ Neon."));
  }, []);

  useEffect(() => {
    const input = placeQuery.trim();

    if (!placeDropdownOpen) {
      setPlaceSearching(false);
      return undefined;
    }

    if (input.length < 2) {
      setPlaceSuggestions([]);
      setPlaceSearching(false);
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setPlaceSearching(true);
      setPlaceMessage("");

      try {
        const response = await bizenApi.placeSuggestions({
          input,
          latitude: settings.storeLatitude,
          longitude: settings.storeLongitude
        });

        if (!active) return;

        setPlaceConfigured(response.configured !== false);
        setPlaceSuggestions(response.suggestions || []);
        if (response.configured === false) {
          setPlaceMessage(response.issue?.message || "Chưa cấu hình GOOGLE_MAPS_API_KEY, vẫn có thể nhập tay hoặc dùng GPS hiện tại.");
        }
      } catch (requestError) {
        if (!active) return;
        setPlaceSuggestions([]);
        setPlaceMessage(requestError.message || "Không tải được gợi ý địa điểm từ Google Places.");
      } finally {
        if (active) setPlaceSearching(false);
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [placeDropdownOpen, placeQuery, settings.storeLatitude, settings.storeLongitude]);

  async function saveSettings(event) {
    event.preventDefault();
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.workStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.workEnd)) {
      setError("Giờ làm cần đúng định dạng HH:mm.");
      return;
    }
    if (settings.workStart === settings.workEnd) {
      setError("Giờ bắt đầu và giờ kết thúc không được trùng nhau.");
      return;
    }
    if (Number(settings.lateGraceMinutes) < 0 || Number(settings.lateGraceMinutes) > 60 || Number(settings.annualLeaveDays) < 0 || Number(settings.annualLeaveDays) > 24) {
      setError("Đi trễ cho phép 0-60 phút, ngày phép năm 0-24 ngày.");
      return;
    }
    if (settings.geofenceEnabled && (settings.storeLatitude === "" || settings.storeLongitude === "")) {
      setError("Bật ràng buộc vị trí cần có tọa độ quán.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const updated = await bizenApi.updateSettings(settings);
      setSettings(updated);
      setSaved(true);
    } catch (requestError) {
      setError(requestError.message || "Không lưu được cấu hình. Kiểm tra API và thử lại.");
    } finally {
      setSaving(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ lấy vị trí.");
      return;
    }

    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings((current) => ({
          ...current,
          storeLatitude: Number(position.coords.latitude.toFixed(7)),
          storeLongitude: Number(position.coords.longitude.toFixed(7)),
          geofenceEnabled: true
        }));
        setPlaceMessage("Đã lấy GPS hiện tại. Có thể lưu luôn hoặc tìm địa chỉ quán để app tự điền tên rõ hơn.");
        setLocating(false);
      },
      () => {
        setError("Không lấy được vị trí hiện tại. Kiểm tra quyền GPS của trình duyệt.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  async function selectPlace(suggestion) {
    setSelectingPlaceId(suggestion.placeId);
    setPlaceMessage("");
    setError("");

    try {
      const response = await bizenApi.placeDetails(suggestion.placeId, suggestion.text || suggestion.mainText);
      if (response.configured === false || !response.place) {
        setPlaceConfigured(false);
        setPlaceMessage(response.issue?.message || "Chưa cấu hình GOOGLE_MAPS_API_KEY, vẫn có thể nhập tay hoặc dùng GPS hiện tại.");
        return;
      }

      const place = response.place;
      const address = place.address || place.name || suggestion.text;
      const latitude = place.latitude === null || place.latitude === undefined ? "" : Number(Number(place.latitude).toFixed(7));
      const longitude = place.longitude === null || place.longitude === undefined ? "" : Number(Number(place.longitude).toFixed(7));

      setPlaceQuery(address);
      setSettings((current) => ({
        ...current,
        storeAddress: address,
        storeLatitude: latitude === "" ? current.storeLatitude : latitude,
        storeLongitude: longitude === "" ? current.storeLongitude : longitude,
        geofenceEnabled: true
      }));
      setPlaceSuggestions([]);
      setPlaceDropdownOpen(false);
      setPlaceMessage("Đã lấy tọa độ từ Google Places.");
    } catch (requestError) {
      setPlaceMessage(requestError.message || "Không lấy được tọa độ địa điểm từ Google Places.");
    } finally {
      setSelectingPlaceId("");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Cấu hình hệ thống"
        description="Thiết lập giờ làm chuẩn, quy định đi trễ, công thức lương, OT và bộ phận/nhóm cho cửa hàng."
        actions={
          <button
            onClick={saveSettings}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        }
      />

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <form onSubmit={saveSettings} className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
                <Clock3 className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-950">Giờ làm và đi trễ</h2>
            </div>
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
              Đây là giờ chấm công mặc định của doanh nghiệp. Nếu nhân viên đã được xếp vào một ca cụ thể trong màn Xếp ca, hệ thống sẽ ưu tiên giờ bắt đầu/kết thúc của ca đó để tính đi trễ và OT.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Giờ bắt đầu
                <input value={settings.workStart} onChange={(event) => setSettings({ ...settings, workStart: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Giờ kết thúc
                <input value={settings.workEnd} onChange={(event) => setSettings({ ...settings, workEnd: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Grace period phút
                <input type="number" value={settings.lateGraceMinutes} onChange={(event) => setSettings({ ...settings, lateGraceMinutes: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-slate-950">Vị trí chấm công</h2>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(settings.geofenceEnabled)}
                  onChange={(event) => setSettings({ ...settings, geofenceEnabled: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Bật GPS
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="relative text-sm font-medium text-slate-700 md:col-span-2">
                <label htmlFor="store-address">Địa chỉ quán</label>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="store-address"
                    value={placeQuery}
                    onBlur={() => window.setTimeout(() => setPlaceDropdownOpen(false), 150)}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setPlaceQuery(nextValue);
                      setPlaceDropdownOpen(true);
                      setSettings((current) => ({ ...current, storeAddress: nextValue }));
                    }}
                    onFocus={() => setPlaceDropdownOpen(true)}
                    placeholder="Nhập tên quán hoặc địa chỉ"
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-10 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {placeSearching ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" /> : null}
                </div>
                {placeDropdownOpen && placeSuggestions.length > 0 ? (
                  <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {placeSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.placeId}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectPlace(suggestion);
                        }}
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={Boolean(selectingPlaceId)}
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">{suggestion.mainText || suggestion.text}</span>
                          {suggestion.secondaryText ? <span className="block truncate text-xs font-medium text-slate-500">{suggestion.secondaryText}</span> : null}
                        </span>
                        {selectingPlaceId === suggestion.placeId ? <Loader2 className="ml-auto mt-0.5 h-4 w-4 shrink-0 animate-spin text-slate-400" /> : null}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 px-3 py-1.5 text-right text-[11px] font-semibold text-slate-400">Powered by Google</div>
                  </div>
                ) : null}
                {placeMessage ? (
                  <p className={`mt-2 text-xs ${placeConfigured ? "text-slate-500" : "text-amber-700"}`}>{placeMessage}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">Gõ tên quán để lấy gợi ý từ Google Places; chọn một nơi sẽ tự điền tọa độ GPS.</p>
                )}
              </div>
              <label className="text-sm font-medium text-slate-700">
                Latitude
                <input type="number" step="0.0000001" value={settings.storeLatitude ?? ""} onChange={(event) => setSettings({ ...settings, storeLatitude: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Longitude
                <input type="number" step="0.0000001" value={settings.storeLongitude ?? ""} onChange={(event) => setSettings({ ...settings, storeLongitude: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Bán kính cho phép (m)
                <input type="number" min="30" max="2000" value={settings.geofenceRadiusMeters ?? 200} onChange={(event) => setSettings({ ...settings, geofenceRadiusMeters: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Navigation className="h-4 w-4" />
                {locating ? "Đang lấy vị trí..." : "Dùng vị trí hiện tại"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-50 text-violet-700">
                <CreditCard className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-950">Công thức lương</h2>
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-medium text-slate-700">
                Payroll formula
                <textarea value={settings.payrollFormula} onChange={(event) => setSettings({ ...settings, payrollFormula: event.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                OT formula
                <input value={settings.overtimeFormula} onChange={(event) => setSettings({ ...settings, overtimeFormula: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Số ngày phép năm
                <input type="number" value={settings.annualLeaveDays} onChange={(event) => setSettings({ ...settings, annualLeaveDays: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <Building2 className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-950">Bộ phận / nhóm</h2>
            </div>
            <div className="space-y-2">
              {departments.map((department) => (
                <div key={department.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-950">{department.name}</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {department.employeeCount ?? 0}/{department.targetHeadcount} người
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.min(100, ((department.employeeCount || 0) / Math.max(1, department.targetHeadcount || 1)) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Active {department.activeCount ?? 0} · Nghỉ {department.onLeaveCount ?? 0} · Quỹ lương {formatCurrency(department.baseSalaryTotal || 0)}
                  </p>
                </div>
              ))}
              {departments.length === 0 ? <p className="text-sm text-slate-500">Chưa có bộ phận/nhóm hoặc API đang lỗi.</p> : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-950">Quyền truy cập</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Chủ sở hữu", "Nhân viên"].map((role) => (
                <div key={role} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                  {role}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-950">Phân quyền</h2>
                <p className="mt-1 text-sm text-slate-500">Chủ sở hữu có toàn quyền. Nhân viên chỉ dùng cổng tự phục vụ; quản lý ca là chức vụ công việc, không phải quyền riêng.</p>
              </div>
            </div>
          </section>
        </aside>
      </form>

      <Modal
        open={saved}
        title="Đã lưu cấu hình"
        onClose={() => setSaved(false)}
        footer={<button onClick={() => setSaved(false)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Đóng</button>}
      >
        <div className="flex gap-3 text-sm text-slate-600">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p>Cấu hình đã được cập nhật cho giờ làm, payroll và nghỉ phép.</p>
        </div>
      </Modal>
    </div>
  );
}

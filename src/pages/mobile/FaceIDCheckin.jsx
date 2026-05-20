import { useState } from "react";
import { CheckCircle2, Loader2, MapPin, ScanFace, ShieldAlert, XCircle } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";

export default function FaceIDCheckin() {
  const [state, setState] = useState("idle");

  function scanFace(nextState = "success") {
    setState("scanning");
    window.setTimeout(() => setState(nextState), 900);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-950">Face ID Check-in</h2>
          <StatusBadge status={state === "success" ? "Present" : state === "failed" ? "Late" : "Reviewed"} />
        </div>
        <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl bg-slate-950">
          <div className="absolute inset-5 rounded-[36px] border-2 border-white/20" />
          <div className="absolute left-1/2 top-8 h-24 w-40 -translate-x-1/2 rounded-full border border-blue-400/70" />
          <div className="grid h-32 w-32 place-items-center rounded-full border-4 border-blue-400/70 bg-white/10 text-white">
            {state === "scanning" ? <Loader2 className="h-14 w-14 animate-spin" /> : <ScanFace className="h-14 w-14" />}
          </div>
          <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-white/10 px-3 py-2 text-center text-sm font-semibold text-white">
            {state === "idle" && "Sẵn sàng quét"}
            {state === "scanning" && "Đang xác minh khuôn mặt"}
            {state === "success" && "Xác minh thành công"}
            {state === "failed" && "Nhận diện thất bại"}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-blue-600" />
          Hải Châu, Đà Nẵng · GPS hợp lệ
        </div>

        {state === "success" ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              Chấm công thành công
            </div>
            <p className="mt-1 text-sm">Check-in ghi nhận lúc 13:22 ngày 20/05/2026.</p>
          </div>
        ) : null}

        {state === "failed" ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <div className="flex items-center gap-2 font-semibold">
              <XCircle className="h-5 w-5" />
              Không khớp khuôn mặt
            </div>
            <p className="mt-1 text-sm">Vui lòng quét lại hoặc báo quản lý xác minh thủ công.</p>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => scanFace("success")} className="rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Scan Face
          </button>
          <button onClick={() => scanFace("failed")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            <ShieldAlert className="h-4 w-4" />
            Thử lỗi
          </button>
        </div>
      </section>
    </div>
  );
}

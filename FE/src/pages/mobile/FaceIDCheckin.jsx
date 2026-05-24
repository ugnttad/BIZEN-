import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, MapPin, RotateCcw, ScanFace, Upload, UserPlus, VideoOff, XCircle } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { bizenApi } from "../../modules/api/bizenApi";
import { getMobileEmployeeSession } from "../../modules/auth/mobileSession";

const defaultLocation = "Hải Châu, Đà Nẵng";

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function getCameraContextError() {
  if (typeof window === "undefined" || window.isSecureContext) return "";

  const host = window.location.hostname;
  const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (isLocalhost) return "";

  return "Chrome chặn camera trên HTTP LAN IP. Dùng localhost/HTTPS để mở camera, hoặc chọn ảnh bên dưới để test workflow AWS.";
}

function getCameraErrorMessage(cameraError) {
  if (cameraError?.name === "NotAllowedError") return "Bạn đã chặn quyền camera. Bấm biểu tượng camera trên thanh địa chỉ rồi cho phép lại.";
  if (cameraError?.name === "NotFoundError" || cameraError?.name === "DevicesNotFoundError") return "Không tìm thấy camera trên thiết bị.";
  if (cameraError?.name === "NotReadableError" || cameraError?.name === "TrackStartError") return "Camera đang được ứng dụng khác sử dụng.";
  return "Không thể mở camera. Kiểm tra quyền truy cập camera.";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getFriendlyFaceError(message) {
  if (/AWS Rekognition/i.test(message || "") && /credential|credentials|provider/i.test(message || "")) {
    return "AWS Rekognition chưa được cấu hình trên Vercel. Hệ thống sẽ dùng chế độ demo sau khi bản mới được deploy.";
  }
  return message;
}

export default function FaceIDCheckin() {
  const employee = getMobileEmployeeSession();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [state, setState] = useState("idle");
  const [cameraStatus, setCameraStatus] = useState("loading");
  const [imageSource, setImageSource] = useState("camera");
  const [uploadedImage, setUploadedImage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [enrollment, setEnrollment] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const badgeStatus = useMemo(() => {
    if (state === "success") return result?.attendance?.status || "Reviewed";
    if (enrollment?.status === "Pending") return "Pending";
    if (enrollment?.status === "Approved") return "Approved";
    if (enrollment?.status === "Rejected") return "Rejected";
    if (state === "failed") return "Late";
    return "Reviewed";
  }, [enrollment, result, state]);

  useEffect(() => {
    let active = true;
    bizenApi
      .faceEnrollmentStatus(employee.id)
      .then((data) => {
        if (active) setEnrollment(data);
      })
      .catch(() => {
        if (active) setEnrollment(null);
      });

    return () => {
      active = false;
    };
  }, [employee.id]);

  useEffect(() => {
    let active = true;
    bizenApi
      .employeeAttendance(employee.id)
      .then((rows) => {
        if (active) setTodayAttendance(rows.find((row) => row.workDate === formatLocalDate()) || null);
      })
      .catch(() => {
        if (active) setTodayAttendance(null);
      });

    return () => {
      active = false;
    };
  }, [employee.id]);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      const contextError = getCameraContextError();
      if (contextError) {
        setCameraStatus("blocked");
        setError(contextError);
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("blocked");
        setError("Trình duyệt không hỗ trợ camera.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 720 },
            height: { ideal: 960 }
          },
          audio: false
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraStatus("ready");
      } catch (cameraError) {
        setCameraStatus("blocked");
        setError(getCameraErrorMessage(cameraError));
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      throw new Error("Camera chưa sẵn sàng.");
    }

    const maxWidth = 720;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  }

  function getFaceImage() {
    if (imageSource === "upload" && uploadedImage) return uploadedImage;
    if (cameraStatus === "ready") return captureFrame();
    if (uploadedImage) return uploadedImage;
    throw new Error("Chưa có ảnh khuôn mặt. Mở camera hoặc chọn ảnh để tiếp tục.");
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh.");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setUploadedImage(dataUrl);
    setUploadedFileName(file.name);
    setImageSource("upload");
    setError("");
    setState("idle");
  }

  async function scanFace() {
    setState("scanning");
    setError("");

    try {
      const image = getFaceImage();
      const response = await bizenApi.faceCheckin({
        employeeId: employee.id,
        image,
        workDate: formatLocalDate(),
        location: defaultLocation
      });
      setResult(response);
      setState("success");
      bizenApi
        .employeeAttendance(employee.id)
        .then((rows) => setTodayAttendance(rows.find((row) => row.workDate === formatLocalDate()) || null))
        .catch(() => {});
    } catch (scanError) {
      setResult(null);
      setError(getFriendlyFaceError(scanError.message) || "Không xác minh được khuôn mặt.");
      setState("failed");
    }
  }

  async function enrollFace() {
    setState("enrolling");
    setError("");

    try {
      const image = getFaceImage();
      const response = await bizenApi.faceEnroll({
        employeeId: employee.id,
        image
      });
      setResult(response);
      setEnrollment({
        id: response.enrollmentId,
        status: response.status,
        requestedAt: response.requestedAt,
        imageUrl: response.imageUrl
      });
      setState("success");
    } catch (enrollError) {
      setResult(null);
      setError(getFriendlyFaceError(enrollError.message) || "Không đăng ký được khuôn mặt.");
      setState("failed");
    }
  }

  function resetScan() {
    setResult(null);
    setError("");
    setState("idle");
    if (cameraStatus === "ready") setImageSource("camera");
  }

  const actionLabel = result?.action === "check-out" ? "Check-out" : "Check-in";
  const isBusy = state === "scanning" || state === "enrolling";
  const hasImage = cameraStatus === "ready" || Boolean(uploadedImage);
  const canCheckIn = enrollment?.status === "Approved";
  const confidence = result?.face?.similarity ? Math.round(result.face.similarity) : result?.face?.confidence ? Math.round(result.face.confidence) : null;
  const isDemoVerification = result?.provider === "local-demo" || result?.face?.provider === "local-demo";
  const providerLabel = isDemoVerification ? "Chế độ demo Face ID" : "AWS Rekognition";
  const hasCheckedIn = Boolean(todayAttendance?.checkIn && todayAttendance.checkIn !== "-");
  const hasCheckedOut = Boolean(todayAttendance?.checkOut && todayAttendance.checkOut !== "-");
  const scanLabel = hasCheckedOut ? "Đã hoàn tất" : hasCheckedIn ? "Kết thúc ca" : "Check-in Face ID";

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">Face ID Check-in</h2>
            <p className="mt-1 text-xs text-slate-500">
              {employee.id} · {employee.name}
            </p>
          </div>
          <StatusBadge status={badgeStatus} />
        </div>

        <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl bg-slate-950">
          {imageSource === "upload" && uploadedImage ? (
            <img src={uploadedImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
          )}
          <canvas ref={canvasRef} className="hidden" />

          <div className="pointer-events-none absolute inset-5 rounded-[36px] border-2 border-white/25" />
          <div className="pointer-events-none absolute left-1/2 top-8 h-24 w-40 -translate-x-1/2 rounded-full border border-blue-300/80" />

          {cameraStatus === "blocked" && imageSource !== "upload" ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-950 px-8 text-center text-white">
              <div>
                <VideoOff className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-semibold">Camera chưa khả dụng</p>
                <p className="mt-2 text-xs leading-5 text-slate-300">{error}</p>
              </div>
            </div>
          ) : null}

          {isBusy ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-950/55 text-white">
              <Loader2 className="h-14 w-14 animate-spin" />
            </div>
          ) : null}

          <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-white/15 px-3 py-2 text-center text-sm font-semibold text-white backdrop-blur">
            {state === "idle" && imageSource === "upload" && "Sẵn sàng dùng ảnh đã chọn"}
            {state === "idle" && imageSource !== "upload" && cameraStatus === "ready" && "Sẵn sàng quét camera"}
            {state === "idle" && imageSource !== "upload" && cameraStatus === "loading" && "Đang mở camera"}
            {state === "idle" && imageSource !== "upload" && cameraStatus === "blocked" && "Camera bị chặn"}
            {state === "scanning" && "Đang xác minh khuôn mặt"}
            {state === "enrolling" && "Đang đăng ký khuôn mặt"}
            {state === "success" && (result?.pending ? "Đã gửi chủ sở hữu duyệt" : "Xác minh thành công")}
            {state === "failed" && "Xác minh thất bại"}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-blue-600" />
          {defaultLocation} · GPS hợp lệ
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Trạng thái Face ID</p>
            <p className="mt-1 text-xs text-slate-500">
              {enrollment?.status === "Approved" && "Chủ sở hữu đã duyệt. Bạn có thể chấm công bằng khuôn mặt."}
                {enrollment?.status === "Pending" && "Yêu cầu đang chờ chủ sở hữu duyệt trên web dashboard."}
                {enrollment?.status === "Rejected" && (enrollment.rejectionReason || "Yêu cầu đã bị từ chối. Vui lòng đăng ký lại.")}
                {!enrollment || enrollment?.status === "Not submitted" ? "Bạn cần đăng ký khuôn mặt và chờ chủ sở hữu duyệt trước khi chấm công." : null}
              </p>
            </div>
            <StatusBadge status={enrollment?.status === "Not submitted" ? "Reviewed" : enrollment?.status || "Reviewed"} />
          </div>
        </div>

        {hasCheckedIn ? (
          <div className={`mt-3 rounded-lg border p-3 text-sm ${hasCheckedOut ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            {hasCheckedOut
              ? `Ca hôm nay đã hoàn tất: ${todayAttendance.checkIn} - ${todayAttendance.checkOut}, ${todayAttendance.hours}h.`
              : `Bạn đã vào ca lúc ${todayAttendance.checkIn}. Hãy scan lần nữa khi kết thúc ca để chủ sở hữu chốt đủ giờ.`}
          </div>
        ) : null}

        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Upload className="h-4 w-4" />
          {uploadedFileName || "Chọn ảnh khuôn mặt để test khi camera bị chặn"}
          <input type="file" accept="image/*" capture="user" onChange={handleUpload} className="hidden" />
        </label>

        {cameraStatus === "blocked" ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</div> : null}

        {state === "success" ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              {result?.pending ? "Đã gửi yêu cầu đăng ký" : isDemoVerification ? "Chấm công bằng chế độ demo" : "Chấm công thành công"}
            </div>
            {result?.pending ? (
              <p className="mt-1 text-sm">Chủ sở hữu cần duyệt ảnh đăng ký trước khi bạn được dùng Face ID để chấm công.</p>
            ) : (
              <p className="mt-1 text-sm">
                {actionLabel} ghi nhận lúc {result.checkTime} ngày {formatDisplayDate(result.workDate)}.
              </p>
            )}
            {isDemoVerification ? (
              <p className="mt-1 text-xs text-emerald-700">AWS Rekognition chưa cấu hình, hệ thống đã dùng trạng thái chủ sở hữu duyệt Face ID để ghi nhận demo.</p>
            ) : null}
            {confidence && !isDemoVerification ? <p className="mt-1 text-xs text-emerald-700">{providerLabel} similarity {confidence}%</p> : null}
          </div>
        ) : null}

        {state === "failed" ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <div className="flex items-center gap-2 font-semibold">
              <XCircle className="h-5 w-5" />
              Không xác minh được
            </div>
            <p className="mt-1 text-sm">{error || "Vui lòng quét lại hoặc báo quản lý xác minh thủ công."}</p>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
          <button
            onClick={enrollFace}
            disabled={isBusy || !hasImage}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {state === "enrolling" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {enrollment?.status === "Rejected" ? "Đăng ký lại" : "Đăng ký"}
          </button>
          <button
            onClick={scanFace}
            disabled={isBusy || !hasImage || !canCheckIn || hasCheckedOut}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {state === "scanning" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
            {scanLabel}
          </button>
          <button onClick={resetScan} className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100" aria-label="Làm mới">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

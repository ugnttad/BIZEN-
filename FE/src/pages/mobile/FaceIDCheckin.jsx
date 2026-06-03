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

  return "Chrome chặn camera trên HTTP LAN IP. Dùng localhost/HTTPS để mở camera, hoặc chọn ảnh bên dưới để kiểm tra workflow AWS.";
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
    return "AWS Rekognition chưa được cấu hình. Cần thêm AWS credentials hoặc bật FACE_ID_ALLOW_DEMO_MODE=true cho local fallback.";
  }
  return message;
}

function getReadinessMessage(status, readiness) {
  if (status === "checking") return "Đang kiểm tra khuôn mặt bằng AWS Rekognition...";
  if (status === "ready") return readiness?.reason || "Khuôn mặt rõ, đủ điều kiện xác minh.";
  if (status === "adjust") return readiness?.reason || "Cần chỉnh lại ánh sáng, góc mặt hoặc khoảng cách.";
  if (status === "error") return readiness?.reason || "Chưa kiểm tra được chất lượng khuôn mặt.";
  return "Đưa khuôn mặt vào khung để hệ thống kiểm tra realtime.";
}

function getReadinessTone(status) {
  if (status === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "adjust") return "border-amber-200 bg-amber-50 text-amber-900";
  if (status === "error") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getLocationErrorMessage(locationError) {
  if (locationError?.code === 1) return "Bạn đã chặn quyền vị trí. Hãy cho phép GPS để chấm công tại quán.";
  if (locationError?.code === 2) return "Không lấy được vị trí hiện tại. Thử bật GPS/Wi-Fi rồi quét lại.";
  if (locationError?.code === 3) return "Lấy vị trí quá lâu. Di chuyển ra nơi có tín hiệu tốt hơn rồi thử lại.";
  return locationError?.message || "Không lấy được vị trí hiện tại.";
}

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ GPS."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 0)
        }),
      reject,
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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
  const [settings, setSettings] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [geoPosition, setGeoPosition] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [readinessStatus, setReadinessStatus] = useState("idle");
  const [readiness, setReadiness] = useState(null);
  const [livenessPrompt, setLivenessPrompt] = useState("");
  const [livenessProgress, setLivenessProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const isBusy = state === "scanning" || state === "enrolling";

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
      .checkinPolicy(employee.id)
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch(() => {
        if (active) setSettings(null);
      });

    return () => {
      active = false;
    };
  }, [employee.id]);

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

  useEffect(() => {
    if (cameraStatus !== "ready" || imageSource !== "camera" || isBusy) return undefined;

    let cancelled = false;
    const runCheck = async () => {
      if (cancelled) return;
      await analyzeFaceReadiness();
    };

    const startupTimer = window.setTimeout(runCheck, 800);
    const interval = window.setInterval(runCheck, 3200);

    return () => {
      cancelled = true;
      window.clearTimeout(startupTimer);
      window.clearInterval(interval);
    };
  }, [cameraStatus, imageSource, isBusy, employee.id]);

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

  async function analyzeFaceReadiness(imageOverride, options = {}) {
    if (isBusy && !options.force) return null;

    try {
      const image = imageOverride || getFaceImage();
      setReadinessStatus("checking");
      const response = await bizenApi.faceReadiness({
        employeeId: employee.id,
        image
      });
      setReadiness(response);
      setReadinessStatus(response.ready ? "ready" : "adjust");
      return response;
    } catch (readinessError) {
      const response = {
        ready: false,
        valid: false,
        reason: getFriendlyFaceError(readinessError.message) || "Không kiểm tra được chất lượng khuôn mặt.",
        checks: []
      };
      setReadiness(response);
      setReadinessStatus("error");
      return response;
    }
  }

  async function captureBlinkBurst() {
    const frames = [];
    for (let index = 0; index < 6; index += 1) {
      await wait(160);
      frames.push(captureFrame());
    }
    return frames;
  }

  async function runLivenessChallenge() {
    if (cameraStatus !== "ready" || imageSource !== "camera") {
      throw new Error("Check-in Face ID thật cần camera live. Ảnh upload chỉ dùng để đăng ký hoặc test chất lượng.");
    }

    const steps = [
      { key: "center", prompt: "Nhìn thẳng vào camera", progress: "1/4", waitMs: 900 },
      { key: "turnLeft", prompt: "Quay mặt sang trái", progress: "2/4", waitMs: 1100 },
      { key: "turnRight", prompt: "Quay mặt sang phải", progress: "3/4", waitMs: 1100 }
    ];
    const frames = {};

    for (const step of steps) {
      setLivenessPrompt(step.prompt);
      setLivenessProgress(step.progress);
      await wait(step.waitMs);
      frames[step.key] = captureFrame();
    }

    setLivenessPrompt("Chớp mắt liên tục");
    setLivenessProgress("4/4");
    await wait(350);
    frames.blink = await captureBlinkBurst();

    setLivenessPrompt("");
    setLivenessProgress("");
    return frames;
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
    analyzeFaceReadiness(dataUrl);
  }

  async function resolveLocationForCheckin() {
    if (settings?.geofenceEnabled === false) {
      return null;
    }

    setGeoStatus("loading");
    setGeoError("");
    try {
      const position = await getCurrentLocation();
      setGeoPosition(position);
      setGeoStatus("ready");
      return position;
    } catch (locationError) {
      const message = getLocationErrorMessage(locationError);
      setGeoError(message);
      setGeoStatus("blocked");
      throw new Error(message);
    }
  }

  async function scanFace() {
    setState("scanning");
    setError("");

    try {
      const livenessFrames = await runLivenessChallenge();
      const image = livenessFrames.center;
      const liveFace = await analyzeFaceReadiness(image, { force: true });
      if (liveFace && liveFace.ready === false) {
        throw new Error(liveFace.reason || "Khuôn mặt chưa đủ điều kiện xác minh.");
      }

      const position = await resolveLocationForCheckin();
      const response = await bizenApi.faceCheckin({
        employeeId: employee.id,
        image,
        livenessFrames,
        workDate: formatLocalDate(),
        location: settings?.storeAddress || defaultLocation,
        latitude: position?.latitude,
        longitude: position?.longitude,
        locationAccuracyMeters: position?.accuracy
      });
      setResult(response);
      setState("success");
      bizenApi
        .employeeAttendance(employee.id)
        .then((rows) => setTodayAttendance(rows.find((row) => row.workDate === formatLocalDate()) || null))
        .catch(() => {});
    } catch (scanError) {
      setLivenessPrompt("");
      setLivenessProgress("");
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
      const liveFace = await analyzeFaceReadiness(image, { force: true });
      if (liveFace && liveFace.ready === false) {
        throw new Error(liveFace.reason || "Khuôn mặt chưa đủ điều kiện đăng ký.");
      }

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
    setReadiness(null);
    setReadinessStatus("idle");
    setLivenessPrompt("");
    setLivenessProgress("");
    if (cameraStatus === "ready") setImageSource("camera");
  }

  const actionLabel = result?.action === "check-out" ? "Check-out" : "Check-in";
  const hasImage = cameraStatus === "ready" || Boolean(uploadedImage);
  const enrollmentNeedsRealIndex =
    enrollment?.status === "Approved" &&
    !settings?.faceIdDemoMode &&
    (!enrollment.rekognitionFaceId || enrollment.rekognitionCollectionId === "local-demo");
  const canCheckIn = enrollment?.status === "Approved" && !enrollmentNeedsRealIndex;
  const confidence = result?.face?.similarity ? Math.round(result.face.similarity) : result?.face?.confidence ? Math.round(result.face.confidence) : null;
  const isDemoVerification = result?.provider === "local-demo" || result?.face?.provider === "local-demo";
  const providerLabel = isDemoVerification ? "Face ID local fallback" : "AWS Rekognition";
  const hasCheckedIn = Boolean(todayAttendance?.checkIn && todayAttendance.checkIn !== "-");
  const hasCheckedOut = Boolean(todayAttendance?.checkOut && todayAttendance.checkOut !== "-");
  const canUseLiveCamera = cameraStatus === "ready" && imageSource === "camera";
  const scanLabel = hasCheckedOut ? "Đã hoàn tất" : hasCheckedIn ? "Kết thúc ca" : "Check-in Face ID";
  const readinessBlocking = readiness && readiness.ready === false && readinessStatus !== "error";
  const readinessTone = getReadinessTone(readinessStatus);

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
              <div className="text-center">
                <Loader2 className="mx-auto h-14 w-14 animate-spin" />
                {livenessPrompt ? <p className="mt-3 text-sm font-bold">{livenessPrompt}</p> : null}
              </div>
            </div>
          ) : null}

          {livenessPrompt ? (
            <div className="absolute left-5 right-5 top-5 rounded-lg bg-white/90 px-3 py-3 text-center text-slate-950 shadow-lg">
              <p className="text-[11px] font-bold uppercase text-blue-700">{livenessProgress}</p>
              <p className="mt-1 text-base font-bold">{livenessPrompt}</p>
            </div>
          ) : null}

          <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-white/15 px-3 py-2 text-center text-sm font-semibold text-white backdrop-blur">
            {state === "idle" && imageSource === "upload" && "Sẵn sàng dùng ảnh đã chọn"}
            {state === "idle" && imageSource !== "upload" && cameraStatus === "ready" && "Sẵn sàng quét camera"}
            {state === "idle" && imageSource !== "upload" && cameraStatus === "loading" && "Đang mở camera"}
            {state === "idle" && imageSource !== "upload" && cameraStatus === "blocked" && "Camera bị chặn"}
            {state === "scanning" && (livenessPrompt || "Đang xác minh khuôn mặt")}
            {state === "enrolling" && "Đang đăng ký khuôn mặt"}
            {state === "success" && (result?.pending ? "Đã gửi chủ sở hữu duyệt" : "Xác minh thành công")}
            {state === "failed" && "Xác minh thất bại"}
          </div>
        </div>

        <div className={`mt-4 rounded-lg border px-3 py-3 text-sm ${readinessTone}`}>
          <div className="flex items-start gap-2">
            {readinessStatus === "checking" ? <Loader2 className="mt-0.5 h-4 w-4 animate-spin" /> : <ScanFace className="mt-0.5 h-4 w-4" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">Face AI realtime</p>
                {readiness?.confidence ? <span className="text-xs font-bold">{Math.round(readiness.confidence)}%</span> : null}
              </div>
              <p className="mt-1 text-xs leading-5">{getReadinessMessage(readinessStatus, readiness)}</p>
              {canUseLiveCamera && canCheckIn ? <p className="mt-1 text-xs leading-5">Khi check-in, hệ thống sẽ bắt buộc nhìn thẳng, quay trái/phải và chớp mắt trước khi match AWS.</p> : null}
              {readiness?.checks?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {readiness.checks.slice(0, 4).map((check) => (
                    <span
                      key={check.key}
                      className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                        check.status === "pass" ? "bg-white/70 text-emerald-700 ring-1 ring-emerald-200" : "bg-white/70 text-amber-800 ring-1 ring-amber-200"
                      }`}
                    >
                      {check.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 text-blue-600" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-800">{settings?.storeAddress || defaultLocation}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {settings?.geofenceEnabled === false && "GPS geofence đang tắt"}
              {settings?.geofenceEnabled !== false && geoStatus === "idle" && `Yêu cầu GPS trong bán kính ${settings?.geofenceRadiusMeters || 200}m khi chấm công`}
              {settings?.geofenceEnabled !== false && geoStatus === "loading" && "Đang lấy vị trí GPS"}
              {settings?.geofenceEnabled !== false && geoStatus === "ready" && `GPS sẵn sàng · sai số ${geoPosition?.accuracy || 0}m`}
              {settings?.geofenceEnabled !== false && geoStatus === "blocked" && geoError}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Trạng thái Face ID</p>
            <p className="mt-1 text-xs text-slate-500">
                {enrollment?.status === "Approved" &&
                  (enrollmentNeedsRealIndex
                    ? "Face ID này là dữ liệu local cũ hoặc chưa được AWS Rekognition index. Vui lòng đăng ký lại để xác thực thật."
                    : "Chủ sở hữu đã duyệt và AWS Rekognition đã index khuôn mặt. Bạn có thể chấm công bằng Face ID thật.")}
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
          {uploadedFileName || "Chọn ảnh khuôn mặt khi camera bị chặn"}
          <input type="file" accept="image/*" capture="user" onChange={handleUpload} className="hidden" />
        </label>

        {cameraStatus === "blocked" ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</div> : null}

        {state === "success" ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              {result?.pending ? "Đã gửi yêu cầu đăng ký" : isDemoVerification ? "Chấm công bằng local fallback" : "Chấm công thành công"}
            </div>
            {result?.pending ? (
              <p className="mt-1 text-sm">Chủ sở hữu cần duyệt ảnh đăng ký trước khi bạn được dùng Face ID để chấm công.</p>
            ) : (
              <p className="mt-1 text-sm">
                {actionLabel} ghi nhận lúc {result.checkTime} ngày {formatDisplayDate(result.workDate)}.
              </p>
            )}
            {result?.geofence?.enabled ? (
              <p className="mt-1 text-xs text-emerald-700">
                GPS hợp lệ: cách quán {result.geofence.distance}m trong bán kính {result.geofence.radius}m.
              </p>
            ) : null}
            {isDemoVerification ? (
              <p className="mt-1 text-xs text-emerald-700">Đang chạy FACE_ID_ALLOW_DEMO_MODE=true, nên hệ thống dùng local fallback theo trạng thái chủ sở hữu duyệt Face ID.</p>
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
            disabled={isBusy || !hasImage || readinessBlocking}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {state === "enrolling" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {enrollment?.status === "Rejected" ? "Đăng ký lại" : "Đăng ký"}
          </button>
          <button
            onClick={scanFace}
            disabled={isBusy || !hasImage || !canUseLiveCamera || !canCheckIn || hasCheckedOut}
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

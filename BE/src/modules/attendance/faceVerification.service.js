import {
  CreateCollectionCommand,
  DescribeCollectionCommand,
  DetectFacesCommand,
  IndexFacesCommand,
  RekognitionClient,
  SearchFacesByImageCommand
} from "@aws-sdk/client-rekognition";
import { env } from "../../config/env.js";
import { httpError } from "../../shared/httpError.js";

let rekognitionClient;

function getRekognitionClient() {
  if (!rekognitionClient) {
    rekognitionClient = new RekognitionClient({ region: env.awsRegion });
  }
  return rekognitionClient;
}

function isAwsRekognitionReady() {
  return Boolean(env.awsRekognitionEnabled);
}

function decodeImagePayload(image) {
  const withoutPrefix = image.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "");
  const normalized = withoutPrefix.replace(/\s/g, "");

  if (!/^[a-z0-9+/]+={0,2}$/i.test(normalized)) {
    throw httpError(400, "Invalid base64 image payload");
  }

  const buffer = Buffer.from(normalized, "base64");
  if (buffer.length < 1024) {
    throw httpError(400, "Image payload is too small");
  }
  if (buffer.length > 4 * 1024 * 1024) {
    throw httpError(413, "Image payload is too large");
  }

  return buffer;
}

function isMissingCollection(error) {
  return error?.name === "ResourceNotFoundException";
}

function isNoFaceError(error) {
  return error?.name === "InvalidParameterException" && /no faces|face/i.test(error.message || "");
}

function isCredentialsError(error) {
  return (
    error?.name === "CredentialsProviderError" ||
    error?.name === "CredentialProviderError" ||
    /credential|could not load credentials|resolved credential object is not valid/i.test(error?.message || "")
  );
}

function getLandmark(face, type) {
  return (face.Landmarks || []).find((landmark) => landmark.Type === type);
}

function hasLandmark(face, type) {
  const landmark = getLandmark(face, type);
  return Boolean(landmark && Number.isFinite(Number(landmark.X)) && Number.isFinite(Number(landmark.Y)));
}

function getBoundingBox(face) {
  const box = face.BoundingBox || {};
  return {
    left: Number(box.Left || 0),
    top: Number(box.Top || 0),
    width: Number(box.Width || 0),
    height: Number(box.Height || 0)
  };
}

function getFaceMetrics(face) {
  const box = getBoundingBox(face);
  const right = box.left + box.width;
  const bottom = box.top + box.height;
  return {
    box,
    centerX: box.left + box.width / 2,
    centerY: box.top + box.height / 2,
    right,
    bottom,
    yaw: face.Pose?.Yaw === undefined ? null : Number(face.Pose.Yaw),
    pitch: face.Pose?.Pitch === undefined ? null : Number(face.Pose.Pitch),
    roll: face.Pose?.Roll === undefined ? null : Number(face.Pose.Roll),
    eyesOpen: face.EyesOpen?.Value,
    eyesOpenConfidence: Number(face.EyesOpen?.Confidence || 0)
  };
}

function validateBasicImage() {
  if (!env.faceIdAllowDemoMode) {
    return {
      valid: false,
      ready: false,
      confidence: null,
      faceCount: 0,
      provider: "aws-rekognition",
      mode: "aws-required",
      reason: "AWS Rekognition chưa cấu hình. Cần cấu hình AWS credentials hoặc bật FACE_ID_ALLOW_DEMO_MODE=true cho môi trường demo."
    };
  }

  return {
    valid: true,
    ready: true,
    confidence: null,
    faceCount: 1,
    provider: "local-demo",
    mode: "aws-not-configured",
    reason: "AWS Rekognition chưa cấu hình. Hệ thống đang dùng chế độ demo vì FACE_ID_ALLOW_DEMO_MODE=true."
  };
}

function buildFaceQualityResult(face) {
  const confidence = Number(face.Confidence || 0);
  const brightness = face.Quality?.Brightness === undefined ? null : Number(face.Quality.Brightness);
  const sharpness = face.Quality?.Sharpness === undefined ? null : Number(face.Quality.Sharpness);
  const yaw = face.Pose?.Yaw === undefined ? null : Number(face.Pose.Yaw);
  const pitch = face.Pose?.Pitch === undefined ? null : Number(face.Pose.Pitch);
  const roll = face.Pose?.Roll === undefined ? null : Number(face.Pose.Roll);
  const metrics = getFaceMetrics(face);
  const requiredLandmarks = ["eyeLeft", "eyeRight", "nose", "mouthLeft", "mouthRight"];
  const hasAllLandmarks = requiredLandmarks.every((landmark) => hasLandmark(face, landmark));
  const wellFramed =
    metrics.box.left >= 0.04 &&
    metrics.box.top >= 0.03 &&
    metrics.right <= 0.96 &&
    metrics.bottom <= 0.98 &&
    metrics.box.width >= 0.18 &&
    metrics.box.width <= 0.72 &&
    metrics.box.height >= 0.22 &&
    metrics.box.height <= 0.84 &&
    metrics.centerX >= 0.32 &&
    metrics.centerX <= 0.68;
  const checks = [];

  checks.push({
    key: "face-confidence",
    label: "Độ tin cậy khuôn mặt",
    status: confidence >= env.awsRekognitionFaceMinConfidence ? "pass" : "fail",
    value: Math.round(confidence)
  });

  if (brightness !== null) {
    checks.push({
      key: "brightness",
      label: "Ánh sáng",
      status: brightness >= 30 ? "pass" : "fail",
      value: Math.round(brightness)
    });
  }

  if (sharpness !== null) {
    checks.push({
      key: "sharpness",
      label: "Độ nét",
      status: sharpness >= 35 ? "pass" : "fail",
      value: Math.round(sharpness)
    });
  }

  if (yaw !== null) {
    checks.push({
      key: "pose-yaw",
      label: "Góc mặt ngang",
      status: Math.abs(yaw) <= 30 ? "pass" : "fail",
      value: Math.round(yaw)
    });
  }

  if (pitch !== null) {
    checks.push({
      key: "pose-pitch",
      label: "Góc mặt dọc",
      status: Math.abs(pitch) <= 25 ? "pass" : "fail",
      value: Math.round(pitch)
    });
  }

  checks.push({
    key: "framing",
    label: "Đủ khuôn mặt",
    status: wellFramed ? "pass" : "fail",
    value: Math.round(metrics.box.width * 100)
  });

  checks.push({
    key: "landmarks",
    label: "Đủ mắt mũi miệng",
    status: hasAllLandmarks ? "pass" : "fail",
    value: requiredLandmarks.filter((landmark) => hasLandmark(face, landmark)).length
  });

  if (face.EyesOpen?.Value === false && Number(face.EyesOpen.Confidence || 0) >= 85) {
    checks.push({
      key: "eyes-open",
      label: "Mắt mở",
      status: "fail",
      value: 0
    });
  }

  if (face.FaceOccluded?.Value === true && Number(face.FaceOccluded.Confidence || 0) >= 80) {
    checks.push({
      key: "face-occluded",
      label: "Che khuôn mặt",
      status: "fail",
      value: Math.round(face.FaceOccluded.Confidence)
    });
  }

  const failedChecks = checks.filter((check) => check.status === "fail");

  return {
    valid: failedChecks.length === 0,
    ready: failedChecks.length === 0,
    reason: failedChecks.length ? failedChecks.map((check) => check.label).join(", ") : "Khuôn mặt rõ, đủ điều kiện xác minh.",
    confidence,
    faceCount: 1,
    provider: "aws-rekognition",
    quality: {
      brightness,
      sharpness
    },
    pose: {
      yaw,
      pitch,
      roll
    },
    boundingBox: metrics.box,
    checks
  };
}

async function sendRekognition(command, action) {
  if (!isAwsRekognitionReady()) {
    return {
      rekognitionUnavailable: true,
      unavailableReason: "AWS Rekognition chưa cấu hình credentials trên môi trường deploy."
    };
  }

  try {
    return await getRekognitionClient().send(command);
  } catch (error) {
    if (isNoFaceError(error)) {
      return { noFace: true };
    }
    if (isMissingCollection(error)) {
      return { missingCollection: true };
    }
    if (isCredentialsError(error)) {
      return {
        rekognitionUnavailable: true,
        unavailableReason: "AWS Rekognition chưa đọc được credentials trên môi trường deploy."
      };
    }
    throw httpError(502, `AWS Rekognition ${action} failed: ${error.message}`);
  }
}

async function ensureCollection() {
  const described = await sendRekognition(
    new DescribeCollectionCommand({ CollectionId: env.awsRekognitionCollectionId }),
    "describe collection"
  );

  if (described.rekognitionUnavailable || !described.missingCollection) {
    return described;
  }

  return sendRekognition(new CreateCollectionCommand({ CollectionId: env.awsRekognitionCollectionId }), "create collection");
}

async function validateSingleFace(imageBuffer) {
  const result = await sendRekognition(
    new DetectFacesCommand({
      Image: { Bytes: imageBuffer },
      Attributes: ["ALL"]
    }),
    "detect faces"
  );

  if (result.rekognitionUnavailable) {
    return validateBasicImage();
  }

  const faces = result.FaceDetails || [];
  if (faces.length === 0 || result.noFace) {
    return { valid: false, ready: false, reason: "Không tìm thấy khuôn mặt rõ trong ảnh.", faceCount: 0, provider: "aws-rekognition" };
  }
  if (faces.length > 1) {
    return { valid: false, ready: false, reason: "Ảnh có nhiều hơn một khuôn mặt.", faceCount: faces.length, provider: "aws-rekognition" };
  }

  return buildFaceQualityResult(faces[0]);
}

async function detectFaceForLiveness(image, label, options = {}) {
  const imageBuffer = decodeImagePayload(image);
  const result = await sendRekognition(
    new DetectFacesCommand({
      Image: { Bytes: imageBuffer },
      Attributes: ["ALL"]
    }),
    `detect liveness frame ${label}`
  );

  if (result.rekognitionUnavailable) {
    return {
      valid: Boolean(env.faceIdAllowDemoMode),
      reason: result.unavailableReason || "AWS Rekognition chưa khả dụng.",
      provider: env.faceIdAllowDemoMode ? "local-demo" : "aws-rekognition",
      mode: env.faceIdAllowDemoMode ? "aws-not-configured" : "aws-required",
      label
    };
  }

  const faces = result.FaceDetails || [];
  if (result.noFace || faces.length === 0) {
    return { valid: false, reason: `${label}: không tìm thấy khuôn mặt rõ.`, label };
  }
  if (faces.length > 1) {
    return { valid: false, reason: `${label}: ảnh có nhiều hơn một khuôn mặt.`, label, faceCount: faces.length };
  }

  const quality = buildFaceQualityResult(faces[0]);
  const blockingFailures = (quality.checks || []).filter((check) => check.status === "fail" && !(options.allowEyesClosed && check.key === "eyes-open"));
  return {
    ...quality,
    valid: blockingFailures.length === 0,
    reason: blockingFailures.length ? blockingFailures.map((check) => check.label).join(", ") : quality.reason,
    label,
    metrics: getFaceMetrics(faces[0])
  };
}

function frameCheck(label, status, detail = "") {
  return {
    key: label,
    label,
    status: status ? "pass" : "fail",
    detail
  };
}

export async function verifyFaceLiveness(frames = {}) {
  if (env.faceIdAllowDemoMode && !env.awsRekognitionEnabled) {
    return {
      live: true,
      provider: "local-demo",
      mode: "aws-not-configured",
      warning: "FACE_ID_ALLOW_DEMO_MODE=true nên bỏ qua liveness thật."
    };
  }

  const requiredFrames = {
    center: "Nhìn thẳng",
    turnLeft: "Quay trái",
    turnRight: "Quay phải"
  };

  for (const [key, label] of Object.entries(requiredFrames)) {
    if (!frames[key]) {
      return {
        live: false,
        reason: `Thiếu frame liveness: ${label}.`,
        checks: [frameCheck(label, false, "missing")]
      };
    }
  }
  const blinkFrames = Array.isArray(frames.blink) ? frames.blink.filter(Boolean) : [frames.blink].filter(Boolean);
  if (!blinkFrames.length) {
    return {
      live: false,
      reason: "Thiếu frame liveness: Chớp mắt.",
      checks: [frameCheck("Chớp mắt", false, "missing")]
    };
  }

  const analyzed = {};
  for (const [key, label] of Object.entries(requiredFrames)) {
    analyzed[key] = await detectFaceForLiveness(frames[key], label);
    if (!analyzed[key].valid) {
      return {
        live: false,
        reason: analyzed[key].reason || `${label}: frame chưa đạt.`,
        checks: analyzed[key].checks || [frameCheck(label, false)]
      };
    }
  }
  analyzed.blink = null;
  const blinkAttempts = [];
  for (const image of blinkFrames.slice(0, 6)) {
    const attempt = await detectFaceForLiveness(image, "Chớp mắt", { allowEyesClosed: true });
    blinkAttempts.push(attempt);
    if (attempt.valid && attempt.metrics?.eyesOpen === false && attempt.metrics?.eyesOpenConfidence >= 70) {
      analyzed.blink = attempt;
      break;
    }
  }
  if (!analyzed.blink) {
    const bestAttempt = blinkAttempts.find((attempt) => attempt.valid) || blinkAttempts[0];
    return {
      live: false,
      reason: "Chưa thấy hành động chớp mắt rõ.",
      checks: [...(bestAttempt?.checks || []), frameCheck("Có chớp mắt", false, "không có frame mắt đóng rõ")]
    };
  }

  const center = analyzed.center.metrics;
  const turnLeft = analyzed.turnLeft.metrics;
  const turnRight = analyzed.turnRight.metrics;
  const blink = analyzed.blink.metrics;
  const checks = [
    frameCheck("Nhìn thẳng", Math.abs(center.yaw || 0) <= 12 && Math.abs(center.pitch || 0) <= 18, `yaw ${Math.round(center.yaw || 0)}`),
    frameCheck(
      "Quay hai hướng",
      Math.abs((turnLeft.yaw || 0) - (turnRight.yaw || 0)) >= 24 && Math.abs(turnLeft.yaw || 0) >= 10 && Math.abs(turnRight.yaw || 0) >= 10,
      `yaw ${Math.round(turnLeft.yaw || 0)} / ${Math.round(turnRight.yaw || 0)}`
    ),
    frameCheck("Đổi hướng thật", (turnLeft.yaw || 0) * (turnRight.yaw || 0) < 0, "hai frame phải lệch hướng đối nhau"),
    frameCheck("Mắt mở ở frame chính", center.eyesOpen !== false || center.eyesOpenConfidence < 80, `confidence ${Math.round(center.eyesOpenConfidence || 0)}`),
    frameCheck("Có chớp mắt", blink.eyesOpen === false && blink.eyesOpenConfidence >= 70, `confidence ${Math.round(blink.eyesOpenConfidence || 0)}`)
  ];

  const failed = checks.filter((check) => check.status === "fail");
  if (failed.length) {
    return {
      live: false,
      reason: failed.map((check) => check.label).join(", "),
      checks,
      frames: analyzed
    };
  }

  return {
    live: true,
    provider: "aws-rekognition",
    checks,
    frames: analyzed,
    centerImage: frames.center
  };
}

export async function analyzeFaceImage(image) {
  const imageBuffer = decodeImagePayload(image);
  return validateSingleFace(imageBuffer);
}

export async function validateFaceImage(image) {
  const imageBuffer = decodeImagePayload(image);
  return validateSingleFace(imageBuffer);
}

export async function validateFaceImageBuffer(imageBuffer) {
  return validateSingleFace(imageBuffer);
}

export async function findDuplicateEnrollmentFaces(imageBuffer) {
  const collection = await ensureCollection();
  if (collection?.rekognitionUnavailable && !env.faceIdAllowDemoMode) {
    return {
      ready: false,
      provider: "aws-rekognition",
      mode: "aws-required",
      reason: collection.unavailableReason || "AWS Rekognition chưa khả dụng."
    };
  }

  if (collection?.rekognitionUnavailable || collection?.missingCollection) {
    return {
      ready: false,
      provider: env.faceIdAllowDemoMode ? "local-demo" : "aws-rekognition",
      mode: env.faceIdAllowDemoMode ? "aws-not-configured" : "aws-required",
      matches: [],
      reason: collection.unavailableReason || "AWS Rekognition collection chưa sẵn sàng."
    };
  }

  const result = await sendRekognition(
    new SearchFacesByImageCommand({
      CollectionId: env.awsRekognitionCollectionId,
      Image: { Bytes: imageBuffer },
      FaceMatchThreshold: env.awsRekognitionDuplicateMinSimilarity,
      MaxFaces: 8,
      QualityFilter: "AUTO"
    }),
    "search duplicate enrollment faces"
  );

  if (result.rekognitionUnavailable && !env.faceIdAllowDemoMode) {
    return {
      ready: false,
      provider: "aws-rekognition",
      mode: "aws-required",
      matches: [],
      reason: result.unavailableReason || "AWS Rekognition chưa khả dụng."
    };
  }

  if (result.rekognitionUnavailable || result.missingCollection || result.noFace) {
    return {
      ready: false,
      provider: env.faceIdAllowDemoMode ? "local-demo" : "aws-rekognition",
      mode: env.faceIdAllowDemoMode ? "aws-not-configured" : "aws-required",
      matches: [],
      reason: result.unavailableReason || "Không tìm thấy dữ liệu khuôn mặt đã index."
    };
  }

  return {
    ready: true,
    provider: "aws-rekognition",
    collectionId: env.awsRekognitionCollectionId,
    threshold: env.awsRekognitionDuplicateMinSimilarity,
    matches: (result.FaceMatches || []).map((match) => ({
      employeeId: match.Face?.ExternalImageId || null,
      faceId: match.Face?.FaceId || null,
      similarity: Number(match.Similarity || 0)
    }))
  };
}

export async function indexEmployeeFaceBuffer(employeeId, imageBuffer) {
  const face = await validateSingleFace(imageBuffer);
  if (!face.valid) {
    return { enrolled: false, ...face };
  }

  const collection = await ensureCollection();
  if (collection?.rekognitionUnavailable && !env.faceIdAllowDemoMode) {
    return {
      enrolled: false,
      provider: "aws-rekognition",
      mode: "aws-required",
      reason: collection.unavailableReason || "AWS Rekognition chưa khả dụng.",
      confidence: face.confidence,
      faceCount: 1
    };
  }

  if (face.provider === "local-demo" || collection?.rekognitionUnavailable) {
    return {
      enrolled: true,
      provider: "local-demo",
      collectionId: "local-demo",
      employeeId,
      confidence: face.confidence,
      faceId: `local-${employeeId}`,
      externalImageId: employeeId,
      mode: "aws-not-configured",
      warning: collection?.unavailableReason || face.reason
    };
  }

  const result = await sendRekognition(
    new IndexFacesCommand({
      CollectionId: env.awsRekognitionCollectionId,
      Image: { Bytes: imageBuffer },
      ExternalImageId: employeeId,
      MaxFaces: 1,
      QualityFilter: "AUTO"
    }),
    "index face"
  );

  if (result.rekognitionUnavailable && !env.faceIdAllowDemoMode) {
    return {
      enrolled: false,
      provider: "aws-rekognition",
      mode: "aws-required",
      reason: result.unavailableReason || "AWS Rekognition chưa khả dụng.",
      confidence: face.confidence,
      faceCount: 1
    };
  }

  if (result.rekognitionUnavailable) {
    return {
      enrolled: true,
      provider: "local-demo",
      collectionId: "local-demo",
      employeeId,
      confidence: face.confidence,
      faceId: `local-${employeeId}`,
      externalImageId: employeeId,
      mode: "aws-not-configured",
      warning: result.unavailableReason
    };
  }

  const record = result.FaceRecords?.[0];
  if (!record?.Face?.FaceId) {
    return {
      enrolled: false,
      reason: result.UnindexedFaces?.[0]?.Reasons?.join(", ") || "AWS Rekognition không index được khuôn mặt.",
      confidence: face.confidence,
      faceCount: 1
    };
  }

  return {
    enrolled: true,
    provider: "aws-rekognition",
    collectionId: env.awsRekognitionCollectionId,
    employeeId,
    confidence: record.Face.Confidence || face.confidence,
    faceId: record.Face.FaceId,
    externalImageId: record.Face.ExternalImageId
  };
}

export async function enrollEmployeeFace(employeeId, image) {
  const imageBuffer = decodeImagePayload(image);
  return indexEmployeeFaceBuffer(employeeId, imageBuffer);
}

export async function verifyEmployeeFace(employeeId, image) {
  const imageBuffer = decodeImagePayload(image);
  const face = await validateSingleFace(imageBuffer);
  if (!face.valid) {
    return { verified: false, ...face };
  }

  if (face.provider === "local-demo") {
    return {
      verified: true,
      provider: "local-demo",
      collectionId: "local-demo",
      employeeId,
      matchedEmployeeId: employeeId,
      confidence: face.confidence,
      faceCount: 1,
      similarity: 100,
      faceId: `local-${employeeId}`,
      mode: "aws-not-configured",
      warning: face.reason
    };
  }

  const result = await sendRekognition(
    new SearchFacesByImageCommand({
      CollectionId: env.awsRekognitionCollectionId,
      Image: { Bytes: imageBuffer },
      FaceMatchThreshold: env.awsRekognitionMinSimilarity,
      MaxFaces: 1,
      QualityFilter: "AUTO"
    }),
    "search faces"
  );

  if (result.rekognitionUnavailable && !env.faceIdAllowDemoMode) {
    return {
      verified: false,
      provider: "aws-rekognition",
      mode: "aws-required",
      reason: result.unavailableReason || "AWS Rekognition chưa khả dụng.",
      confidence: face.confidence,
      faceCount: 1
    };
  }

  if (result.rekognitionUnavailable) {
    return {
      verified: true,
      provider: "local-demo",
      collectionId: "local-demo",
      employeeId,
      matchedEmployeeId: employeeId,
      confidence: face.confidence,
      faceCount: 1,
      similarity: 100,
      faceId: `local-${employeeId}`,
      mode: "aws-not-configured",
      warning: result.unavailableReason
    };
  }

  if (result.missingCollection) {
    return {
      verified: false,
      reason: "Chưa có AWS Rekognition collection. Hãy đăng ký khuôn mặt trước.",
      confidence: face.confidence,
      faceCount: 1
    };
  }
  if (result.noFace || !result.FaceMatches?.length) {
    return {
      verified: false,
      reason: "Khuôn mặt chưa khớp với dữ liệu đã đăng ký.",
      confidence: face.confidence,
      faceCount: 1
    };
  }

  const match = result.FaceMatches[0];
  const matchedEmployeeId = match.Face?.ExternalImageId || null;
  const similarity = Number(match.Similarity || 0);

  if (matchedEmployeeId !== employeeId) {
    return {
      verified: false,
      reason: `Khuôn mặt khớp với ${matchedEmployeeId || "nhân viên khác"}, không phải ${employeeId}.`,
      confidence: face.confidence,
      faceCount: 1,
      matchedEmployeeId,
      similarity
    };
  }

  return {
    verified: true,
    provider: "aws-rekognition",
    collectionId: env.awsRekognitionCollectionId,
    employeeId,
    matchedEmployeeId,
    confidence: face.confidence,
    faceCount: 1,
    similarity,
    faceId: match.Face?.FaceId || null
  };
}

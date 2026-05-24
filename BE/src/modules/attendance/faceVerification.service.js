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

function validateBasicImage(imageBuffer) {
  return {
    valid: true,
    confidence: null,
    faceCount: 1,
    provider: "local-demo",
    mode: "aws-not-configured",
    reason: "AWS Rekognition chưa cấu hình. Hệ thống đang dùng chế độ demo sau khi chủ sở hữu đã duyệt Face ID."
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
      Attributes: ["DEFAULT"]
    }),
    "detect faces"
  );

  if (result.rekognitionUnavailable) {
    return validateBasicImage(imageBuffer);
  }

  const faces = result.FaceDetails || [];
  if (faces.length === 0 || result.noFace) {
    return { valid: false, reason: "Không tìm thấy khuôn mặt rõ trong ảnh.", faceCount: 0 };
  }
  if (faces.length > 1) {
    return { valid: false, reason: "Ảnh có nhiều hơn một khuôn mặt.", faceCount: faces.length };
  }

  const confidence = Number(faces[0].Confidence || 0);
  if (confidence < env.awsRekognitionFaceMinConfidence) {
    return {
      valid: false,
      reason: "Độ tin cậy khuôn mặt chưa đủ.",
      confidence,
      faceCount: 1
    };
  }

  return { valid: true, confidence, faceCount: 1 };
}

export async function validateFaceImage(image) {
  const imageBuffer = decodeImagePayload(image);
  return validateSingleFace(imageBuffer);
}

export async function validateFaceImageBuffer(imageBuffer) {
  return validateSingleFace(imageBuffer);
}

export async function indexEmployeeFaceBuffer(employeeId, imageBuffer) {
  const face = await validateSingleFace(imageBuffer);
  if (!face.valid) {
    return { enrolled: false, ...face };
  }

  const collection = await ensureCollection();
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

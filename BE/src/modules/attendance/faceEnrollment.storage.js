import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { httpError } from "../../shared/httpError.js";

const storageRoot = resolve(process.cwd(), "storage", "face-enrollments");

const mimeExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

export function decodeImageDataUrl(image) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i.exec(image || "");
  if (!match) {
    throw httpError(400, "Invalid image payload. Use a JPEG, PNG, or WebP data URL.");
  }

  const mimeType = match[1].toLowerCase();
  const normalized = match[2].replace(/\s/g, "");
  const buffer = Buffer.from(normalized, "base64");

  if (buffer.length < 1024) {
    throw httpError(400, "Image payload is too small");
  }
  if (buffer.length > 4 * 1024 * 1024) {
    throw httpError(413, "Image payload is too large");
  }

  return { buffer, mimeType };
}

export async function storeFaceEnrollmentImage(image) {
  const { buffer, mimeType } = decodeImageDataUrl(image);
  const extension = mimeExtensions[mimeType] || ".jpg";
  const key = `${randomUUID()}${extension}`;
  await mkdir(storageRoot, { recursive: true });
  await writeFile(resolve(storageRoot, key), buffer);
  return { key, mimeType, size: buffer.length };
}

export async function readFaceEnrollmentImage(key) {
  if (!key || extname(key) === "") {
    throw httpError(404, "Face image not found");
  }

  const path = resolve(storageRoot, key);
  if (!path.startsWith(storageRoot)) {
    throw httpError(400, "Invalid face image key");
  }

  try {
    return await readFile(path);
  } catch {
    throw httpError(404, "Face image not found");
  }
}

export const strongPasswordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const phonePattern = /^0?\d{9,10}$/;
export const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
export const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

export function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

export function isStrongPassword(value = "") {
  return strongPasswordPattern.test(value);
}

export function isVietnamPhone(value = "") {
  const phone = normalizePhone(value);
  return !phone || phonePattern.test(phone);
}

export function isIsoDate(value = "") {
  if (!isoDatePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isTime(value = "") {
  return timePattern.test(value);
}

export function compareIsoDates(a, b) {
  return new Date(`${a}T00:00:00.000Z`).getTime() - new Date(`${b}T00:00:00.000Z`).getTime();
}

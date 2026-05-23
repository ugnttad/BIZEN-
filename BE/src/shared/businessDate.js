import { env } from "../config/env.js";

function getDatePart(parts, type) {
  return parts.find((part) => part.type === type)?.value;
}

export function getBusinessDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: env.businessTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return `${getDatePart(parts, "year")}-${getDatePart(parts, "month")}-${getDatePart(parts, "day")}`;
}

export function getBusinessTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: env.businessTimeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  return `${getDatePart(parts, "hour")}:${getDatePart(parts, "minute")}`;
}

import dayjs from "dayjs";
import type { Locale } from "@/lib/i18n/dict";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrFormatterWithPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function rupees(paise: number): number {
  return paise / 100;
}

export function paise(rupees: number): number {
  return Math.round(rupees * 100);
}

// Node ICU and browser ICU sometimes emit different invisible spaces between
// the currency symbol and digits (U+00A0 vs U+202F). Normalize so SSR and
// hydration produce identical strings.
function normalizeSpaces(s: string): string {
  return s.replace(/[  ]/g, " ");
}

export function formatINR(amountPaise: number, opts: { showPaise?: boolean } = {}): string {
  const value = amountPaise / 100;
  const raw = opts.showPaise
    ? inrFormatterWithPaise.format(value)
    : inrFormatter.format(value);
  return normalizeSpaces(raw);
}

export function formatINRSigned(amountPaise: number): string {
  if (amountPaise === 0) return formatINR(0);
  const sign = amountPaise < 0 ? "−" : "";
  return `${sign}${formatINR(Math.abs(amountPaise))}`;
}

export function formatHours(hoursX2: number): string {
  const h = hoursX2 / 2;
  return `${h} hr${h === 1 ? "" : "s"}`;
}

// Dates stay in Western format ("26 Apr") in both locales per product decision.
export function formatDate(d: string | Date, fmt = "D MMM YYYY"): string {
  return dayjs(d).format(fmt);
}

// "Today" / "Yesterday" / weekday-name / "26 Apr" — translates strings only;
// numbers stay Western.
const TA_WEEKDAYS = ["ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி"];

export function formatRelative(d: string | Date, locale: Locale = "en"): string {
  const day = dayjs(d);
  const now = dayjs();
  if (day.isSame(now, "day")) return locale === "ta" ? "இன்று" : "Today";
  if (day.isSame(now.subtract(1, "day"), "day")) return locale === "ta" ? "நேற்று" : "Yesterday";
  if (day.isAfter(now.subtract(7, "day"))) {
    return locale === "ta" ? TA_WEEKDAYS[day.day()] : day.format("dddd");
  }
  return day.format("D MMM");
}

export function formatPhone(phone: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
}

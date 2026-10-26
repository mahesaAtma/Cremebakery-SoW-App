/** Date helpers. All dates are plain "YYYY-MM-DD" strings in Indonesia (WIB) time. */

export const TIMEZONE = "Asia/Jakarta";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const WEEKDAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/** Today's date in WIB as YYYY-MM-DD */
export function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Converts a timestamp to a YYYY-MM-DD date in WIB */
export function toDateStr(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function parse(s: string): { y: number; m: number; d: number } {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d: d ?? 1 };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function makeDate(y: number, m: number, d: number): string {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function addDays(s: string, n: number): string {
  const { y, m, d } = parse(s);
  return makeDate(y, m, d + n);
}

/** Whole days from a to b (b - a) */
export function diffDays(a: string, b: string): number {
  const pa = parse(a);
  const pb = parse(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(s: string): number {
  const { y, m, d } = parse(s);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function weekdayShort(s: string): string {
  return WEEKDAYS_SHORT[weekday(s)];
}

/** "YYYY-MM" for a date string */
export function monthKey(s: string): string {
  return s.slice(0, 7);
}

export function firstOfMonth(key: string): string {
  return `${key}-01`;
}

export function daysInMonth(key: string): number {
  const { y, m } = parse(`${key}-01`);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function lastOfMonth(key: string): string {
  return `${key}-${pad(daysInMonth(key))}`;
}

export function addMonths(key: string, n: number): string {
  const { y, m } = parse(`${key}-01`);
  return makeDate(y, m + n, 1).slice(0, 7);
}

/** Monday of the week containing s */
export function startOfWeek(s: string): string {
  const wd = weekday(s);
  return addDays(s, wd === 0 ? -6 : 1 - wd);
}

export function isValidMonthKey(k: string | undefined): k is string {
  return !!k && /^\d{4}-(0[1-9]|1[0-2])$/.test(k);
}

export function isValidDate(s: string | undefined | null): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const { y, m, d } = parse(s);
  return makeDate(y, m, d) === s;
}

/** "Oktober 2026" */
export function monthLabel(key: string): string {
  const { y, m } = parse(`${key}-01`);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "26 Okt 2026" */
export function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  const { y, m, d } = parse(s);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** "26 Okt" */
export function formatDateShort(s: string | null | undefined): string {
  if (!s) return "—";
  const { m, d } = parse(s);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

/** "14–30 Okt", "28 Okt – 3 Nov", "Mulai 14 Okt" */
export function formatRange(start: string | null, end: string | null): string {
  if (start && end) {
    if (start === end) return formatDateShort(start);
    const a = parse(start);
    const b = parse(end);
    if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MONTHS_SHORT[b.m - 1]}`;
    return `${formatDateShort(start)} – ${formatDateShort(end)}`;
  }
  if (start) return `Mulai ${formatDateShort(start)}`;
  if (end) return `Tenggat ${formatDateShort(end)}`;
  return "Tanpa tanggal";
}

/** "26 Okt 2026, 21.40" */
export function formatDateTime(d: Date): string {
  const date = formatDate(toDateStr(d));
  const time = new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${date}, ${time}`;
}

/** "2 hari lalu", "baru saja" */
export function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} hari lalu`;
  return formatDate(toDateStr(d));
}

/** Indonesian number with comma decimal: 38.5 → "38,5" */
export function formatHours(h: number | string): string {
  const n = typeof h === "string" ? Number(h) : h;
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);
}

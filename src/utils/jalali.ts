/**
 * Accurate mathematical Gregorian <-> Jalali calendar conversion
 * and Persian date formatting utilities.
 */

export const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

export const PERSIAN_WEEKDAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه'
];

/**
 * Converts English digits to Persian digits
 */
export function toPersianDigits(input: number | string): string {
  if (input === undefined || input === null) return '';
  return input
    .toString()
    .replace(/[0-9]/g, (w) => PERSIAN_DIGITS[parseInt(w, 10)]);
}

/**
 * Converts Persian/Arabic digits to English digits
 */
export function toEnglishDigits(input: string): string {
  if (!input) return '';
  return input
    .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
    .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString());
}

/**
 * Gregorian to Jalali conversion
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm =
    days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

/**
 * Jalali to Gregorian conversion
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let sal_a: number;
  let gy: number;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][1];
  let gm = 0;
  let gd = 0;
  const g_d_m = [
    0,
    31,
    ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];
  for (gm = 0; gm < 13; gm++) {
    const v = g_d_m[gm];
    if (days <= v) {
      gd = days;
      break;
    }
    days -= v;
  }
  return { gy, gm, gd: gd === 0 ? 1 : gd };
}

/**
 * Returns today's Jalali date components
 */
export function getTodayJalali(): {
  jy: number;
  jm: number;
  jd: number;
  dayOfWeek: number; // 0 = Saturday, ..., 6 = Friday
  dayName: string;
  monthName: string;
  formatted: string;     // e.g. "1405/08/17"
  humanReadable: string; // e.g. "شنبه ۱۷ آبان ۱۴۰۵"
} {
  const now = new Date();
  const gy = now.getFullYear();
  const gm = now.getMonth() + 1;
  const gd = now.getDate();
  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);

  // JavaScript getDay(): 0 is Sunday, 6 is Saturday
  // Persian week: Saturday is index 0
  const jsDay = now.getDay();
  const persianWeekDayIndex = (jsDay + 1) % 7;

  const dayName = PERSIAN_WEEKDAYS[persianWeekDayIndex];
  const monthName = PERSIAN_MONTH_NAMES[jm - 1];
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatted = `${jy}/${pad(jm)}/${pad(jd)}`;
  const humanReadable = `${dayName} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;

  return {
    jy,
    jm,
    jd,
    dayOfWeek: persianWeekDayIndex,
    dayName,
    monthName,
    formatted,
    humanReadable
  };
}

/**
 * Formats a Date object to Jalali formatted string: "YYYY/MM/DD"
 */
export function dateToJalaliString(date: Date): string {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

/**
 * Adds days to a Jalali formatted date string (YYYY/MM/DD)
 */
export function addDaysToJalali(jalaliStr: string, daysToAdd: number): string {
  const parts = jalaliStr.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
  if (parts.length !== 3) return jalaliStr;
  const [jy, jm, jd] = parts;
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const d = new Date(gy, gm - 1, gd);
  d.setDate(d.getDate() + daysToAdd);
  return dateToJalaliString(d);
}

/**
 * Returns human-readable Persian date string for a Jalali "YYYY/MM/DD"
 */
export function formatJalaliHuman(jalaliStr: string): string {
  if (!jalaliStr) return '';
  const parts = jalaliStr.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
  if (parts.length !== 3) return jalaliStr;
  const [jy, jm, jd] = parts;
  const monthName = PERSIAN_MONTH_NAMES[jm - 1] || '';
  
  // Also calculate weekday
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const d = new Date(gy, gm - 1, gd);
  const persianWeekDayIndex = (d.getDay() + 1) % 7;
  const dayName = PERSIAN_WEEKDAYS[persianWeekDayIndex];

  return `${dayName} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

/**
 * Checks if a Jalali year is leap
 */
export function isJalaliLeapYear(jy: number): boolean {
  const r = (jy - (jy > 0 ? 474 : 473)) % 2820;
  return ((r + 474 + 38) * 682) % 2816 < 682;
}

/**
 * Returns number of days in a Jalali month
 */
export function getDaysInJalaliMonth(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) return isJalaliLeapYear(jy) ? 30 : 29;
  return 30;
}

/**
 * Generates calendar grid for a specific Jalali year and month
 */
export function generateJalaliMonthGrid(jy: number, jm: number): {
  days: Array<{
    dayNumber: number;
    jalaliDateStr: string;
    isCurrentMonth: boolean;
    dayOfWeek: number;
  }>;
  monthName: string;
  year: number;
} {
  const daysInMonth = getDaysInJalaliMonth(jy, jm);
  
  // Find first day of this Jalali month's weekday
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, 1);
  const firstDate = new Date(gy, gm - 1, gd);
  const startDayOfWeek = (firstDate.getDay() + 1) % 7; // 0 = Sat, ..., 6 = Fri

  const days: Array<{
    dayNumber: number;
    jalaliDateStr: string;
    isCurrentMonth: boolean;
    dayOfWeek: number;
  }> = [];

  // Padding days from previous month
  const prevMonth = jm === 1 ? 12 : jm - 1;
  const prevYear = jm === 1 ? jy - 1 : jy;
  const daysInPrevMonth = getDaysInJalaliMonth(prevYear, prevMonth);

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    days.push({
      dayNumber: dayNum,
      jalaliDateStr: `${prevYear}/${pad(prevMonth)}/${pad(dayNum)}`,
      isCurrentMonth: false,
      dayOfWeek: (startDayOfWeek - 1 - i) % 7
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const dow = (startDayOfWeek + d - 1) % 7;
    days.push({
      dayNumber: d,
      jalaliDateStr: `${jy}/${pad(jm)}/${pad(d)}`,
      isCurrentMonth: true,
      dayOfWeek: dow
    });
  }

  // Fill up remaining days of the last week (to complete 35 or 42 cells)
  const remainingCells = (7 - (days.length % 7)) % 7;
  const nextMonth = jm === 12 ? 1 : jm + 1;
  const nextYear = jm === 12 ? jy + 1 : jy;
  for (let d = 1; d <= remainingCells; d++) {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    days.push({
      dayNumber: d,
      jalaliDateStr: `${nextYear}/${pad(nextMonth)}/${pad(d)}`,
      isCurrentMonth: false,
      dayOfWeek: (days.length) % 7
    });
  }

  return {
    days,
    monthName: PERSIAN_MONTH_NAMES[jm - 1],
    year: jy
  };
}

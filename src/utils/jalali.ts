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

import * as jalaali from 'jalaali-js';

/**
 * Gregorian to Jalali conversion
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  return jalaali.toJalaali(gy, gm, gd);
}

/**
 * Jalali to Gregorian conversion
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return jalaali.toGregorian(jy, jm, jd);
}

export interface PersianDayDefinition {
  dayNumber: number;     // 1 to 7
  dowIndex: number;      // 0 to 6 (0 = شنبه, ..., 6 = جمعه)
  name: string;          // "شنبه"
  ordinalName: string;   // "روز اول"
}

export const PERSIAN_DAY_DEFINITIONS: PersianDayDefinition[] = [
  { dayNumber: 1, dowIndex: 0, name: 'شنبه', ordinalName: 'روز اول' },
  { dayNumber: 2, dowIndex: 1, name: 'یکشنبه', ordinalName: 'روز دوم' },
  { dayNumber: 3, dowIndex: 2, name: 'دوشنبه', ordinalName: 'روز سوم' },
  { dayNumber: 4, dowIndex: 3, name: 'سه‌شنبه', ordinalName: 'روز چهارم' },
  { dayNumber: 5, dowIndex: 4, name: 'چهارشنبه', ordinalName: 'روز پنجم' },
  { dayNumber: 6, dowIndex: 5, name: 'پنجشنبه', ordinalName: 'روز ششم' },
  { dayNumber: 7, dowIndex: 6, name: 'جمعه', ordinalName: 'روز هفتم' }
];

export interface ActiveJalaliDate {
  jy: number;
  jm: number;
  jd: number;
  dayOfWeek: number;     // 0 = Saturday, ..., 6 = Friday
  dayNumber: number;     // 1 = شنبه, 2 = یکشنبه, ..., 7 = جمعه
  dayName: string;       // "شنبه"
  dayOrdinalName: string;// "روز اول"
  monthName: string;     // "آبان"
  formatted: string;     // "1405/08/17"
  humanReadable: string; // "شنبه ۱۷ آبان ۱۴۰۵"
  activeTime: string;    // "09:14"
  isCustom: boolean;
}

/**
 * Returns today's Jalali date components from system clock
 */
export function getTodayJalali(): ActiveJalaliDate {
  const now = new Date();
  const gy = now.getFullYear();
  const gm = now.getMonth() + 1;
  const gd = now.getDate();
  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);

  const jsDay = now.getDay();
  const persianWeekDayIndex = (jsDay + 1) % 7; // 0 = شنبه, ..., 6 = جمعه
  const dayNumber = persianWeekDayIndex + 1;    // 1 = شنبه, ..., 7 = جمعه

  const dayDef = PERSIAN_DAY_DEFINITIONS[persianWeekDayIndex];
  const monthName = PERSIAN_MONTH_NAMES[jm - 1];
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatted = `${jy}/${pad(jm)}/${pad(jd)}`;
  const humanReadable = `${dayDef.name} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;

  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');

  return {
    jy,
    jm,
    jd,
    dayOfWeek: persianWeekDayIndex,
    dayNumber,
    dayName: dayDef.name,
    dayOrdinalName: dayDef.ordinalName,
    monthName,
    formatted,
    humanReadable,
    activeTime: `${h}:${m}`,
    isCustom: false
  };
}

/**
 * Returns effective app Jalali date:
 * If user enabled custom app date/time in settings, uses that.
 * Otherwise defaults to system today.
 */
export function getAppActiveJalali(settings?: {
  useCustomAppDateTime?: boolean;
  customAppDate?: string;
  customAppTime?: string;
}): ActiveJalaliDate {
  if (settings?.useCustomAppDateTime && settings?.customAppDate) {
    const parts = settings.customAppDate.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
    if (parts.length === 3) {
      const [jy, jm, jd] = parts;
      const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
      const d = new Date(Date.UTC(gy, gm - 1, gd, 12, 0, 0));
      const persianWeekDayIndex = (d.getUTCDay() + 1) % 7;
      const dayNumber = persianWeekDayIndex + 1;
      const dayDef = PERSIAN_DAY_DEFINITIONS[persianWeekDayIndex];
      const monthName = PERSIAN_MONTH_NAMES[jm - 1] || '';
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const formatted = `${jy}/${pad(jm)}/${pad(jd)}`;
      const humanReadable = `${dayDef.name} (${dayDef.ordinalName}) ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;

      return {
        jy,
        jm,
        jd,
        dayOfWeek: persianWeekDayIndex,
        dayNumber,
        dayName: dayDef.name,
        dayOrdinalName: dayDef.ordinalName,
        monthName,
        formatted,
        humanReadable,
        activeTime: settings.customAppTime || '09:00',
        isCustom: true
      };
    }
  }

  return getTodayJalali();
}

export interface WeekDayWithDate {
  dayNumber: number;      // 1 to 7
  dowIndex: number;       // 0 to 6
  name: string;           // "شنبه"
  ordinalName: string;    // "روز اول"
  jalaliDate: string;     // "1405/08/17"
  dayOfMonth: number;     // 17
  monthName: string;      // "آبان"
  shortLabel: string;     // "۱۷ آبان"
  fullLabel: string;      // "شنبه (روز ۱) · ۱۷ آبان"
  isToday: boolean;
}

/**
 * Returns all 7 days of the current week (شنبه تا جمعه) with both day names and exact computed dates
 */
export function getWeekDaysWithDates(baseDate: ActiveJalaliDate): WeekDayWithDate[] {
  return PERSIAN_DAY_DEFINITIONS.map((def) => {
    const offset = def.dowIndex - baseDate.dayOfWeek;
    const targetJalali = addDaysToJalali(baseDate.formatted, offset);
    const parts = targetJalali.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
    const jd = parts[2] || 1;
    const jm = parts[1] || 1;
    const monthName = PERSIAN_MONTH_NAMES[jm - 1] || '';
    const shortLabel = `${toPersianDigits(jd)} ${monthName}`;
    const fullLabel = `${def.name} (روز ${toPersianDigits(def.dayNumber)}) · ${shortLabel}`;

    return {
      dayNumber: def.dayNumber,
      dowIndex: def.dowIndex,
      name: def.name,
      ordinalName: def.ordinalName,
      jalaliDate: targetJalali,
      dayOfMonth: jd,
      monthName,
      shortLabel,
      fullLabel,
      isToday: targetJalali === baseDate.formatted
    };
  });
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
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  const d = new Date(Date.UTC(gy, gm - 1, gd + daysToAdd, 12, 0, 0));
  const res = jalaali.toJalaali(d);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${res.jy}/${pad(res.jm)}/${pad(res.jd)}`;
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
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  const d = new Date(Date.UTC(gy, gm - 1, gd, 12, 0, 0));
  const persianWeekDayIndex = (d.getUTCDay() + 1) % 7;
  const dayName = PERSIAN_WEEKDAYS[persianWeekDayIndex];

  return `${dayName} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

/**
 * Checks if a Jalali year is leap
 */
export function isJalaliLeapYear(jy: number): boolean {
  return jalaali.isLeapJalaaliYear(jy);
}

/**
 * Returns number of days in a Jalali month
 */
export function getDaysInJalaliMonth(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
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
  const firstDate = new Date(Date.UTC(gy, gm - 1, gd, 12, 0, 0));
  const startDayOfWeek = (firstDate.getUTCDay() + 1) % 7; // 0 = Sat, ..., 6 = Fri

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

import { ParsedVoiceResult, Priority, RecurrenceType } from '../types';
import { 
  addDaysToJalali, 
  getTodayJalali, 
  toEnglishDigits, 
  toPersianDigits,
  ActiveJalaliDate, 
  PERSIAN_DAY_DEFINITIONS,
  PERSIAN_MONTH_NAMES
} from './jalali';

interface PersianWordMapping {
  keywords: string[];
  category: string;
}

const CATEGORY_RULES: PersianWordMapping[] = [
  {
    category: 'امور قرآنی و فرهنگی',
    keywords: [
      'قرآن', 'مسابقات قرآن', 'حفظ', 'تلاوت', 'مسجد', 'هیئت', 'فرهنگی', 'کتابخوانی',
      'نماز', 'نهج‌البلاغه', 'صحیفه', 'مذهبی', 'جلسه قرآنی'
    ]
  },
  {
    category: 'امور اداری',
    keywords: [
      'اداره', 'اداری', 'مدیر', 'مدرسه', 'نامه', 'قرارداد', 'فرم', 'کارگزینی',
      'بیمه', 'شهرداری', 'مالیات', 'رئیس', 'همکار', 'جلسه کاری', 'دبیرخانه',
      'استعلام', 'پروژه'
    ]
  },
  {
    category: 'یادگیری و آموزش',
    keywords: [
      'یادگیری', 'هوش مصنوعی', 'کلاس', 'درس', 'کتاب', 'آموزش', 'مطالعه', 'تحقیق',
      'پروژه دانشگاه', 'کورس', 'برنامه‌نویسی', 'زبان انگلیسی', 'تکلیف', 'امتحان'
    ]
  },
  {
    category: 'ورزش و سلامتی',
    keywords: [
      'ورزش', 'دویدن', 'پیاده‌روی', 'باشگاه', 'شنا', 'نرمش', 'سلامتی', 'دکتر',
      'پزشک', 'دندانپزشک', 'دارو', 'آزمایش', 'چکاپ', 'تغذیه'
    ]
  },
  {
    category: 'مالی و سرمایه‌گذاری',
    keywords: [
      'بانک', 'قسط', 'وام', 'حساب', 'واریز', 'چک', 'پول', 'بورس', 'طلا',
      'اجاره', 'قبض', 'خرید عمده', 'فاکتور', 'کارت به کارت', 'حسابداری'
    ]
  },
  {
    category: 'خانواده',
    keywords: [
      'خانواده', 'همسر', 'بچه', 'فرزند', 'مادر', 'پدر', 'خواهر', 'برادر',
      'مهمانی', 'دیدار', 'خرید خانه', 'تعمیرات خانه', 'مسافرت خانوادگی'
    ]
  },
  {
    category: 'امور شخصی',
    keywords: [
      'آرایشگاه', 'لباس', 'تعمیر ماشین', 'شخصی', 'نظافت', 'استراحت',
      'برنامه‌ریزی شخصی', 'خرید شخصی'
    ]
  }
];

/**
 * جدول هوشمند تطبیق روزهای هفته و شماره روزها (درخواست صریح کاربر):
 * شنبه = روز اول (1)
 * یکشنبه = روز دوم (2)
 * دوشنبه = روز سوم (3)
 * سه‌شنبه = روز چهارم (4)
 * چهارشنبه = روز پنجم (5)
 * پنجشنبه = روز ششم (6)
 * جمعه = روز هفتم (7)
 */
interface DayMappingRule {
  patterns: string[];
  dayNumber: number; // 1 to 7
  dowIndex: number;  // 0 to 6 (0 = شنبه)
  standardName: string;
  ordinalName: string;
}

export const DAY_NUMBER_MAPPING_RULES: DayMappingRule[] = [
  {
    patterns: ['شنبه', 'روز اول', 'روز ۱', 'روز 1', 'روز یکم'],
    dayNumber: 1,
    dowIndex: 0,
    standardName: 'شنبه',
    ordinalName: 'روز اول'
  },
  {
    patterns: ['یکشنبه', 'یک شنبه', 'روز دوم', 'روز ۲', 'روز 2'],
    dayNumber: 2,
    dowIndex: 1,
    standardName: 'یکشنبه',
    ordinalName: 'روز دوم'
  },
  {
    patterns: ['دوشنبه', 'دو شنبه', 'روز سوم', 'روز ۳', 'روز 3'],
    dayNumber: 3,
    dowIndex: 2,
    standardName: 'دوشنبه',
    ordinalName: 'روز سوم'
  },
  {
    patterns: ['سه‌شنبه', 'سه شنبه', 'روز چهارم', 'روز ۴', 'روز 4'],
    dayNumber: 4,
    dowIndex: 3,
    standardName: 'سه‌شنبه',
    ordinalName: 'روز چهارم'
  },
  {
    patterns: ['چهارشنبه', 'چهار شنبه', 'روز پنجم', 'روز ۵', 'روز 5'],
    dayNumber: 5,
    dowIndex: 4,
    standardName: 'چهارشنبه',
    ordinalName: 'روز پنجم'
  },
  {
    patterns: ['پنجشنبه', 'پنج شنبه', 'روز ششم', 'روز ۶', 'روز 6'],
    dayNumber: 6,
    dowIndex: 5,
    standardName: 'پنجشنبه',
    ordinalName: 'روز ششم'
  },
  {
    patterns: ['جمعه', 'روز هفتم', 'روز ۷', 'روز 7'],
    dayNumber: 7,
    dowIndex: 6,
    standardName: 'جمعه',
    ordinalName: 'روز هفتم'
  }
];

/**
 * استخراج زمان از گفتار فارسی: e.g. "ساعت ۹", "ساعت ۱۰:۳۰", "ساعت ۷ صبح", "۴ عصر"
 */
function extractTime(text: string): { time?: string; isFixed: boolean; matchedSnippet?: string } {
  const norm = toEnglishDigits(text);

  // Pattern: ساعت HH:mm or ساعت HH
  const timeRegex1 = /ساعت\s*([0-2]?[0-9])(?::([0-5][0-9]))?(?:\s*(صبح|عصر|بعد از ظهر|شب))?/i;
  const match1 = norm.match(timeRegex1);

  if (match1) {
    let hour = parseInt(match1[1], 10);
    const minute = match1[2] ? parseInt(match1[2], 10) : 0;
    const period = match1[3];

    if (period && (period.includes('عصر') || period.includes('بعد از ظهر') || period.includes('شب'))) {
      if (hour < 12) hour += 12;
    } else if (period && period.includes('صبح')) {
      if (hour === 12) hour = 0;
    }

    const hStr = hour < 10 ? `0${hour}` : `${hour}`;
    const mStr = minute < 10 ? `0${minute}` : `${minute}`;
    return { time: `${hStr}:${mStr}`, isFixed: true, matchedSnippet: match1[0] };
  }

  // Pattern: "ساعت ده و نیم" or "ساعت نه"
  const wordTimeMap: { [w: string]: number } = {
    'یک': 1, 'دو': 2, 'سه': 3, 'چهار': 4, 'پنج': 5,
    'شش': 6, 'هفت': 7, 'هشت': 8, 'نه': 9, 'ده': 10,
    'یازده': 11, 'دوازده': 12
  };

  for (const [word, val] of Object.entries(wordTimeMap)) {
    if (text.includes(`ساعت ${word} و نیم`)) {
      const isPm = text.includes('عصر') || text.includes('شب');
      const h = isPm && val < 12 ? val + 12 : val;
      const hStr = h < 10 ? `0${h}` : `${h}`;
      return { time: `${hStr}:30`, isFixed: true, matchedSnippet: `ساعت ${word} و نیم` };
    }
    if (text.includes(`ساعت ${word}`)) {
      const isPm = text.includes('عصر') || text.includes('شب');
      const h = isPm && val < 12 ? val + 12 : val;
      const hStr = h < 10 ? `0${h}` : `${h}`;
      return { time: `${hStr}:00`, isFixed: true, matchedSnippet: `ساعت ${word}` };
    }
  }

  // Generic time of day
  if (text.includes('صبح')) {
    return { time: '09:00', isFixed: false, matchedSnippet: 'صبح' };
  }
  if (text.includes('ظهر')) {
    return { time: '13:00', isFixed: false, matchedSnippet: 'ظهر' };
  }
  if (text.includes('عصر') || text.includes('بعد از ظهر')) {
    return { time: '17:00', isFixed: false, matchedSnippet: 'عصر' };
  }
  if (text.includes('شب')) {
    return { time: '20:00', isFixed: false, matchedSnippet: 'شب' };
  }

  return { time: undefined, isFixed: false };
}

/**
 * استخراج مدت‌زمان
 */
function extractDuration(text: string): { durationMinutes: number; matchedSnippet?: string } {
  const norm = toEnglishDigits(text);

  if (norm.includes('دو ساعت') || norm.includes('2 ساعت')) {
    return { durationMinutes: 120, matchedSnippet: 'دو ساعت' };
  }
  if (norm.includes('سه ساعت') || norm.includes('3 ساعت')) {
    return { durationMinutes: 180, matchedSnippet: 'سه ساعت' };
  }
  if (norm.includes('یک ساعت و نیم') || norm.includes('1 ساعت و نیم') || norm.includes('یک ساعت و ۳۰ دقیقه')) {
    return { durationMinutes: 90, matchedSnippet: 'یک ساعت و نیم' };
  }
  if (norm.includes('یک ساعت') || norm.includes('1 ساعت')) {
    return { durationMinutes: 60, matchedSnippet: 'یک ساعت' };
  }
  if (norm.includes('نیم ساعت')) {
    return { durationMinutes: 30, matchedSnippet: 'نیم ساعت' };
  }
  if (norm.includes('۴۵ دقیقه') || norm.includes('45 دقیقه')) {
    return { durationMinutes: 45, matchedSnippet: '۴۵ دقیقه' };
  }
  if (norm.includes('۲۰ دقیقه') || norm.includes('20 دقیقه')) {
    return { durationMinutes: 20, matchedSnippet: '۲۰ دقیقه' };
  }
  if (norm.includes('۱۵ دقیقه') || norm.includes('15 دقیقه') || norm.includes('یک ربع')) {
    return { durationMinutes: 15, matchedSnippet: '۱۵ دقیقه' };
  }

  const minMatch = norm.match(/([0-9]+)\s*دقیقه/);
  if (minMatch) {
    return { durationMinutes: parseInt(minMatch[1], 10), matchedSnippet: minMatch[0] };
  }

  const hrMatch = norm.match(/([0-9]+)\s*ساعت/);
  if (hrMatch) {
    return { durationMinutes: parseInt(hrMatch[1], 10) * 60, matchedSnippet: hrMatch[0] };
  }

  return { durationMinutes: 30 };
}

/**
 * استخراج هوشمند تاریخ، تکرار و شماره روزهای هفته (بر اساس تاریخ فعال نرم‌افزار)
 */
function extractDateAndRecurrence(
  text: string, 
  baseDate: ActiveJalaliDate
): {
  dueDate: string;
  recurrence: RecurrenceType;
  finalDeadline?: string;
  matchedSnippet?: string;
  hasExplicitDate: boolean;
  matchedDayNumber?: number;
  matchedDayName?: string;
} {
  const currentDow = baseDate.dayOfWeek; // 0 = Sat (Day 1) ... 6 = Fri (Day 7)
  const norm = toEnglishDigits(text);

  // 1. Recurrence
  if (text.includes('هر روز') || text.includes('روزانه')) {
    return {
      dueDate: baseDate.formatted,
      recurrence: 'daily',
      matchedSnippet: 'هر روز',
      hasExplicitDate: true,
      matchedDayNumber: baseDate.dayNumber,
      matchedDayName: `${baseDate.dayName} (روز ${baseDate.dayNumber})`
    };
  }
  if (text.includes('هر هفته') || text.includes('هفتگی')) {
    return {
      dueDate: baseDate.formatted,
      recurrence: 'weekly',
      matchedSnippet: 'هر هفته',
      hasExplicitDate: true
    };
  }
  if (text.includes('هر ماه') || text.includes('ماهانه')) {
    return {
      dueDate: baseDate.formatted,
      recurrence: 'monthly',
      matchedSnippet: 'هر ماه',
      hasExplicitDate: true
    };
  }

  // 2. Deadlines: "تا آخر هفته", "تا پایان هفته"
  if (text.includes('تا آخر هفته') || text.includes('تا پایان هفته')) {
    const daysUntilThursday = (5 - currentDow + 7) % 7;
    const deadline = addDaysToJalali(baseDate.formatted, daysUntilThursday === 0 ? 7 : daysUntilThursday);
    return {
      dueDate: deadline,
      finalDeadline: deadline,
      recurrence: 'none',
      matchedSnippet: 'تا آخر هفته',
      hasExplicitDate: true,
      matchedDayNumber: 6, // پنجشنبه = روز ششم
      matchedDayName: 'پنجشنبه (روز ششم - آخر هفته)'
    };
  }

  // 3. "پس‌فردا"
  if (text.includes('پس‌فردا') || text.includes('پس فردا')) {
    const targetDate = addDaysToJalali(baseDate.formatted, 2);
    const nextDayNum = ((baseDate.dayNumber + 1) % 7) + 1;
    const dayDef = PERSIAN_DAY_DEFINITIONS[nextDayNum - 1];
    return {
      dueDate: targetDate,
      recurrence: 'none',
      matchedSnippet: text.includes('پس‌فردا') ? 'پس‌فردا' : 'پس فردا',
      hasExplicitDate: true,
      matchedDayNumber: nextDayNum,
      matchedDayName: `${dayDef.name} (${dayDef.ordinalName})`
    };
  }

  // 4. "فردا"
  if (text.includes('فردا')) {
    const targetDate = addDaysToJalali(baseDate.formatted, 1);
    const nextDayNum = (baseDate.dayNumber % 7) + 1;
    const dayDef = PERSIAN_DAY_DEFINITIONS[nextDayNum - 1];
    return {
      dueDate: targetDate,
      recurrence: 'none',
      matchedSnippet: 'فردا',
      hasExplicitDate: true,
      matchedDayNumber: nextDayNum,
      matchedDayName: `${dayDef.name} (${dayDef.ordinalName})`
    };
  }

  // 5. "امروز"
  if (text.includes('امروز')) {
    return {
      dueDate: baseDate.formatted,
      recurrence: 'none',
      matchedSnippet: 'امروز',
      hasExplicitDate: true,
      matchedDayNumber: baseDate.dayNumber,
      matchedDayName: `${baseDate.dayName} (${baseDate.dayOrdinalName})`
    };
  }

  // 6. "هفته آینده"
  if (text.includes('هفته آینده') || text.includes('هفته دیگه')) {
    return {
      dueDate: addDaysToJalali(baseDate.formatted, 7),
      recurrence: 'none',
      matchedSnippet: 'هفته آینده',
      hasExplicitDate: true,
      matchedDayNumber: baseDate.dayNumber,
      matchedDayName: `${baseDate.dayName} (هفته آینده)`
    };
  }

  // 7. "ماه آینده"
  if (text.includes('ماه آینده') || text.includes('ماه بعد')) {
    return {
      dueDate: addDaysToJalali(baseDate.formatted, 30),
      recurrence: 'none',
      matchedSnippet: 'ماه آینده',
      hasExplicitDate: true
    };
  }

  // 8. هوشمندتر شدن شناسایی روزها با نگاشت عدد ۱ تا ۷:
  // شنبه = روز اول (1) ... جمعه = روز هفتم (7)
  // نرمال‌سازی نیم‌فاصله‌ها
  const cleanNorm = norm.replace(/\u200c/g, ' ').replace(/\s+/g, ' ');

  for (const rule of DAY_NUMBER_MAPPING_RULES) {
    for (const pat of rule.patterns) {
      const cleanPat = pat.replace(/\u200c/g, ' ').replace(/\s+/g, ' ');
      if (cleanNorm.includes(cleanPat) || text.includes(pat) || cleanNorm.includes(`روز ${cleanPat}`)) {
        const targetDow = rule.dowIndex; // 0 for شنبه (روز اول) ... 6 for جمعه (روز هفتم)
        let daysAhead = (targetDow - currentDow + 7) % 7;

        // فقط در صورتی که کاربر صریحاً بگوید "آینده" یا "هفته بعد" به هفته بعد منتقل می‌شود
        if (cleanNorm.includes(`${cleanPat} اینده`) || cleanNorm.includes(`${cleanPat} بعد`) || cleanNorm.includes('هفته بعد') || cleanNorm.includes('هفته دیگه')) {
          daysAhead += 7;
        }

        const targetDate = addDaysToJalali(baseDate.formatted, daysAhead);
        const parts = targetDate.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
        const dayOfMonth = parts[2] || 1;
        const monthIndex = (parts[1] || 1) - 1;
        const monthName = PERSIAN_MONTH_NAMES[monthIndex] || '';

        return {
          dueDate: targetDate,
          recurrence: 'none',
          matchedSnippet: pat,
          hasExplicitDate: true,
          matchedDayNumber: rule.dayNumber,
          matchedDayName: `${rule.standardName} (روز ${toPersianDigits(rule.dayNumber)}) · ${toPersianDigits(dayOfMonth)} ${monthName}`
        };
      }
    }
  }

  // پیش‌فرض: تاریخ جاری نرم‌افزار
  const defaultParts = baseDate.formatted.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
  const defaultDay = defaultParts[2] || 1;
  const defaultMonth = (defaultParts[1] || 1) - 1;
  return {
    dueDate: baseDate.formatted,
    recurrence: 'none',
    hasExplicitDate: false,
    matchedDayNumber: baseDate.dayNumber,
    matchedDayName: `${baseDate.dayName} (روز ${toPersianDigits(baseDate.dayNumber)}) · ${toPersianDigits(defaultDay)} ${PERSIAN_MONTH_NAMES[defaultMonth] || ''}`
  };
}

/**
 * استخراج اولویت
 */
function extractPriority(text: string): { priority: Priority; matchedSnippet?: string } {
  if (text.includes('فوری') || text.includes('خیلی مهم') || text.includes('اورژانسی') || text.includes('حتماً')) {
    return { priority: 'urgent', matchedSnippet: 'فوری' };
  }
  if (text.includes('مهم') || text.includes('اولویت بالا')) {
    return { priority: 'high', matchedSnippet: 'مهم' };
  }
  if (text.includes('اولویت کم') || text.includes('هر وقت شد') || text.includes('عجله‌ای نیست')) {
    return { priority: 'low', matchedSnippet: 'اولویت کم' };
  }
  return { priority: 'medium' };
}

/**
 * دسته‌بندی بر اساس کلیدواژه‌ها
 */
function extractCategory(text: string): string {
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        return rule.category;
      }
    }
  }
  return 'امور شخصی';
}

/**
 * پاک‌سازی عنوان وظیفه از عبارات زمانی و افعال اضافی
 */
function cleanPersianTaskTitle(text: string, snippetsToRemove: string[]): string {
  let title = text;

  for (const snip of snippetsToRemove) {
    if (snip && snip.length > 1) {
      title = title.replace(snip, ' ');
    }
  }

  // حذف نام روزها و عبارات روز اول تا هفتم
  for (const rule of DAY_NUMBER_MAPPING_RULES) {
    for (const pat of rule.patterns) {
      title = title.replace(new RegExp(`\\\\b${pat}\\\\b`, 'g'), ' ');
      title = title.replace(pat, ' ');
    }
  }

  title = title
    .replace(/(?:باید|می‌خواهم|میخوام|قرار است|یادم باشد|یادم باشه)\s*/g, '')
    .replace(/\s*(?:بگیرم|کنم|بگذارم|وقت بگذارم|ارسال کنم|آماده کنم|بروم|برم|انجام دهم|انجام بدم|داشته باشم|بخرم|بزنم)\.?$/g, '')
    .replace(/^(?:که|برای|تا)\s*/g, '')
    .trim();

  title = title.replace(/\s+/g, ' ').trim();

  if (!title) {
    title = text.trim();
  }

  return title;
}

/**
 * موتور اصلی تحلیل فرمان صوتی فارسی
 * با پشتیبانی از تاریخ فعال نرم‌افزار (عدم وابستگی اجباری به تاریخ سیستم)
 */
export function parsePersianVoiceCommand(
  rawSpeech: string, 
  baseDate?: ActiveJalaliDate
): ParsedVoiceResult {
  const activeDate = baseDate || getTodayJalali();
  const trimmed = rawSpeech.trim();
  const snippetsToRemove: string[] = [];

  // 1. Time
  const timeResult = extractTime(trimmed);
  if (timeResult.matchedSnippet) snippetsToRemove.push(timeResult.matchedSnippet);

  // 2. Date & Day Number (روز اول تا روز هفتم)
  const dateResult = extractDateAndRecurrence(trimmed, activeDate);
  if (dateResult.matchedSnippet) snippetsToRemove.push(dateResult.matchedSnippet);

  // 3. Duration
  const durResult = extractDuration(trimmed);
  if (durResult.matchedSnippet) snippetsToRemove.push(durResult.matchedSnippet);

  // 4. Priority
  const prioResult = extractPriority(trimmed);
  if (prioResult.matchedSnippet) snippetsToRemove.push(prioResult.matchedSnippet);

  // 5. Category
  const category = extractCategory(trimmed);

  // 6. Clean Title
  const cleanTitle = cleanPersianTaskTitle(trimmed, snippetsToRemove);

  // 7. Ambiguity check
  let needsClarification = false;
  let clarificationQuestion: string | undefined = undefined;

  if (!dateResult.hasExplicitDate && !timeResult.isFixed) {
    needsClarification = true;
    clarificationQuestion = `تاریخ یا ساعت مشخصی برای این وظیفه ذکر نشد. آیا برای ${activeDate.dayName} (${activeDate.dayOrdinalName}) ثبت شود؟`;
  } else if (!timeResult.isFixed && (trimmed.includes('تماس') || trimmed.includes('جلسه') || trimmed.includes('دیدار'))) {
    needsClarification = true;
    clarificationQuestion = 'این کار نیاز به ساعت دقیق دارد. مایلید در چه ساعتی تنظیم شود؟';
  }

  return {
    rawText: trimmed,
    cleanTitle,
    category,
    dueDate: dateResult.dueDate,
    dueTime: timeResult.time,
    durationMinutes: durResult.durationMinutes,
    priority: prioResult.priority,
    recurrence: dateResult.recurrence,
    finalDeadline: dateResult.finalDeadline,
    isTimeFixed: timeResult.isFixed,
    confidence: dateResult.hasExplicitDate || timeResult.isFixed ? 0.95 : 0.82,
    needsClarification,
    clarificationQuestion,
    matchedDayNumber: dateResult.matchedDayNumber,
    matchedDayName: dateResult.matchedDayName
  };
}

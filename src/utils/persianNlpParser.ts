import { ParsedVoiceResult, Priority, RecurrenceType } from '../types';
import { addDaysToJalali, getTodayJalali, toEnglishDigits } from './jalali';

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

const WEEKDAY_NAMES_MAP: { [key: string]: number } = {
  'شنبه': 0,
  'یکشنبه': 1,
  'دوشنبه': 2,
  'سه‌شنبه': 3,
  'سه شنبه': 3,
  'چهارشنبه': 4,
  'پنجشنبه': 5,
  'پنج شنبه': 5,
  'جمعه': 6
};

/**
 * Extracts Persian time pattern e.g. "ساعت ۹", "ساعت ۱۰:۳۰", "ساعت ۷ صبح", "۴ عصر"
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
 * Extracts Persian duration e.g. "دو ساعت", "نیم ساعت", "۳۰ دقیقه", "۱ ساعت و نیم"
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

  // Generic regex for X دقیقه or X ساعت
  const minMatch = norm.match(/([0-9]+)\s*دقیقه/);
  if (minMatch) {
    return { durationMinutes: parseInt(minMatch[1], 10), matchedSnippet: minMatch[0] };
  }

  const hrMatch = norm.match(/([0-9]+)\s*ساعت/);
  if (hrMatch) {
    return { durationMinutes: parseInt(hrMatch[1], 10) * 60, matchedSnippet: hrMatch[0] };
  }

  return { durationMinutes: 30 }; // default 30 min
}

/**
 * Extracts Persian date and recurrence
 */
function extractDateAndRecurrence(text: string): {
  dueDate: string;
  recurrence: RecurrenceType;
  finalDeadline?: string;
  matchedSnippet?: string;
  hasExplicitDate: boolean;
} {
  const today = getTodayJalali();
  const currentDow = today.dayOfWeek; // 0 = Sat, ..., 6 = Fri

  // Check Recurrence first
  if (text.includes('هر روز') || text.includes('روزانه')) {
    return {
      dueDate: today.formatted,
      recurrence: 'daily',
      matchedSnippet: 'هر روز',
      hasExplicitDate: true
    };
  }
  if (text.includes('هر هفته') || text.includes('هفتگی')) {
    return {
      dueDate: today.formatted,
      recurrence: 'weekly',
      matchedSnippet: 'هر هفته',
      hasExplicitDate: true
    };
  }
  if (text.includes('هر ماه') || text.includes('ماهانه')) {
    return {
      dueDate: today.formatted,
      recurrence: 'monthly',
      matchedSnippet: 'هر ماه',
      hasExplicitDate: true
    };
  }

  // Deadlines: "تا آخر هفته", "تا پایان هفته"
  if (text.includes('تا آخر هفته') || text.includes('تا پایان هفته')) {
    // End of Persian week is Thursday (index 5) or Friday (index 6)
    const daysUntilThursday = (5 - currentDow + 7) % 7;
    const deadline = addDaysToJalali(today.formatted, daysUntilThursday === 0 ? 7 : daysUntilThursday);
    return {
      dueDate: deadline,
      finalDeadline: deadline,
      recurrence: 'none',
      matchedSnippet: 'تا آخر هفته',
      hasExplicitDate: true
    };
  }

  // "پس‌فردا" or "پس فردا"
  if (text.includes('پس‌فردا') || text.includes('پس فردا')) {
    return {
      dueDate: addDaysToJalali(today.formatted, 2),
      recurrence: 'none',
      matchedSnippet: 'پس‌فردا',
      hasExplicitDate: true
    };
  }

  // "فردا"
  if (text.includes('فردا')) {
    return {
      dueDate: addDaysToJalali(today.formatted, 1),
      recurrence: 'none',
      matchedSnippet: 'فردا',
      hasExplicitDate: true
    };
  }

  // "امروز"
  if (text.includes('امروز')) {
    return {
      dueDate: today.formatted,
      recurrence: 'none',
      matchedSnippet: 'امروز',
      hasExplicitDate: true
    };
  }

  // "هفته آینده"
  if (text.includes('هفته آینده') || text.includes('هفته دیگه')) {
    return {
      dueDate: addDaysToJalali(today.formatted, 7),
      recurrence: 'none',
      matchedSnippet: 'هفته آینده',
      hasExplicitDate: true
    };
  }

  // "ماه آینده"
  if (text.includes('ماه آینده') || text.includes('ماه بعد')) {
    return {
      dueDate: addDaysToJalali(today.formatted, 30),
      recurrence: 'none',
      matchedSnippet: 'ماه آینده',
      hasExplicitDate: true
    };
  }

  // Specific weekdays: e.g. "پنجشنبه", "شنبه آینده", "دوشنبه"
  for (const [name, dow] of Object.entries(WEEKDAY_NAMES_MAP)) {
    if (text.includes(name)) {
      let daysAhead = (dow - currentDow + 7) % 7;
      if (text.includes(`${name} آینده`) || text.includes(`${name} بعد`)) {
        daysAhead += 7;
      } else if (daysAhead === 0) {
        // If saying the current day name, usually means next week's unless "امروز" was said
        daysAhead = 7;
      }
      return {
        dueDate: addDaysToJalali(today.formatted, daysAhead),
        recurrence: 'none',
        matchedSnippet: name,
        hasExplicitDate: true
      };
    }
  }

  // If no date was found at all:
  return {
    dueDate: today.formatted,
    recurrence: 'none',
    hasExplicitDate: false
  };
}

/**
 * Extracts priority
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
 * Categorizes based on Persian domain keywords
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
 * Cleans the voice text into an actionable task title
 * by stripping helper filler words ("بگیرم", "کنم", "بگذارم", "ساعت ۹", "فردا", etc.)
 */
function cleanPersianTaskTitle(text: string, snippetsToRemove: string[]): string {
  let title = text;

  // Remove matched time/date snippets
  for (const snip of snippetsToRemove) {
    if (snip && snip.length > 1) {
      title = title.replace(snip, ' ');
    }
  }

  // Remove common Persian verbs suffixes or prefixes used in speech
  title = title
    .replace(/(?:باید|می‌خواهم|میخوام|قرار است|یادم باشد|یادم باشه)\s*/g, '')
    .replace(/\s*(?:بگیرم|کنم|بگذارم|وقت بگذارم|ارسال کنم|آماده کنم|بروم|برم|انجام دهم|انجام بدم|داشته باشم|بخرم|بزنم)\.?$/g, '')
    .replace(/^(?:که|برای|تا)\s*/g, '')
    .trim();

  // Normalize spaces
  title = title.replace(/\s+/g, ' ').trim();

  if (!title) {
    title = text.trim();
  }

  return title;
}

/**
 * Master parser: Processes spoken Persian speech and creates a structured task
 */
export function parsePersianVoiceCommand(rawSpeech: string): ParsedVoiceResult {
  const trimmed = rawSpeech.trim();
  const snippetsToRemove: string[] = [];

  // 1. Time
  const timeResult = extractTime(trimmed);
  if (timeResult.matchedSnippet) snippetsToRemove.push(timeResult.matchedSnippet);

  // 2. Date & Recurrence
  const dateResult = extractDateAndRecurrence(trimmed);
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

  // 7. Ambiguity check: As required in prompt:
  // "اگر اطلاعات مهمی مانند تاریخ یا ساعت مبهم بود، برنامه سؤال تکمیلی بپرسد و هیچ تاریخ یا ساعت نامعلومی را حدس نزند."
  let needsClarification = false;
  let clarificationQuestion: string | undefined = undefined;

  if (!dateResult.hasExplicitDate && !timeResult.isFixed) {
    needsClarification = true;
    clarificationQuestion = 'تاریخ یا ساعت مشخصی برای این وظیفه ذکر نشد. آیا برای امروز ثبت شود یا ساعت معینی در نظر دارید؟';
  } else if (!timeResult.isFixed && (trimmed.includes('تماس') || trimmed.includes('جلسه') || trimmed.includes('دیدار'))) {
    needsClarification = true;
    clarificationQuestion = 'این کار نیاز به ساعت دقیق دارد. مایلید در چه ساعتی از روز تنظیم شود؟';
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
    clarificationQuestion
  };
}

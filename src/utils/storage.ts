import { Task, UserSettings } from '../types';
import { addDaysToJalali, getTodayJalali } from './jalali';

const TASKS_STORAGE_KEY = 'hamrah_man_tasks_v1';
const SETTINGS_STORAGE_KEY = 'hamrah_man_settings_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'علی احمدی',
  workDayStart: '08:00',
  workDayEnd: '17:30',
  breakDurationMinutes: 15,
  workDaysOfWeek: [0, 1, 2, 3, 4], // Sat to Wed
  reminderIntervalMinutes: 15,
  theme: 'light',
  fontSize: 'medium',
  whisperModel: 'base',
  whisperStatus: 'ready',
  airplaneModeTested: true,
  soundEnabled: true,
  notificationsEnabled: true,
  customCategories: [],
  useCustomAppDateTime: false,
  customAppDate: '',
  customAppTime: '09:00'
};

/**
 * Creates seed tasks based on the user's initial prompts
 */
export function getInitialTasks(): Task[] {
  const today = getTodayJalali();
  const yesterday = addDaysToJalali(today.formatted, -1);
  const tomorrow = addDaysToJalali(today.formatted, 1);
  const nextThursday = addDaysToJalali(today.formatted, (5 - today.dayOfWeek + 7) % 7 || 7);

  return [
    {
      id: 'task-1',
      title: 'ورزش و پیاده‌روی صبحگاهی',
      description: '۳۰ دقیقه دویدن در پارک برای سلامتی و نشاط روزانه',
      category: 'ورزش و سلامتی',
      createdAt: new Date().toISOString(),
      dueDate: today.formatted,
      dueTime: '07:00',
      estimatedDurationMinutes: 45,
      priority: 'high',
      status: 'completed',
      recurrence: 'daily',
      source: 'voice',
      isTimeFixed: true
    },
    {
      id: 'task-2',
      title: 'تماس با مدیر مدرسه',
      description: 'هماهنگی جلسه انجمن اولیا و مربیان و پیگیری کارنامه',
      category: 'امور اداری',
      createdAt: new Date().toISOString(),
      dueDate: today.formatted,
      dueTime: '09:00',
      estimatedDurationMinutes: 30,
      priority: 'urgent',
      status: 'scheduled',
      recurrence: 'none',
      source: 'voice',
      isTimeFixed: true
    },
    {
      id: 'task-3',
      title: 'یادگیری هوش مصنوعی محلی',
      description: 'مطالعه مستندات whisper.cpp و مدل‌های On-Device در اندروید',
      category: 'یادگیری و آموزش',
      createdAt: new Date().toISOString(),
      dueDate: today.formatted,
      dueTime: '11:00',
      estimatedDurationMinutes: 90,
      priority: 'high',
      status: 'scheduled',
      recurrence: 'none',
      source: 'voice',
      isTimeFixed: false
    },
    {
      id: 'task-4',
      title: 'ارسال گزارش مسابقات قرآن',
      description: 'جمع‌بندی نتایج داوری مرحله استانی و ارسال به دبیرخانه',
      category: 'امور قرآنی و فرهنگی',
      createdAt: new Date().toISOString(),
      dueDate: nextThursday,
      dueTime: '14:00',
      estimatedDurationMinutes: 60,
      priority: 'high',
      status: 'registered',
      recurrence: 'none',
      finalDeadline: nextThursday,
      source: 'voice',
      isTimeFixed: true
    },
    {
      id: 'task-5',
      title: 'آماده‌سازی نامه اداره و فرم استعلام',
      description: 'تنظیم پیش‌نویس پاسخ به حراست و کارگزینی',
      category: 'امور اداری',
      createdAt: new Date().toISOString(),
      dueDate: tomorrow,
      dueTime: '10:00',
      estimatedDurationMinutes: 45,
      priority: 'medium',
      status: 'registered',
      recurrence: 'none',
      source: 'manual',
      isTimeFixed: false
    },
    {
      id: 'task-6',
      title: 'پرداخت قسط وام مسکن',
      description: 'انتقال وجه از طریق همراه بانک به حساب تسهیلات',
      category: 'مالی و سرمایه‌گذاری',
      createdAt: new Date().toISOString(),
      dueDate: yesterday, // Intentionally overdue for testing the prompt requirement
      dueTime: '18:00',
      estimatedDurationMinutes: 15,
      priority: 'urgent',
      status: 'overdue',
      recurrence: 'monthly',
      source: 'manual',
      isTimeFixed: true
    }
  ];
}

/**
 * Loads tasks from localStorage with fallback to initial seed
 */
export function loadTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialTasks();
      saveTasksToStorage(initial);
      return initial;
    }
    const parsed: Task[] = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Error loading tasks:', err);
    return getInitialTasks();
  }
}

/**
 * Saves tasks to localStorage
 */
export function saveTasksToStorage(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Error saving tasks:', err);
  }
}

/**
 * Loads user settings
 */
export function loadSettingsFromStorage(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      saveSettingsToStorage(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error loading settings:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Saves user settings
 */
export function saveSettingsToStorage(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

/**
 * Finds overdue tasks: Uncompleted tasks whose dueDate < today
 */
export function getOverdueTasks(tasks: Task[], todayJalali: string): Task[] {
  return tasks.filter((t) => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    // Compare dates lexicographically "YYYY/MM/DD"
    return t.dueDate < todayJalali;
  });
}

/**
 * Export backup as downloadable JSON
 */
export function exportBackupJSON(tasks: Task[], settings: UserSettings): void {
  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    appName: 'رفیق یار (همراه من)',
    tasks,
    settings
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hamrah_man_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse and restore backup from JSON string
 */
export function restoreBackupFromJSON(jsonString: string): {
  success: boolean;
  tasks?: Task[];
  settings?: UserSettings;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.tasks)) {
      return { success: false, error: 'ساختار فایل پشتیبان معتبر نیست.' };
    }
    return {
      success: true,
      tasks: parsed.tasks,
      settings: parsed.settings || DEFAULT_SETTINGS
    };
  } catch {
    return { success: false, error: 'فایل وارد شده یک JSON معتبر نیست.' };
  }
}

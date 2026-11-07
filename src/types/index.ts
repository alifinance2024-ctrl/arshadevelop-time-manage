export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 
  | 'registered'        // ثبت‌شده
  | 'pending_approval'  // در انتظار تأیید
  | 'scheduled'         // برنامه‌ریزی‌شده
  | 'completed'         // انجام‌شده
  | 'not_completed'     // انجام‌نشده
  | 'overdue'           // عقب‌افتاده
  | 'cancelled';        // لغوشده

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export type TaskSource = 'voice' | 'manual';

export type DefaultCategory = 
  | 'امور اداری'
  | 'امور قرآنی و فرهنگی'
  | 'امور شخصی'
  | 'خانواده'
  | 'یادگیری و آموزش'
  | 'مالی و سرمایه‌گذاری'
  | 'ورزش و سلامتی'
  | 'سایر';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  createdAt: string;            // ISO string
  dueDate: string;              // YYYY/MM/DD (Jalali) e.g. "1405/08/17"
  dueTime?: string;             // HH:mm (24h) e.g. "09:00"
  estimatedDurationMinutes: number; // e.g. 30, 60, 120
  priority: Priority;
  status: TaskStatus;
  recurrence: RecurrenceType;
  finalDeadline?: string;       // Jalali date string
  source: TaskSource;
  isTimeFixed?: boolean;        // If user explicitly gave exact hour
}

export interface UserSettings {
  userName: string;
  workDayStart: string;         // "08:00"
  workDayEnd: string;           // "17:00"
  breakDurationMinutes: number; // 15
  workDaysOfWeek: number[];     // 0 = Saturday, 1 = Sunday, ..., 6 = Friday
  reminderIntervalMinutes: number; // 15
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  whisperModel: 'tiny' | 'base' | 'small';
  whisperStatus: 'ready' | 'downloading' | 'not_downloaded';
  airplaneModeTested: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  customCategories: string[];
}

export interface ParsedVoiceResult {
  rawText: string;
  cleanTitle: string;
  category: string;
  dueDate: string;              // Jalali YYYY/MM/DD
  dueTime?: string;             // HH:mm
  durationMinutes: number;
  priority: Priority;
  recurrence: RecurrenceType;
  finalDeadline?: string;
  isTimeFixed: boolean;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
}

export type TabType = 'home' | 'planner' | 'calendar' | 'tasks' | 'settings';

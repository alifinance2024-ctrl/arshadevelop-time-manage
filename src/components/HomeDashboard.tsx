import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Mic, 
  ArrowLeft, 
  Check, 
  Calendar, 
  ChevronLeft,
  Flame,
  ArrowRightCircle,
  Tag,
  Sparkles
} from 'lucide-react';
import { Task, UserSettings } from '../types';
import { getTodayJalali, toPersianDigits, formatJalaliHuman } from '../utils/jalali';
import { audioService } from '../utils/audioService';

interface HomeDashboardProps {
  tasks: Task[];
  settings: UserSettings;
  activeAppDate: import('../utils/jalali').ActiveJalaliDate;
  onToggleTaskComplete: (taskId: string) => void;
  onOpenVoice: () => void;
  onOpenManualAdd: () => void;
  onSelectTask: (task: Task) => void;
  onRolloverOverdueTasks: (taskIds?: string[]) => void;
  onNavigateTab: (tab: 'planner' | 'calendar' | 'tasks' | 'settings') => void;
  onOpenDateTimeModal: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  tasks,
  settings,
  activeAppDate,
  onToggleTaskComplete,
  onOpenVoice,
  onOpenManualAdd,
  onSelectTask,
  onRolloverOverdueTasks,
  onNavigateTab,
  onOpenDateTimeModal
}) => {
  const today = activeAppDate;

  // Tasks for today
  const todayTasks = tasks.filter((t) => t.dueDate === today.formatted);
  const completedToday = todayTasks.filter((t) => t.status === 'completed');
  const remainingToday = todayTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');

  // Overdue tasks: dueDate < today and not completed
  const overdueTasks = tasks.filter((t) => t.dueDate < today.formatted && t.status !== 'completed' && t.status !== 'cancelled');

  // Urgent tasks (any date with urgent priority or today's high priority)
  const urgentTasks = tasks.filter(
    (t) => (t.priority === 'urgent' || (t.priority === 'high' && t.dueDate === today.formatted)) &&
           t.status !== 'completed' &&
           t.status !== 'cancelled'
  );

  // Today's timeline schedule (sorted by dueTime)
  const scheduledToday = [...todayTasks]
    .filter((t) => t.dueTime)
    .sort((a, b) => (a.dueTime || '').localeCompare(b.dueTime || ''));

  return (
    <div className="space-y-5 pb-6">
      {/* Overdue Rollover Prompt (Prompt Section 11 requirement) */}
      {overdueTasks.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  {toPersianDigits(overdueTasks.length)} وظیفه از روزهای گذشته انجام نشده است!
                </h2>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  «تعدادی از وظایف انجام‌نشده باقی مانده‌اند. آیا مایل هستید آن‌ها را به امروز منتقل کنید؟»
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {overdueTasks.slice(0, 3).map((ot) => (
                    <span key={ot.id} className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                      {ot.title} ({formatJalaliHuman(ot.dueDate)})
                    </span>
                  ))}
                  {overdueTasks.length > 3 && (
                    <span className="text-[11px] text-amber-800 dark:text-amber-300">
                      و {toPersianDigits(overdueTasks.length - 3)} مورد دیگر...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => onRolloverOverdueTasks(overdueTasks.map((t) => t.id))}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shrink-0 active:scale-95 transition-transform flex items-center gap-1.5"
            >
              <ArrowRightCircle className="w-4 h-4" />
              <span>انتقال به امروز</span>
            </button>
          </div>
        </div>
      )}

      {/* 4 KPI Summary Cards (Prompt Section 4 items 4-7) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Today Total */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-300 block font-medium">کارهای امروز</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {toPersianDigits(todayTasks.length)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-300 block font-medium">انجام‌شده</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {toPersianDigits(completedToday.length)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-300 block font-medium">باقی‌مانده</span>
            <span className="text-2xl font-black text-sky-600 dark:text-sky-400 tabular-nums">
              {toPersianDigits(remainingToday.length)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-300 block font-medium">عقب‌افتاده</span>
            <span className={`text-2xl font-black tabular-nums ${overdueTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
              {toPersianDigits(overdueTasks.length)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Hero Voice Microphone & Manual Add (Prompt Section 4 items 8-9) */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white rounded-3xl p-5 shadow-xl shadow-emerald-950/15 relative overflow-hidden">
        {/* Subtle decorative radial gradient in background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-center sm:text-right space-y-1.5 max-w-md">
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-200 font-medium bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>پردازش زبان طبیعی فارسی محلی (Whisper On-Device)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              فقط با صحبت کردن وظیفه خود را ثبت کنید
            </h2>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              بگویید: «فردا ساعت ۹ با مدیر تماس بگیرم» یا «پنجشنبه گزارش را بفرستم»
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Giant Voice Mic Button */}
            <button
              onClick={onOpenVoice}
              className="group relative flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-700 shadow-xl shadow-slate-950/20 active:scale-95 transition-all"
              title="شروع ثبت صوتی وظیفه"
            >
              <span className="absolute -inset-1 rounded-2xl bg-white/20 animate-pulse pointer-events-none" />
              <Mic className="w-8 h-8 sm:w-9 sm:h-9 group-hover:scale-110 transition-transform" />
            </button>

            {/* Manual Task Button */}
            <button
              onClick={onOpenManualAdd}
              className="h-12 px-4 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت دستی</span>
            </button>
          </div>
        </div>
      </div>

      {/* Urgent & High Priority Tasks (Prompt Section 4 item 11) */}
      {urgentTasks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>وظایف فوری و حیاتی</span>
            </h2>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
              {toPersianDigits(urgentTasks.length)} کار دارای اولویت
            </span>
          </div>

          <div className="space-y-2">
            {urgentTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-rose-200/70 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-800 shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTaskComplete(t.id);
                      if (settings.soundEnabled) audioService.playSuccessChime();
                    }}
                    className="text-slate-400 hover:text-emerald-500 shrink-0"
                  >
                    <Circle className="w-5 h-5 text-rose-500" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {t.title}
                    </h3>
                    {/* Unboxed metadata with · separators */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      <span className="text-rose-600 dark:text-rose-400 font-medium">فوری</span>
                      <span aria-hidden="true">·</span>
                      <span>{t.category}</span>
                      {t.dueTime && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">ساعت {toPersianDigits(t.dueTime)}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{formatJalaliHuman(t.dueDate)}</span>
                    </div>
                  </div>
                </div>

                <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Schedule Timeline Preview (Prompt Section 4 item 10) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>برنامه زمانی امروز ({today.humanReadable})</span>
          </h2>
          <button
            onClick={() => onNavigateTab('planner')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            <span>مشاهده برنامه‌ریز</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              هنوز وظیفه‌ای برای امروز ثبت نکرده‌اید!
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              روی دکمه میکروفون بزنید و بگویید چه کاری باید انجام شود.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((t) => {
              const isDone = t.status === 'completed';
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className={`bg-white dark:bg-slate-900 p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isDone
                      ? 'border-slate-200 dark:border-slate-800/60 opacity-60'
                      : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTaskComplete(t.id);
                        if (!isDone && settings.soundEnabled) audioService.playSuccessChime();
                      }}
                      className="shrink-0 transition-colors"
                      title={isDone ? 'علامت‌گذاری به عنوان انجام نشده' : 'علامت‌گذاری به عنوان انجام شده'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 hover:text-emerald-600" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h3
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isDone
                            ? 'line-through text-slate-600 dark:text-slate-300'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {t.title}
                      </h3>
                      {/* Unboxed metadata */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        <span>{t.category}</span>
                        {t.dueTime && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                              ساعت {toPersianDigits(t.dueTime)}
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{toPersianDigits(t.estimatedDurationMinutes)} دقیقه</span>
                        {t.recurrence !== 'none' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-teal-600 dark:text-teal-400">
                              {t.recurrence === 'daily' ? 'هر روز' : 'هفتگی'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

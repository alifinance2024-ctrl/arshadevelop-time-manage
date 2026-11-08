import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Coffee, 
  AlertTriangle, 
  RotateCcw, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  CalendarDays
} from 'lucide-react';
import { Task, UserSettings } from '../types';
import { generateSmartDailyPlan, DayPlanProposal, ScheduledSlot } from '../utils/plannerAlgorithm';
import { 
  toPersianDigits, 
  toEnglishDigits, 
  formatJalaliHuman, 
  addDaysToJalali,
  PERSIAN_DAY_DEFINITIONS,
  PERSIAN_MONTH_NAMES,
  jalaliToGregorian
} from '../utils/jalali';
import { audioService } from '../utils/audioService';

interface DailyPlannerViewProps {
  tasks: Task[];
  settings: UserSettings;
  activeAppDate: import('../utils/jalali').ActiveJalaliDate;
  onUpdateTaskTime: (taskId: string, newTime: string, isFixed?: boolean) => void;
  onApplyPlanProposal: (proposalSlots: ScheduledSlot[]) => void;
}

export const DailyPlannerView: React.FC<DailyPlannerViewProps> = ({
  tasks,
  settings,
  activeAppDate,
  onUpdateTaskTime,
  onApplyPlanProposal
}) => {
  const today = activeAppDate;
  const [selectedDate, setSelectedDate] = useState<string>(today.formatted);
  const [activeProposal, setActiveProposal] = useState<DayPlanProposal | null>(null);

  // Sync selectedDate if activeAppDate changes from settings/modal
  useEffect(() => {
    setSelectedDate(activeAppDate.formatted);
  }, [activeAppDate.formatted]);

  // Filter tasks for the selected date
  const tasksForDate = tasks.filter((t) => t.dueDate === selectedDate && t.status !== 'cancelled');

  const handleRunAlgorithm = () => {
    const proposal = generateSmartDailyPlan(tasksForDate, settings, selectedDate);
    setActiveProposal(proposal);
  };

  const handleAcceptProposal = () => {
    if (!activeProposal) return;
    onApplyPlanProposal(activeProposal.slots);
    if (settings.soundEnabled) audioService.playSuccessChime();
    setActiveProposal(null);
  };

  const handleRejectProposal = () => {
    setActiveProposal(null);
  };

  const changeDateBy = (days: number) => {
    const nextDate = addDaysToJalali(selectedDate, days);
    setSelectedDate(nextDate);
    setActiveProposal(null);
  };

  // Generate 7-day strip centered on selected date (-3 to +3 days)
  const stripOffsets = [-3, -2, -1, 0, 1, 2, 3];
  const stripDays = stripOffsets.map((offset) => {
    const dStr = addDaysToJalali(selectedDate, offset);
    const parts = dStr.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
    const [jy, jm, jd] = parts;
    const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
    const dateObj = new Date(Date.UTC(gy, gm - 1, gd, 12, 0, 0));
    const dowIndex = (dateObj.getUTCDay() + 1) % 7;
    const dayDef = PERSIAN_DAY_DEFINITIONS[dowIndex];
    const monthName = PERSIAN_MONTH_NAMES[jm - 1] || '';

    return {
      dateStr: dStr,
      dayNumber: dayDef.dayNumber,
      dayName: dayDef.name,
      dayOfMonth: jd,
      monthName,
      shortLabel: `${toPersianDigits(jd)} ${monthName}`,
      isToday: dStr === today.formatted,
      isSelected: dStr === selectedDate
    };
  });

  // Timeline slots to display (either the active proposal, or currently saved scheduled tasks)
  const currentSlots: ScheduledSlot[] = activeProposal
    ? activeProposal.slots
    : tasksForDate
        .filter((t) => t.dueTime)
        .map((t) => {
          const [h, m] = (t.dueTime || '09:00').split(':').map((s) => parseInt(s, 10));
          const totalMin = (h || 0) * 60 + (m || 0) + (t.estimatedDurationMinutes || 30);
          const endH = Math.floor(totalMin / 60) % 24;
          const endM = totalMin % 60;
          const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
          return {
            taskId: t.id,
            taskTitle: t.title,
            category: t.category,
            startTime: t.dueTime!,
            endTime: `${pad(endH)}:${pad(endM)}`,
            durationMinutes: t.estimatedDurationMinutes || 30,
            isFixed: Boolean(t.isTimeFixed),
            priority: t.priority
          };
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const unscheduledTasks = tasksForDate.filter((t) => !t.dueTime && t.status !== 'completed');

  return (
    <div className="space-y-5 pb-6">
      {/* Date Header Switcher */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          {/* Previous Day: right side in RTL */}
          <button
            type="button"
            onClick={() => changeDateBy(-1)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 shrink-0"
            title="رفتن به روز قبل"
          >
            <ChevronRight className="w-4 h-4" />
            <span>روز قبل</span>
          </button>

          {/* Center Date Display */}
          <div className="text-center min-w-0 flex-1 px-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>برنامه‌ریزی روزانه</span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5 truncate">
              {formatJalaliHuman(selectedDate)}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              {selectedDate === today.formatted ? (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                  امروز (روز جاری فعال)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(today.formatted);
                    setActiveProposal(null);
                  }}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full hover:bg-emerald-100 transition-colors"
                >
                  بازگشت به امروز ({today.dayName})
                </button>
              )}
            </div>
          </div>

          {/* Next Day: left side in RTL */}
          <button
            type="button"
            onClick={() => changeDateBy(1)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 shrink-0"
            title="رفتن به روز بعد"
          >
            <span>روز بعد</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* 7-Day Quick Strip for smooth day-by-day navigation */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-medium">مرور روزها (روزی یک گام):</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">انتخاب مستقیم هر روز</span>
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {stripDays.map((d) => {
              const countForThisDay = tasks.filter((t) => t.dueDate === d.dateStr && t.status !== 'cancelled').length;
              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d.dateStr);
                    setActiveProposal(null);
                  }}
                  className={`py-2 px-1 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    d.isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-md ring-2 ring-emerald-500/30'
                      : d.isToday
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-[10px] opacity-90 leading-tight">
                    {d.dayName}
                  </span>
                  <span className="text-[11px] font-bold">
                    {d.shortLabel}
                  </span>
                  {countForThisDay > 0 && (
                    <span className={`text-[9px] px-1 rounded-full font-mono mt-0.5 ${
                      d.isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {toPersianDigits(countForThisDay)} کار
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Algorithm Trigger Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-right">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>الگوریتم هوشمند پیشنهاد زمان و چیدمان برنامه</span>
          </div>
          <p className="text-xs text-emerald-100/80 leading-relaxed">
            بر اساس ساعات کاری ({toPersianDigits(settings.workDayStart)} تا {toPersianDigits(settings.workDayEnd)})، زمان استراحت ({toPersianDigits(settings.breakDurationMinutes)} دقیقه) و اولویت وظایف
          </p>
        </div>

        <button
          onClick={handleRunAlgorithm}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>تولید برنامه پیشنهادی خودکار</span>
        </button>
      </div>

      {/* Proposal Approval Bar (If proposal is generated) */}
      {activeProposal && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>برنامه پیشنهادی جدید آماده تأیید است</span>
              </h2>
              <div className="flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                <span>کار کل: {toPersianDigits(activeProposal.totalWorkMinutes)} دقیقه</span>
                <span aria-hidden="true">·</span>
                <span>استراحت: {toPersianDigits(activeProposal.totalBreakMinutes)} دقیقه</span>
                <span aria-hidden="true">·</span>
                <span>{toPersianDigits(activeProposal.slots.length)} بازه زمانی</span>
              </div>

              {activeProposal.hasConflicts && (
                <div className="mt-2 space-y-1">
                  {activeProposal.conflictNotes.map((note, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRejectProposal}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                لغو
              </button>
              <button
                onClick={handleAcceptProposal}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
              >
                تأیید و اعمال در تقویم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unscheduled Tasks for this day */}
      {unscheduledTasks.length > 0 && !activeProposal && (
        <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>کارهای بدون ساعت مشخص ({toPersianDigits(unscheduledTasks.length)} مورد):</span>
            </span>
            <span className="text-[11px] text-amber-800 dark:text-amber-300">
              روی دکمه تولید خودکار بزنید تا زمان مناسب پیشنهاد شود
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unscheduledTasks.map((ut) => (
              <span
                key={ut.id}
                className="text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-xs"
              >
                {ut.title} ({toPersianDigits(ut.estimatedDurationMinutes)} دقیقه)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Schedule View */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>جدول زمانی برنامه روز ({toPersianDigits(currentSlots.length)} بخش)</span>
        </h2>

        {currentSlots.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              هیچ برنامه زمان‌بندی شده‌ای برای این روز تنظیم نشده است.
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              از دکمه «تولید برنامه پیشنهادی خودکار» استفاده کنید یا در ثبت وظیفه، ساعت مشخص تعیین کنید.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 relative">
            {/* Vertical timeline track line */}
            <div className="absolute right-6 top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-800 pointer-events-none" />

            {currentSlots.map((slot, index) => {
              return (
                <div key={index} className="flex items-start gap-4 relative">
                  {/* Time Badge */}
                  <div className="w-20 pt-1 text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block">
                      {toPersianDigits(slot.startTime)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                      تا {toPersianDigits(slot.endTime)}
                    </span>
                  </div>

                  {/* Dot on timeline */}
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shrink-0 mt-2 z-10" />

                  {/* Task Card in Slot */}
                  <div className="flex-1 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {slot.taskTitle}
                        </h3>
                        {slot.isFixed && (
                          <span
                            title="ساعت قطعی قفل شده"
                            className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 rounded px-1.5 py-0.5 flex items-center gap-0.5"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            <span>ثابت</span>
                          </span>
                        )}
                      </div>

                      {/* Unboxed metadata */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        <span>{slot.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{toPersianDigits(slot.durationMinutes)} دقیقه</span>
                        <span aria-hidden="true">·</span>
                        <span className={slot.priority === 'urgent' ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
                          {slot.priority === 'urgent' ? 'فوری' : slot.priority === 'high' ? 'مهم' : 'عادی'}
                        </span>
                      </div>
                    </div>

                    {/* Buffer / Break hint */}
                    <div className="flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-1 rounded-lg shrink-0">
                      <Coffee className="w-3 h-3" />
                      <span>+{toPersianDigits(settings.breakDurationMinutes)}دقیقه استراحت</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

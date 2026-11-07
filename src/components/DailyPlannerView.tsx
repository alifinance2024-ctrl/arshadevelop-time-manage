import React, { useState } from 'react';
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
import { getTodayJalali, toPersianDigits, formatJalaliHuman, addDaysToJalali } from '../utils/jalali';
import { audioService } from '../utils/audioService';

interface DailyPlannerViewProps {
  tasks: Task[];
  settings: UserSettings;
  onUpdateTaskTime: (taskId: string, newTime: string, isFixed?: boolean) => void;
  onApplyPlanProposal: (proposalSlots: ScheduledSlot[]) => void;
}

export const DailyPlannerView: React.FC<DailyPlannerViewProps> = ({
  tasks,
  settings,
  onUpdateTaskTime,
  onApplyPlanProposal
}) => {
  const today = getTodayJalali();
  const [selectedDate, setSelectedDate] = useState<string>(today.formatted);
  const [activeProposal, setActiveProposal] = useState<DayPlanProposal | null>(null);

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
    setSelectedDate(addDaysToJalali(selectedDate, days));
    setActiveProposal(null);
  };

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
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <button
          onClick={() => changeDateBy(-1)}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="روز قبل"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>برنامه‌ریزی روزانه</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {formatJalaliHuman(selectedDate)}
            {selectedDate === today.formatted && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mr-2 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                امروز
              </span>
            )}
          </h2>
        </div>

        <button
          onClick={() => changeDateBy(1)}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="روز بعد"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
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

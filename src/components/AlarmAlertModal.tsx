import React, { useEffect, useRef } from 'react';
import { Bell, Clock, CheckCircle2, Volume2, X, AlertTriangle } from 'lucide-react';
import { Task } from '../types';
import { toPersianDigits } from '../utils/jalali';
import { audioService } from '../utils/audioService';

interface AlarmAlertModalProps {
  task: Task | null;
  onDismiss: () => void;
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string) => void;
}

export const AlarmAlertModal: React.FC<AlarmAlertModalProps> = ({
  task,
  onDismiss,
  onComplete,
  onSnooze
}) => {
  const alarmIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (task) {
      // Play initial alarm chime immediately
      audioService.playTaskReminderAlarm();

      // Repeat alarm every 4 seconds until user reacts
      alarmIntervalRef.current = setInterval(() => {
        audioService.playTaskReminderAlarm();
      }, 4000);
    }

    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
    };
  }, [task]);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-emerald-500 overflow-hidden flex flex-col text-slate-900 dark:text-white relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg animate-bounce">
              <Bell className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-100 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>زنگ هشدار صوتی وظیفه</span>
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                ۵ دقیقه مانده به زمان وظیفه!
              </h2>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                {task.title}
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-lg shrink-0">
                {task.category}
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 pt-1">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>موعد مقرر: ساعت {task.dueTime ? toPersianDigits(task.dueTime) : 'هم‌اکنون'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500 font-sans font-normal">مدت: {toPersianDigits(task.estimatedDurationMinutes)} دقیقه</span>
            </div>
          </div>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            برای انجام این کار آماده شوید یا آن را به تعویق بیندازید.
          </p>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {/* Complete */}
            <button
              onClick={() => {
                onComplete(task.id);
                onDismiss();
              }}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>انجام شد</span>
            </button>

            {/* Snooze 5 min */}
            <button
              onClick={() => {
                onSnooze(task.id);
                onDismiss();
              }}
              className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>تعویق (۵ دقیقه)</span>
            </button>

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold active:scale-95 transition-all"
            >
              قطع زنگ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

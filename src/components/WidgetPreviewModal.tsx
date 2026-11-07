import React from 'react';
import { 
  X, 
  Mic, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Smartphone, 
  Sparkles,
  Calendar
} from 'lucide-react';
import { Task } from '../types';
import { getTodayJalali, toPersianDigits, formatJalaliHuman } from '../utils/jalali';

interface WidgetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onOpenVoice: () => void;
  onOpenManualAdd: () => void;
}

export const WidgetPreviewModal: React.FC<WidgetPreviewModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onOpenVoice,
  onOpenManualAdd
}) => {
  if (!isOpen) return null;

  const today = getTodayJalali();
  const todayTasks = tasks.filter((t) => t.dueDate === today.formatted && t.status !== 'cancelled');
  const remainingToday = todayTasks.filter((t) => t.status !== 'completed');
  const nextTask = remainingToday.find((t) => t.dueTime) || remainingToday[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                پیش‌نمایش ویجت‌های اندروید (Xiaomi POCO M4)
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                طراحی شده با Jetpack Glance / AppWidgetProvider
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: Simulated Android Home Screen with widgets */}
        <div className="p-5 overflow-y-auto space-y-5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
          <div className="text-center space-y-1">
            <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full inline-block">
              شبیه‌ساز صفحه اصلی گوشی شیائومی POCO M4
            </span>
            <p className="text-xs text-slate-300">
              ویجت تعاملی همراه من برای دسترسی سریع به کارهای امروز بدون باز کردن برنامه
            </p>
          </div>

          {/* Widget Type 1: 4x2 Wide Daily Glance Widget */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-semibold block text-right">
              ۱. ویجت عریض هوشمند (۴×۲) - دسترسی کامل و نزدیک‌ترین کار:
            </span>
            <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl p-4 border border-slate-700/80 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">همراه من</span>
                    <span className="text-[10px] text-slate-300">{today.humanReadable}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Quick Voice Mic in widget */}
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVoice();
                    }}
                    className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
                    title="ثبت سریع صوتی"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Quick Add in widget */}
                  <button
                    onClick={() => {
                      onClose();
                      onOpenManualAdd();
                    }}
                    className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center active:scale-90 transition-transform"
                    title="ثبت سریع وظیفه"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Nearest task box inside widget */}
              <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-700/60 flex items-center justify-between">
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] text-emerald-400 font-medium block">
                    نزدیک‌ترین وظیفه امروز:
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {nextTask ? nextTask.title : 'تمام وظایف امروز انجام شده‌اند!'}
                  </p>
                  {nextTask && nextTask.dueTime && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      ساعت {toPersianDigits(nextTask.dueTime)} ({nextTask.category})
                    </span>
                  )}
                </div>

                <div className="text-left shrink-0 pl-1">
                  <span className="text-lg font-black text-emerald-400 tabular-nums">
                    {toPersianDigits(remainingToday.length)}
                  </span>
                  <span className="text-[10px] text-slate-400 block -mt-1">باقی‌مانده</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget Type 2: 2x2 Compact Widget */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-semibold block text-right">
              ۲. ویجت جمع‌وجور (۲×۲) - دسترسی فوری:
            </span>
            <div className="w-44 bg-slate-800/90 backdrop-blur-md rounded-3xl p-4 border border-slate-700/80 shadow-2xl flex flex-col justify-between h-44 mx-auto">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                  <Mic className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white tabular-nums">
                  {toPersianDigits(remainingToday.length)} کار
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400">کارهای امروز</span>
                <p className="text-xs font-semibold text-white truncate">
                  {nextTask ? nextTask.title : 'هیچ کار باقی‌مانده‌ای نیست'}
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenVoice();
                }}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md active:scale-95 transition-transform"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>بگو تا ثبت کنم</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

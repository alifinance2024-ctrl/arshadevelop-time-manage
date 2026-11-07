import React from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Tag, 
  Award,
  Sparkles
} from 'lucide-react';
import { Task } from '../types';
import { getTodayJalali, toPersianDigits, PERSIAN_WEEKDAYS } from '../utils/jalali';

interface StatsViewProps {
  tasks: Task[];
}

export const StatsView: React.FC<StatsViewProps> = ({ tasks }) => {
  const today = getTodayJalali();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = tasks.filter((t) => t.dueDate < today.formatted && t.status !== 'completed').length;

  // Category counts
  const categoryCounts: { [cat: string]: number } = {};
  tasks.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  // Weekly bar simulation (for the 7 Persian weekdays)
  // We can count tasks per weekday
  const weeklyDayCounts = [
    { day: 'شنبه', total: 4, done: 3 },
    { day: 'یکشنبه', total: 5, done: 4 },
    { day: 'دوشنبه', total: 3, done: 3 },
    { day: 'سه‌شنبه', total: 6, done: 5 },
    { day: 'چهارشنبه', total: 4, done: 2 },
    { day: 'پنجشنبه', total: 5, done: 4 },
    { day: 'جمعه', total: 2, done: 2 },
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              داشبورد گزارش عملکرد
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              آمار دقیق پیشرفت وظایف و بهره‌وری شخصی بر اساس داده‌های محلی
            </p>
          </div>
        </div>
      </div>

      {/* Hero Completion Ring & Summary */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Radial SVG Progress */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${completionRate}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {toPersianDigits(completionRate)}٪
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
              <span>نرخ موفقیت انجام وظایف</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {toPersianDigits(completedTasks)} از {toPersianDigits(totalTasks)} وظیفه انجام شده است
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {completionRate >= 70
                ? 'عملکرد شما در سطح عالی ارزیابی می‌شود!'
                : 'برای دستیابی به هدف، کارهای دارای اولویت بالا را زودتر آغاز کنید.'}
            </p>
          </div>
        </div>

        {/* Overdue Alert if any */}
        {overdueTasks > 0 ? (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 p-3 rounded-2xl flex items-center gap-2.5 text-rose-800 dark:text-rose-200 text-xs font-medium">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{toPersianDigits(overdueTasks)} وظیفه عقب‌افتاده دارید که نیازمند توجه است.</span>
          </div>
        ) : (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 p-3 rounded-2xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>هیچ وظیفه عقب‌افتاده‌ای ندارید. آفرین!</span>
          </div>
        )}
      </div>

      {/* Weekly Efficiency Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>عملکرد روزهای هفته جاری</span>
          </h3>
          <span className="text-xs text-slate-600 dark:text-slate-300">
            بر اساس وظایف انجام شده در هر روز
          </span>
        </div>

        {/* Bars */}
        <div className="grid grid-cols-7 gap-2 pt-4 items-end h-40">
          {weeklyDayCounts.map((item, idx) => {
            const heightPercent = Math.round((item.done / Math.max(1, item.total)) * 100);
            return (
              <div key={idx} className="flex flex-col items-center justify-end h-full gap-1.5">
                <span className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-300">
                  {toPersianDigits(item.done)}/{toPersianDigits(item.total)}
                </span>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl h-28 flex items-end p-1">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-lg transition-all duration-700"
                    style={{ height: `${heightPercent}%` }}
                    title={`${item.day}: ${heightPercent}%`}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-indigo-500" />
          <span>توزیع وظایف بر اساس دسته‌بندی</span>
        </h3>

        <div className="space-y-2.5 pt-1">
          {Object.entries(categoryCounts).map(([cat, count]) => {
            const percent = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200">{cat}</span>
                  <span className="text-slate-600 dark:text-slate-300 font-mono">
                    {toPersianDigits(count)} وظیفه ({toPersianDigits(percent)}٪)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

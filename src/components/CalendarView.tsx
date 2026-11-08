import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Tag
} from 'lucide-react';
import { Task } from '../types';
import { 
  getTodayJalali, 
  generateJalaliMonthGrid, 
  toPersianDigits, 
  formatJalaliHuman, 
  PERSIAN_WEEKDAYS, 
  PERSIAN_MONTH_NAMES 
} from '../utils/jalali';

interface CalendarViewProps {
  tasks: Task[];
  activeAppDate: import('../utils/jalali').ActiveJalaliDate;
  onSelectTask: (task: Task) => void;
  onOpenManualAddForDate: (jalaliDate: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  activeAppDate,
  onSelectTask,
  onOpenManualAddForDate
}) => {
  const today = activeAppDate;
  const [currentYear, setCurrentYear] = useState(today.jy);
  const [currentMonth, setCurrentMonth] = useState(today.jm);
  const [selectedDate, setSelectedDate] = useState(today.formatted);

  const monthGrid = generateJalaliMonthGrid(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Tasks for the currently selected day
  const tasksForSelectedDate = tasks.filter((t) => t.dueDate === selectedDate && t.status !== 'cancelled');

  return (
    <div className="space-y-5 pb-6">
      {/* Calendar Month Navigation Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                تقویم شمسی
              </h2>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {monthGrid.monthName} {toPersianDigits(monthGrid.year)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="ماه قبل"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setCurrentYear(today.jy);
                setCurrentMonth(today.jm);
                setSelectedDate(today.formatted);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              برو به امروز
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="ماه بعد"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekday Names row */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {PERSIAN_WEEKDAYS.map((wd, idx) => (
            <div key={idx} className="text-[11px] font-bold text-slate-600 dark:text-slate-300 py-1">
              {wd.replace('شنبه', 'ش').replace('یکش', '۱ش').replace('دوش', '۲ش').replace('سه‌ش', '۳ش').replace('چهارش', '۴ش').replace('پنجش', '۵ش').replace('جمعه', 'ج')}
            </div>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-1.5">
          {monthGrid.days.map((item, idx) => {
            const isToday = item.jalaliDateStr === today.formatted;
            const isSelected = item.jalaliDateStr === selectedDate;
            const countTasks = tasks.filter((t) => t.dueDate === item.jalaliDateStr && t.status !== 'cancelled').length;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(item.jalaliDateStr)}
                className={`min-h-[52px] sm:min-h-[60px] p-1.5 rounded-2xl flex flex-col items-center justify-between transition-all relative ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : isToday
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold'
                    : item.isCurrentMonth
                    ? 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'bg-transparent text-slate-300 dark:text-slate-700 hover:text-slate-500'
                }`}
              >
                <span className="text-xs sm:text-sm font-semibold">
                  {toPersianDigits(item.dayNumber)}
                </span>

                {/* Task counter dot or badge */}
                {countTasks > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white text-emerald-800'
                        : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                    }`}
                  >
                    {toPersianDigits(countTasks)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              برنامه {formatJalaliHuman(selectedDate)}
            </h2>
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {toPersianDigits(tasksForSelectedDate.length)} وظیفه در این روز
            </span>
          </div>

          <button
            onClick={() => onOpenManualAddForDate(selectedDate)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ثبت کار برای این روز</span>
          </button>
        </div>

        {tasksForSelectedDate.length === 0 ? (
          <div className="p-6 text-center text-slate-600 dark:text-slate-300 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            هیچ وظیفه‌ای برای این روز ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-2">
            {tasksForSelectedDate.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {t.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    <span>{t.category}</span>
                    {t.dueTime && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          ساعت {toPersianDigits(t.dueTime)}
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{toPersianDigits(t.estimatedDurationMinutes)} دقیقه</span>
                  </div>
                </div>

                <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${
                  t.status === 'completed'
                    ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/70'
                    : 'text-slate-600 bg-slate-200 dark:bg-slate-700'
                }`}>
                  {t.status === 'completed' ? 'انجام شد' : 'در انتظار'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

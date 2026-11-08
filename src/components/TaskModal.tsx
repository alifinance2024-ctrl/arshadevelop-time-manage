import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Calendar, 
  Clock, 
  Tag, 
  AlertCircle, 
  Repeat, 
  Hourglass
} from 'lucide-react';
import { Task, Priority, RecurrenceType, TaskStatus } from '../types';
import { 
  getTodayJalali, 
  PERSIAN_MONTH_NAMES, 
  toPersianDigits, 
  toEnglishDigits,
  getWeekDaysWithDates 
} from '../utils/jalali';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>, existingId?: string) => void;
  taskToEdit?: Task | null;
  customCategories: string[];
  activeAppDate?: import('../utils/jalali').ActiveJalaliDate;
}

const DEFAULT_CATEGORIES = [
  'امور اداری',
  'امور قرآنی و فرهنگی',
  'امور شخصی',
  'خانواده',
  'یادگیری و آموزش',
  'مالی و سرمایه‌گذاری',
  'ورزش و سلامتی',
  'سایر'
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  customCategories,
  activeAppDate
}) => {
  const today = activeAppDate || getTodayJalali();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('امور اداری');
  const [dueYear, setDueYear] = useState(today.jy);
  const [dueMonth, setDueMonth] = useState(today.jm);
  const [dueDay, setDueDay] = useState(today.jd);
  const [dueTime, setDueTime] = useState('');
  const [isTimeFixed, setIsTimeFixed] = useState(false);
  const [duration, setDuration] = useState(30);
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('registered');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category);
      const parts = taskToEdit.dueDate.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
      if (parts.length === 3) {
        setDueYear(parts[0]);
        setDueMonth(parts[1]);
        setDueDay(parts[2]);
      }
      setDueTime(taskToEdit.dueTime || '');
      setIsTimeFixed(Boolean(taskToEdit.isTimeFixed));
      setDuration(taskToEdit.estimatedDurationMinutes || 30);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setRecurrence(taskToEdit.recurrence);
    } else {
      setTitle('');
      setDescription('');
      setCategory('امور اداری');
      setDueYear(today.jy);
      setDueMonth(today.jm);
      setDueDay(today.jd);
      setDueTime('');
      setIsTimeFixed(false);
      setDuration(30);
      setPriority('medium');
      setStatus('registered');
      setRecurrence('none');
    }
  }, [taskToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const formattedDate = `${dueYear}/${pad(dueMonth)}/${pad(dueDay)}`;

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        category,
        dueDate: formattedDate,
        dueTime: dueTime.trim() ? dueTime : undefined,
        estimatedDurationMinutes: duration,
        priority,
        status: dueTime.trim() && status === 'registered' ? 'scheduled' : status,
        recurrence,
        source: taskToEdit ? taskToEdit.source : 'manual',
        isTimeFixed: Boolean(dueTime.trim() && isTimeFixed)
      },
      taskToEdit?.id
    );

    onClose();
  };

  if (!isOpen) return null;

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));

  const weekDaysWithDates = getWeekDaysWithDates(today);

  const formatDurationHuman = (mins: number) => {
    if (mins < 60) return `${toPersianDigits(mins)} دقیقه`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) return `${toPersianDigits(h)} ساعت`;
    return `${toPersianDigits(h)} ساعت و ${toPersianDigits(m)} دقیقه`;
  };

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const currentSelectedDateStr = `${dueYear}/${pad(dueMonth)}/${pad(dueDay)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {taskToEdit ? 'ویرایش وظیفه' : 'ثبت دستی وظیفه جدید'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              عنوان وظیفه <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً: تماس با مدیر مدرسه"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm rounded-xl p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              توضیحات و یادداشت (اختیاری)
            </label>
            <textarea
              rows={2}
              placeholder="توضیحات تکمیلی یا جزئیات مربوط به وظیفه..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm rounded-xl p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>دسته‌بندی</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm rounded-xl p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Jalali Date Selection */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>تاریخ انجام (تقویم شمسی):</span>
              </label>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {currentSelectedDateStr}
              </span>
            </div>

            {/* Quick Weekday Buttons: Day Name/Number + Exact Date */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-medium">
                انتخاب روز هفته (نمایش همزمان نام روز و تاریخ دقیق):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5 text-[11px]">
                {weekDaysWithDates.map((w) => {
                  const isSelected = currentSelectedDateStr === w.jalaliDate;
                  return (
                    <button
                      key={w.dayNumber}
                      type="button"
                      onClick={() => {
                        const parts = w.jalaliDate.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
                        if (parts.length === 3) {
                          setDueYear(parts[0]);
                          setDueMonth(parts[1]);
                          setDueDay(parts[2]);
                        }
                      }}
                      className={`py-2 px-1 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm ring-2 ring-emerald-500/30'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="block text-[10px] opacity-90 leading-tight">
                        {w.name} (روز {toPersianDigits(w.dayNumber)})
                      </span>
                      <span className="block text-[11px] font-bold">
                        {w.shortLabel}
                      </span>
                      {w.isToday && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-slate-900 font-bold leading-none">
                          امروز
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              {/* Day */}
              <div>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 mb-0.5 block">روز:</span>
                <select
                  value={dueDay}
                  onChange={(e) => setDueDay(parseInt(e.target.value, 10))}
                  className="w-full text-xs rounded-lg p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {toPersianDigits(d)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 mb-0.5 block">ماه:</span>
                <select
                  value={dueMonth}
                  onChange={(e) => setDueMonth(parseInt(e.target.value, 10))}
                  className="w-full text-xs rounded-lg p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {PERSIAN_MONTH_NAMES.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 mb-0.5 block">سال:</span>
                <select
                  value={dueYear}
                  onChange={(e) => setDueYear(parseInt(e.target.value, 10))}
                  className="w-full text-xs rounded-lg p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                >
                  {[today.jy, today.jy + 1, today.jy + 2].map((y) => (
                    <option key={y} value={y}>
                      {toPersianDigits(y)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-teal-500" />
                <span>ساعت انجام (اختیاری)</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full text-sm rounded-xl p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            {/* Duration: Custom Minutes + Chips */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Hourglass className="w-3.5 h-3.5 text-amber-500" />
                  <span>مدت‌زمان (دلخواه):</span>
                </label>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                  {formatDurationHuman(duration)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="flex-1 text-sm rounded-xl p-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="مدت به دقیقه..."
                />
                <span className="text-xs text-slate-500 font-medium shrink-0">دقیقه</span>
              </div>

              {/* Quick preset chips */}
              <div className="flex flex-wrap gap-1 pt-1.5">
                {[15, 30, 45, 60, 90, 120, 180].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-medium transition-colors ${
                      duration === mins
                        ? 'bg-amber-500 text-white border-amber-500 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {mins < 60 ? `${toPersianDigits(mins)}د` : `${toPersianDigits(mins / 60)}س`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Priority & Recurrence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>اولویت</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full text-sm rounded-xl p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="low">پایین (عادی)</option>
                <option value="medium">متوسط</option>
                <option value="high">بالا (مهم)</option>
                <option value="urgent">فوری و حیاتی</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                <Repeat className="w-3.5 h-3.5 text-sky-500" />
                <span>تکرار وظیفه</span>
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full text-sm rounded-xl p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="none">بدون تکرار (یکبار)</option>
                <option value="daily">هر روز (روزانه)</option>
                <option value="weekly">هر هفته (هفتگی)</option>
                <option value="monthly">هر ماه (ماهانه)</option>
              </select>
            </div>
          </div>

          {/* Fixed Time Lock check */}
          {dueTime && (
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isTimeFixed}
                onChange={(e) => setIsTimeFixed(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                ساعت این کار قطعی است و الگوریتم برنامه‌ریز نباید آن را جابه‌جا کند.
              </span>
            </label>
          )}

          {/* Action buttons pinned at bottom */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 max-w-xs px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{taskToEdit ? 'ذخیره تغییرات' : 'ثبت وظیفه'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

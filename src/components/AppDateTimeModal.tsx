import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Calendar, 
  Clock, 
  RotateCcw, 
  Sparkles,
  CalendarDays,
  ShieldCheck
} from 'lucide-react';
import { UserSettings } from '../types';
import { 
  getTodayJalali, 
  getAppActiveJalali, 
  toPersianDigits, 
  toEnglishDigits, 
  PERSIAN_MONTH_NAMES, 
  PERSIAN_DAY_DEFINITIONS,
  addDaysToJalali,
  formatJalaliHuman,
  jalaliToGregorian
} from '../utils/jalali';

interface AppDateTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const AppDateTimeModal: React.FC<AppDateTimeModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const systemToday = getTodayJalali();
  const activeDate = getAppActiveJalali(settings);

  const [useCustom, setUseCustom] = useState(settings.useCustomAppDateTime);
  const [selectedYear, setSelectedYear] = useState(activeDate.jy);
  const [selectedMonth, setSelectedMonth] = useState(activeDate.jm);
  const [selectedDay, setSelectedDay] = useState(activeDate.jd);
  const [selectedHour, setSelectedHour] = useState(
    parseInt(activeDate.activeTime.split(':')[0] || '9', 10)
  );
  const [selectedMinute, setSelectedMinute] = useState(
    parseInt(activeDate.activeTime.split(':')[1] || '0', 10)
  );

  useEffect(() => {
    if (isOpen) {
      setUseCustom(Boolean(settings.useCustomAppDateTime));
      const cur = getAppActiveJalali(settings);
      setSelectedYear(cur.jy);
      setSelectedMonth(cur.jm);
      setSelectedDay(cur.jd);
      const [h, m] = (settings.customAppTime || cur.activeTime || '09:00').split(':').map((s) => parseInt(s, 10));
      setSelectedHour(isNaN(h) ? 9 : h);
      setSelectedMinute(isNaN(m) ? 0 : m);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  // Compute weekday for selected values
  const { gy, gm, gd } = jalaliToGregorian(selectedYear, selectedMonth, selectedDay);
  const tempDate = new Date(gy, gm - 1, gd);
  const dowIndex = (tempDate.getDay() + 1) % 7; // 0 = شنبه, ..., 6 = جمعه
  const dayDef = PERSIAN_DAY_DEFINITIONS[dowIndex];

  const handleApply = () => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const formattedDate = `${selectedYear}/${pad(selectedMonth)}/${pad(selectedDay)}`;
    const formattedTime = `${pad(selectedHour)}:${pad(selectedMinute)}`;

    onUpdateSettings({
      useCustomAppDateTime: useCustom,
      customAppDate: formattedDate,
      customAppTime: formattedTime
    });

    onClose();
  };

  const handleResetToRealSystem = () => {
    setUseCustom(false);
    setSelectedYear(systemToday.jy);
    setSelectedMonth(systemToday.jm);
    setSelectedDay(systemToday.jd);
    const now = new Date();
    setSelectedHour(now.getHours());
    setSelectedMinute(now.getMinutes());

    onUpdateSettings({
      useCustomAppDateTime: false,
      customAppDate: systemToday.formatted,
      customAppTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    });

    onClose();
  };

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                تنظیم تاریخ و ساعت نرم‌افزار
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                عدم اجبار به تاریخ دیفالت سیستم؛ تعیین زمان مبنا برای کل برنامه
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Custom Date Mode Switch */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  حالت تاریخ دلخواه نرم‌افزار
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  اگر فعال باشد، تاریخ و ساعت انتخابی شما به عنوان زمان «امروز» در کل برنامه اعمال می‌شود.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={(e) => setUseCustom(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            {!useCustom && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>هم‌اکنون تاریخ واقعی ساعت سیستم در حال استفاده است ({systemToday.humanReadable}).</span>
              </div>
            )}
          </div>

          {/* Active Date & Day Number Indicator */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-200 font-medium">تاریخ و روز مبنا:</span>
              <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
                {dayDef.ordinalName} (روز {toPersianDigits(dayDef.dayNumber)})
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold">
              {dayDef.name} {toPersianDigits(selectedDay)} {PERSIAN_MONTH_NAMES[selectedMonth - 1]} {toPersianDigits(selectedYear)}
            </h3>
            <div className="flex items-center gap-2 text-xs text-emerald-100 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>ساعت: {toPersianDigits(pad(selectedHour))}:{toPersianDigits(pad(selectedMinute))}</span>
              <span aria-hidden="true">·</span>
              <span>کد روز: {dayDef.dayNumber} از ۷</span>
            </div>
          </div>

          {/* Date Pickers */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              انتخاب روز، ماه و سال شمسی:
            </span>

            <div className="grid grid-cols-3 gap-2">
              {/* Day */}
              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-300 mb-1 block">روز:</label>
                <select
                  value={selectedDay}
                  onChange={(e) => {
                    setSelectedDay(parseInt(e.target.value, 10));
                    setUseCustom(true);
                  }}
                  className="w-full text-xs sm:text-sm rounded-xl p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
                <label className="text-[11px] text-slate-600 dark:text-slate-300 mb-1 block">ماه:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(parseInt(e.target.value, 10));
                    setUseCustom(true);
                  }}
                  className="w-full text-xs sm:text-sm rounded-xl p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
                <label className="text-[11px] text-slate-600 dark:text-slate-300 mb-1 block">سال:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(parseInt(e.target.value, 10));
                    setUseCustom(true);
                  }}
                  className="w-full text-xs sm:text-sm rounded-xl p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                >
                  {[1402, 1403, 1404, 1405, 1406, 1407, 1408].map((y) => (
                    <option key={y} value={y}>
                      {toPersianDigits(y)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              ساعت نرم‌افزار (۲۴ ساعته):
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-300 mb-1 block">ساعت:</label>
                <select
                  value={selectedHour}
                  onChange={(e) => {
                    setSelectedHour(parseInt(e.target.value, 10));
                    setUseCustom(true);
                  }}
                  className="w-full text-xs sm:text-sm rounded-xl p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                >
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <option key={h} value={h}>
                      ساعت {toPersianDigits(pad(h))}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-300 mb-1 block">دقیقه:</label>
                <select
                  value={selectedMinute}
                  onChange={(e) => {
                    setSelectedMinute(parseInt(e.target.value, 10));
                    setUseCustom(true);
                  }}
                  className="w-full text-xs sm:text-sm rounded-xl p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>
                      {toPersianDigits(pad(m))} دقیقه
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
              تنظیمات سریع روزهای هفته (معادل شماره ۱ تا ۷):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              {PERSIAN_DAY_DEFINITIONS.map((def) => {
                const isSelected = dayDef.dayNumber === def.dayNumber;
                return (
                  <button
                    key={def.dayNumber}
                    type="button"
                    onClick={() => {
                      // Adjust day to match this weekday in the current week
                      const diff = def.dowIndex - dowIndex;
                      const newJalali = addDaysToJalali(`${selectedYear}/${pad(selectedMonth)}/${pad(selectedDay)}`, diff);
                      const parts = newJalali.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
                      if (parts.length === 3) {
                        setSelectedYear(parts[0]);
                        setSelectedMonth(parts[1]);
                        setSelectedDay(parts[2]);
                        setUseCustom(true);
                      }
                    }}
                    className={`p-2 rounded-xl border text-right transition-colors ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="block font-bold">{def.name}</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">
                      {def.ordinalName} (روز {toPersianDigits(def.dayNumber)})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToRealSystem}
            className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازگشت به تاریخ واقعی سیستم</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>اعمال تاریخ در نرم‌افزار</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

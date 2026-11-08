import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Smartphone, 
  Maximize2, 
  Code2, 
  Clock, 
  CalendarDays,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { getTodayJalali, toPersianDigits } from '../utils/jalali';
import { UserSettings } from '../types';

interface HeaderProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  isPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
  onOpenCodeExport: () => void;
  onOpenWidgetPreview: () => void;
  onOpenDateTimeModal: () => void;
  activeAppDate: import('../utils/jalali').ActiveJalaliDate;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  isPhoneFrame,
  onTogglePhoneFrame,
  onOpenCodeExport,
  onOpenWidgetPreview,
  onOpenDateTimeModal,
  activeAppDate
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    if (settings.useCustomAppDateTime && settings.customAppTime) {
      setCurrentTime(toPersianDigits(settings.customAppTime));
      return;
    }

    const update = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${toPersianDigits(h)}:${toPersianDigits(m)}:${toPersianDigits(s)}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [settings.useCustomAppDateTime, settings.customAppTime]);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleSound = () => {
    onUpdateSettings({ soundEnabled: !settings.soundEnabled });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                رفیق یار
              </h1>
              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded px-1.5 py-0.5">
                همراه من
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate hidden sm:block">
              «تو فقط بگو، همراه من به خاطر می‌سپارد»
            </p>
          </div>
        </div>

        {/* Date & Time Live Display (Clickable to change app date & time) */}
        <button
          onClick={onOpenDateTimeModal}
          title="کلیک برای تنظیم دستی تاریخ و ساعت نرم‌افزار"
          className={`hidden md:flex items-center gap-3 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ${
            settings.useCustomAppDateTime
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 hover:border-amber-400'
              : 'bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <CalendarDays className={`w-3.5 h-3.5 ${settings.useCustomAppDateTime ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            <span className="font-semibold">{activeAppDate.dayName}</span>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-white/70 dark:bg-slate-900/60 px-1.5 py-0.5 rounded">
              {activeAppDate.dayOrdinalName}
            </span>
            <span>{toPersianDigits(activeAppDate.jd)} {activeAppDate.monthName} {toPersianDigits(activeAppDate.jy)}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">|</span>

          <div className="flex items-center gap-1.5 font-mono tabular-nums">
            <Clock className={`w-3.5 h-3.5 ${settings.useCustomAppDateTime ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'}`} />
            <span>{currentTime}</span>
          </div>

          {settings.useCustomAppDateTime ? (
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
              تاریخ دستی
            </span>
          ) : (
            <span className="text-[10px] text-slate-600 dark:text-slate-300">
              (تغییر)
            </span>
          )}
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Change Date Button */}
          <button
            onClick={onOpenDateTimeModal}
            title="تنظیم تاریخ و ساعت نرم‌افزار"
            className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              settings.useCustomAppDateTime
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">تنظیم تاریخ</span>
          </button>

          {/* Widget Preview Button */}
          <button
            onClick={onOpenWidgetPreview}
            title="پیش‌نمایش ویجت اندروید"
            className="h-8 px-2.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">ویجت</span>
          </button>

          {/* Android Kotlin Source Code Export Modal */}
          <button
            onClick={onOpenCodeExport}
            title="سورس‌کد اندروید (Kotlin/Room)"
            className="h-8 px-2.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors flex items-center gap-1"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">کد اندروید</span>
          </button>

          {/* Device Frame View Toggle (POCO M4 vs Responsive Fullscreen) */}
          <button
            onClick={onTogglePhoneFrame}
            title={isPhoneFrame ? "نمایش تمام‌صفحه" : "نمایش در قاب شیائومی POCO M4"}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isPhoneFrame ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            title={settings.soundEnabled ? "صدا فعال است" : "صدا غیرفعال است"}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-teal-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            title={settings.theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};

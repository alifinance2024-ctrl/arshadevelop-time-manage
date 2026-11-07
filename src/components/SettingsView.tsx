import React, { useState, useRef } from 'react';
import { 
  Settings, 
  User, 
  Clock, 
  Coffee, 
  Bell, 
  Moon, 
  Sun, 
  Smartphone, 
  Cpu, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Plane,
  Save
} from 'lucide-react';
import { UserSettings, Task } from '../types';
import { toPersianDigits } from '../utils/jalali';
import { exportBackupJSON, restoreBackupFromJSON } from '../utils/storage';

interface SettingsViewProps {
  settings: UserSettings;
  tasks: Task[];
  onSaveSettings: (newSettings: UserSettings) => void;
  onRestoreBackup: (tasks: Task[], settings: UserSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  tasks,
  onSaveSettings,
  onRestoreBackup
}) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [newCatInput, setNewCatInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [downloadSimulation, setDownloadSimulation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  const handleAddCategory = () => {
    if (!newCatInput.trim()) return;
    const cat = newCatInput.trim();
    if (!formData.customCategories.includes(cat)) {
      const updated = {
        ...formData,
        customCategories: [...formData.customCategories, cat]
      };
      setFormData(updated);
      onSaveSettings(updated);
    }
    setNewCatInput('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    const updated = {
      ...formData,
      customCategories: formData.customCategories.filter((c) => c !== catToRemove)
    };
    setFormData(updated);
    onSaveSettings(updated);
  };

  const handleExportBackup = () => {
    exportBackupJSON(tasks, formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreBackupFromJSON(content);
      if (res.success && res.tasks) {
        onRestoreBackup(res.tasks, res.settings || formData);
        alert('نسخه پشتیبان با موفقیت بازیابی شد.');
      } else {
        alert(res.error || 'خطا در بازیابی فایل.');
      }
    };
    reader.readAsText(file);
  };

  const simulateDownloadWhisper = () => {
    setDownloadSimulation(true);
    setTimeout(() => {
      setDownloadSimulation(false);
      setFormData((prev) => ({ ...prev, whisperStatus: 'ready' }));
      onSaveSettings({ ...formData, whisperStatus: 'ready' });
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              تنظیمات شخصی و سیستم
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              شخصی‌سازی ساعات کاری، مدل Whisper، پشتیبان‌گیری و تم
            </p>
          </div>
        </div>

        {saveSuccessMsg && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-xl flex items-center gap-1 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>تنظیمات ذخیره شد</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* User Profile */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>اطلاعات کاربر</span>
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              نام یا عنوان شما در برنامه:
            </label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              className="w-full text-sm rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Working Hours & Break Settings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>تنظیمات ساعات کاری و الگوریتم برنامه‌ریز</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                ساعت شروع روز کاری:
              </label>
              <input
                type="time"
                value={formData.workDayStart}
                onChange={(e) => setFormData({ ...formData, workDayStart: e.target.value })}
                className="w-full text-sm rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                ساعت پایان روز کاری:
              </label>
              <input
                type="time"
                value={formData.workDayEnd}
                onChange={(e) => setFormData({ ...formData, workDayEnd: e.target.value })}
                className="w-full text-sm rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                فاصله استراحت بین کارها:
              </label>
              <select
                value={formData.breakDurationMinutes}
                onChange={(e) => setFormData({ ...formData, breakDurationMinutes: parseInt(e.target.value, 10) })}
                className="w-full text-sm rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value={10}>۱۰ دقیقه</option>
                <option value={15}>۱۵ دقیقه (پیشنهادی)</option>
                <option value={20}>۲۰ دقیقه</option>
                <option value={30}>۳۰ دقیقه</option>
              </select>
            </div>
          </div>
        </div>

        {/* On-Device Whisper Model Manager (Prompt Section 3 requirement) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>مدیریت مدل تشخیص گفتار محلی (Whisper On-Device)</span>
            </h3>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Plane className="w-3 h-3" />
              <span>آماده حالت Airplane Mode (آفلاین)</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            مدل‌های whisper.cpp مستقیماً روی پردازنده دستگاه ذخیره شده و هیچ وابستگی به اینترنت یا سرور ابری ندارند.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tiny */}
            <div
              onClick={() => setFormData({ ...formData, whisperModel: 'tiny' })}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                formData.whisperModel === 'tiny'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">مدل سبک (Tiny)</span>
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">۷۵ مگابایت</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                بسیار سریع، مصرف باتری کم، مناسب گوشی‌های با توان معمولی.
              </p>
            </div>

            {/* Base (Recommended for POCO M4 with 8GB RAM) */}
            <div
              onClick={() => setFormData({ ...formData, whisperModel: 'base' })}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                formData.whisperModel === 'base'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">مدل استاندارد (Base)</span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">۱۴۲ مگابایت (پیشنهادی)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                توازن ایده‌آل سرعت و دقت زبان فارسی برای Xiaomi POCO M4 با رم ۸ گیگابایت.
              </p>
            </div>

            {/* Small */}
            <div
              onClick={() => setFormData({ ...formData, whisperModel: 'small' })}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                formData.whisperModel === 'small'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">مدل دقیق (Small)</span>
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">۴۶۶ مگابایت</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                بالاترین دقت تشخیص واژگان تخصصی فارسی، نیازمند حافظه بیشتر.
              </p>
            </div>
          </div>
        </div>

        {/* Custom Categories Manager */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            مدیریت دسته‌بندی‌های اختصاصی
          </h3>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="نام دسته‌بندی جدید (مثلاً: پروژه‌های ساختمانی)..."
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
              className="flex-1 text-xs rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن</span>
            </button>
          </div>

          {formData.customCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.customCategories.map((cat) => (
                <span
                  key={cat}
                  className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-xl flex items-center gap-1.5"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Backup & Restore (Prompt Section 15 requirement) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>پشتیبان‌گیری و بازیابی اطلاعات (فرمت JSON آفلاین)</span>
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            شما می‌توانید تمام اطلاعات وظایف، برنامه‌ها و تنظیمات را به صورت یک فایل استاندارد JSON در حافظه گوشی ذخیره کنید یا اطلاعات را به دستگاه دیگری منتقل نمایید.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>دانلود نسخه پشتیبان (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>بازیابی از فایل پشتیبان</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* POCO M4 Hardware Specs & Android Environment */}
        <div className="bg-slate-100/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>مشخصات دستگاه آزمایشی: Xiaomi POCO M4 (8GB RAM)</span>
          </div>
          <p>
            سیستم‌عامل هدف: اندروید API 26+ (Android 8.0 تا 14) · بهینه‌سازی شده برای معماری ۶۴ بیتی ARM64 و اجرای محلی whisper.cpp بدون فشار به باتری.
          </p>
        </div>

        {/* Save CTA */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره کلیه تنظیمات</span>
          </button>
        </div>
      </form>
    </div>
  );
};

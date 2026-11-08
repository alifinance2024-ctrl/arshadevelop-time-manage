import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Check, 
  X, 
  Sparkles, 
  Calendar, 
  Clock, 
  Tag, 
  AlertCircle, 
  RefreshCw, 
  Edit3,
  HelpCircle,
  Cpu,
  Lock,
  Repeat,
  Hourglass,
  Sliders
} from 'lucide-react';
import { Task, ParsedVoiceResult, Priority, RecurrenceType } from '../types';
import { parsePersianVoiceCommand } from '../utils/persianNlpParser';
import { 
  toPersianDigits, 
  toEnglishDigits, 
  formatJalaliHuman, 
  ActiveJalaliDate, 
  PERSIAN_MONTH_NAMES, 
  PERSIAN_DAY_DEFINITIONS,
  addDaysToJalali,
  jalaliToGregorian,
  getWeekDaysWithDates
} from '../utils/jalali';
import { audioService, OfflineSpeechController, isBrowserSpeechSupported } from '../utils/audioService';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  customCategories: string[];
  activeAppDate: ActiveJalaliDate;
}

const SAMPLE_VOICE_COMMANDS = [
  'شنبه ساعت ۹ با مدیر مدرسه تماس بگیرم.',
  'روز ششم گزارش مسابقات قرآن را ارسال کنم.',
  'هر روز ساعت ۷ صبح ورزش کنم.',
  'روز سوم نامه اداره را آماده کنم.',
  'فردا دو ساعت برای یادگیری هوش مصنوعی وقت بگذارم.'
];

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

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  customCategories,
  activeAppDate
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioWaves, setAudioWaves] = useState<number[]>([15, 25, 40, 20, 35, 55, 30, 45, 60, 25, 35, 20]);
  const [clarificationResponse, setClarificationResponse] = useState('');

  // Editable fields extracted from voice (Prompt enhancement 1)
  const [parsedResult, setParsedResult] = useState<ParsedVoiceResult | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('امور اداری');
  const [editYear, setEditYear] = useState(activeAppDate.jy);
  const [editMonth, setEditMonth] = useState(activeAppDate.jm);
  const [editDay, setEditDay] = useState(activeAppDate.jd);
  const [editTime, setEditTime] = useState('');
  const [editIsFixed, setEditIsFixed] = useState(false);
  const [editDuration, setEditDuration] = useState(30);
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceType>('none');

  const speechControllerRef = useRef<OfflineSpeechController | null>(null);
  const timerRef = useRef<any>(null);
  const waveIntervalRef = useRef<any>(null);

  // Initialize Speech Controller
  useEffect(() => {
    if (!isOpen) {
      handleCancel();
      return;
    }

    if (isBrowserSpeechSupported()) {
      speechControllerRef.current = new OfflineSpeechController({
        onStart: () => {
          setIsRecording(true);
        },
        onResult: (text) => {
          setTranscript(text);
          processSpeech(text);
        },
        onError: (err) => {
          console.warn('Speech error:', err);
        },
        onEnd: () => {
          setIsRecording(false);
        }
      });
    }

    startRecording();

    return () => {
      stopRecording();
    };
  }, [isOpen, activeAppDate]);

  const startRecording = () => {
    setTranscript('');
    setParsedResult(null);
    setRecordingSeconds(0);
    setIsRecording(true);
    audioService.playStartRecordChirp();

    if (speechControllerRef.current) {
      speechControllerRef.current.start();
    }

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    waveIntervalRef.current = setInterval(() => {
      setAudioWaves([
        Math.floor(Math.random() * 50) + 10,
        Math.floor(Math.random() * 65) + 15,
        Math.floor(Math.random() * 80) + 20,
        Math.floor(Math.random() * 45) + 10,
        Math.floor(Math.random() * 70) + 15,
        Math.floor(Math.random() * 95) + 20,
        Math.floor(Math.random() * 60) + 15,
        Math.floor(Math.random() * 85) + 20,
        Math.floor(Math.random() * 50) + 10,
        Math.floor(Math.random() * 75) + 15,
        Math.floor(Math.random() * 40) + 10,
        Math.floor(Math.random() * 30) + 10,
      ]);
    }, 120);
  };

  const stopRecording = () => {
    setIsRecording(false);
    audioService.playStopRecordChirp();

    if (speechControllerRef.current) {
      speechControllerRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
  };

  const handleSelectSample = (sample: string) => {
    stopRecording();
    setTranscript(sample);
    processSpeech(sample);
  };

  const processSpeech = (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);

    // Simulate whisper.cpp local on-device inference delay
    setTimeout(() => {
      const parsed = parsePersianVoiceCommand(text, activeAppDate);
      setParsedResult(parsed);

      // Populate interactive editable fields
      setEditTitle(parsed.cleanTitle);
      setEditCategory(parsed.category);
      setEditTime(parsed.dueTime || '');
      setEditIsFixed(parsed.isTimeFixed);
      setEditDuration(parsed.durationMinutes);
      setEditPriority(parsed.priority);
      setEditRecurrence(parsed.recurrence);

      // Parse Jalali YYYY/MM/DD
      const parts = parsed.dueDate.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
      if (parts.length === 3) {
        setEditYear(parts[0]);
        setEditMonth(parts[1]);
        setEditDay(parts[2]);
      }

      setIsProcessing(false);
    }, 150);
  };

  const handleManualTranscriptChange = (newText: string) => {
    setTranscript(newText);
    if (newText.trim().length > 3) {
      const parsed = parsePersianVoiceCommand(newText, activeAppDate);
      setParsedResult(parsed);
      setEditTitle(parsed.cleanTitle);
      setEditCategory(parsed.category);
      if (parsed.dueTime) setEditTime(parsed.dueTime);
    }
  };

  const handleApplyClarification = () => {
    if (!clarificationResponse.trim()) return;
    const combined = `${transcript} ${clarificationResponse}`;
    setTranscript(combined);
    processSpeech(combined);
    setClarificationResponse('');
  };

  // Helper to set date to a specific weekday (1 to 7)
  const setDateToDayNumber = (targetDayNumber: number) => {
    // Current day number of activeAppDate
    const curDow = activeAppDate.dayOfWeek;
    const targetDow = targetDayNumber - 1;
    let daysAhead = (targetDow - curDow + 7) % 7;
    if (daysAhead === 0) daysAhead = 0; // or 7 if want next week

    const newJalali = addDaysToJalali(activeAppDate.formatted, daysAhead);
    const parts = newJalali.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
    if (parts.length === 3) {
      setEditYear(parts[0]);
      setEditMonth(parts[1]);
      setEditDay(parts[2]);
    }
  };

  const setDateOffset = (days: number) => {
    const newJalali = addDaysToJalali(activeAppDate.formatted, days);
    const parts = newJalali.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
    if (parts.length === 3) {
      setEditYear(parts[0]);
      setEditMonth(parts[1]);
      setEditDay(parts[2]);
    }
  };

  const handleConfirmAndSave = () => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const finalFormattedDate = `${editYear}/${pad(editMonth)}/${pad(editDay)}`;

    onSaveTask({
      title: editTitle.trim() || transcript || 'وظیفه صوتی',
      description: `ثبت صوتی: «${transcript}»`,
      category: editCategory,
      dueDate: finalFormattedDate,
      dueTime: editTime.trim() ? editTime : undefined,
      estimatedDurationMinutes: editDuration,
      priority: editPriority,
      status: editTime.trim() ? 'scheduled' : 'registered',
      recurrence: editRecurrence,
      finalDeadline: parsedResult?.finalDeadline,
      source: 'voice',
      isTimeFixed: editIsFixed
    });

    audioService.playSuccessChime();
    onClose();
  };

  const handleCancel = () => {
    stopRecording();
    setTranscript('');
    setParsedResult(null);
    setClarificationResponse('');
    onClose();
  };

  if (!isOpen) return null;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const currentSelectedDateStr = `${editYear}/${pad(editMonth)}/${pad(editDay)}`;

  // Calculate day name of currently selected edit date
  const { gy, gm, gd } = jalaliToGregorian(editYear, editMonth, editDay);
  const tempD = new Date(gy, gm - 1, gd);
  const currentDowIndex = (tempD.getDay() + 1) % 7;
  const currentDayDef = PERSIAN_DAY_DEFINITIONS[currentDowIndex];

  // 7 days of the active week with day names, day numbers and exact dates
  const weekDaysWithDates = getWeekDaysWithDates(activeAppDate);

  const formatDurationHuman = (mins: number) => {
    if (mins < 60) return `${toPersianDigits(mins)} دقیقه`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) return `${toPersianDigits(h)} ساعت`;
    return `${toPersianDigits(h)} ساعت و ${toPersianDigits(m)} دقیقه`;
  };

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                ثبت صوتی با قابلیت ویرایش کامل جزئیات
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                <Cpu className="w-3 h-3" />
                <span>موتور محلی Whisper · مبنا: {activeAppDate.dayName} ({activeAppDate.dayOrdinalName})</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Visualizer & Mic status */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
            {isRecording ? (
              <div className="space-y-2.5 w-full flex flex-col items-center">
                <div className="flex items-end justify-center gap-1.5 h-12">
                  {audioWaves.map((height, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-full transition-all duration-100"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span>در حال ضبط صدا... {toPersianDigits(recordingSeconds)} ثانیه</span>
                </div>

                <button
                  onClick={stopRecording}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>توقف ضبط و تحلیل</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                <button
                  onClick={startRecording}
                  className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform mx-auto"
                  title="شروع مجدد ضبط"
                >
                  <Mic className="w-6 h-6" />
                </button>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  روی میکروفون بزنید و صحبت کنید
                </p>
              </div>
            )}
          </div>

          {/* Quick Test Samples */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
              نمونه‌های فرمان صوتی با شماره‌گذاری روزها (۱ تا ۷):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_VOICE_COMMANDS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(sample)}
                  className="text-xs text-right bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700 transition-colors"
                >
                  «{sample}»
                </button>
              ))}
            </div>
          </div>

          {/* Transcript input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>متن گفتار:</span>
              </label>
              {transcript && (
                <button
                  onClick={() => handleManualTranscriptChange('')}
                  className="text-[11px] text-slate-600 dark:text-slate-300 hover:text-rose-500"
                >
                  پاک کردن
                </button>
              )}
            </div>
            <textarea
              value={transcript}
              onChange={(e) => handleManualTranscriptChange(e.target.value)}
              placeholder="صحبت‌های شما پس از تبدیل به متن در اینجا نمایش داده می‌شود..."
              rows={2}
              className="w-full text-xs sm:text-sm rounded-xl p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Loading status */}
          {isProcessing && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>موتور هوشمند NLP در حال تحلیل روزها، ساعت و اولویت...</span>
            </div>
          )}

          {/* Interactive Details Editor (Prompt enhancement 1: Ability to change date, time and details) */}
          {(parsedResult || transcript.trim().length > 0) && !isProcessing && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    ویرایش و شخصی‌سازی جزئیات قبل از ثبت
                  </span>
                </div>
                {parsedResult?.matchedDayName && (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950 px-2 py-0.5 rounded-lg">
                    {parsedResult.matchedDayName}
                  </span>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  عنوان وظیفه:
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="عنوان وظیفه..."
                  className="w-full text-xs sm:text-sm font-semibold rounded-xl p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Date selection & Day 1 to 7 shortcuts */}
              <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    <span>تاریخ انجام:</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {currentDayDef.name} ({currentDayDef.ordinalName}) · {formatJalaliHuman(currentSelectedDateStr)}
                  </span>
                </div>

                {/* Day 1 to 7 Quick Buttons showing both Day Name/Number AND Exact Date */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-medium">
                      انتخاب روز هفته (همراه با نمایش همزمان روز و تاریخ دقیق):
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      روز {toPersianDigits(currentDayDef.dayNumber)}: {currentDayDef.name}
                    </span>
                  </div>
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
                              setEditYear(parts[0]);
                              setEditMonth(parts[1]);
                              setEditDay(parts[2]);
                            }
                          }}
                          className={`py-2 px-1 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm ring-2 ring-emerald-500/30'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
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

                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setDateOffset(0)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px]"
                  >
                    امروز
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateOffset(1)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px]"
                  >
                    فردا
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateOffset(2)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px]"
                  >
                    پس‌فردا
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateToDayNumber(6)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px]"
                  >
                    آخر هفته (پنجشنبه)
                  </button>
                </div>

                {/* Exact Year, Month, Day Selectors */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 block mb-0.5">روز:</span>
                    <select
                      value={editDay}
                      onChange={(e) => setEditDay(parseInt(e.target.value, 10))}
                      className="w-full text-xs rounded-lg p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {toPersianDigits(d)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 block mb-0.5">ماه:</span>
                    <select
                      value={editMonth}
                      onChange={(e) => setEditMonth(parseInt(e.target.value, 10))}
                      className="w-full text-xs rounded-lg p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {PERSIAN_MONTH_NAMES.map((m, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 block mb-0.5">سال:</span>
                    <select
                      value={editYear}
                      onChange={(e) => setEditYear(parseInt(e.target.value, 10))}
                      className="w-full text-xs rounded-lg p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    >
                      {[1403, 1404, 1405, 1406, 1407].map((y) => (
                        <option key={y} value={y}>
                          {toPersianDigits(y)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Time & Duration Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Time */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-500" />
                      <span>ساعت انجام:</span>
                    </label>
                    {editTime && (
                      <button
                        type="button"
                        onClick={() => setEditTime('')}
                        className="text-[10px] text-slate-600 dark:text-slate-300 hover:text-rose-500"
                      >
                        بدون ساعت
                      </button>
                    )}
                  </div>

                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-xl p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />

                  {/* Quick Hour chips */}
                  <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                    {['08:00', '09:00', '10:30', '14:00', '17:00', '20:00'].map((th) => (
                      <button
                        key={th}
                        type="button"
                        onClick={() => setEditTime(th)}
                        className={`px-2 py-0.5 rounded-md border text-[11px] ${
                          editTime === th
                            ? 'bg-teal-600 text-white border-teal-600 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {toPersianDigits(th)}
                      </button>
                    ))}
                  </div>

                  {editTime && (
                    <label className="flex items-center gap-1.5 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsFixed}
                        onChange={(e) => setEditIsFixed(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-emerald-600"
                      />
                      <span className="text-[11px] text-slate-700 dark:text-slate-300">
                        ساعت قطعی است (قفل شود)
                      </span>
                    </label>
                  )}
                </div>

                {/* Duration & Category */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Hourglass className="w-3.5 h-3.5 text-amber-500" />
                        <span>مدت‌زمان وظیفه (دلخواه):</span>
                      </label>
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                        {formatDurationHuman(editDuration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={1440}
                        value={editDuration}
                        onChange={(e) => setEditDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="flex-1 text-xs sm:text-sm font-semibold rounded-xl p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                        placeholder="مدت به دقیقه..."
                      />
                      <span className="text-xs text-slate-500 font-medium shrink-0">دقیقه</span>
                    </div>

                    {/* Quick Duration Preset Chips */}
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {[15, 30, 45, 60, 90, 120, 180].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setEditDuration(mins)}
                          className={`px-2 py-0.5 rounded-md border text-[10px] font-medium transition-colors ${
                            editDuration === mins
                              ? 'bg-amber-500 text-white border-amber-500 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {mins < 60 ? `${toPersianDigits(mins)}د` : `${toPersianDigits(mins / 60)}س`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                      <Tag className="w-3.5 h-3.5 text-indigo-500" />
                      <span>دسته‌بندی:</span>
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full text-xs rounded-xl p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {allCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Priority & Recurrence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Priority */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>اولویت:</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { key: 'low', label: 'عادی' },
                      { key: 'medium', label: 'متوسط' },
                      { key: 'high', label: 'بالا' },
                      { key: 'urgent', label: 'فوری' }
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setEditPriority(p.key as Priority)}
                        className={`py-1 text-xs rounded-lg font-medium border transition-colors ${
                          editPriority === p.key
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recurrence */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Repeat className="w-3.5 h-3.5 text-sky-500" />
                    <span>تکرار وظیفه:</span>
                  </label>
                  <select
                    value={editRecurrence}
                    onChange={(e) => setEditRecurrence(e.target.value as RecurrenceType)}
                    className="w-full text-xs rounded-xl p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="none">بدون تکرار (یکبار)</option>
                    <option value="daily">هر روز (روزانه)</option>
                    <option value="weekly">هر هفته (هفتگی)</option>
                    <option value="monthly">هر ماه (ماهانه)</option>
                  </select>
                </div>
              </div>

              {/* Clarification prompt */}
              {parsedResult?.needsClarification && (
                <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                      {parsedResult.clarificationQuestion}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="پاسخ به سوال (مثلاً: ساعت ۴ بعد از ظهر یا روز پنجم)..."
                      value={clarificationResponse}
                      onChange={(e) => setClarificationResponse(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyClarification()}
                      className="flex-1 text-xs rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyClarification}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium"
                    >
                      تکمیل
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            انصراف
          </button>

          <button
            onClick={handleConfirmAndSave}
            disabled={!editTitle.trim() && !transcript.trim()}
            className="flex-1 max-w-xs px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>تأیید و ذخیره وظیفه</span>
          </button>
        </div>
      </div>
    </div>
  );
};

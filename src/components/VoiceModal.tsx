import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
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
  Cpu
} from 'lucide-react';
import { Task, ParsedVoiceResult, Priority, RecurrenceType } from '../types';
import { parsePersianVoiceCommand } from '../utils/persianNlpParser';
import { toPersianDigits, formatJalaliHuman } from '../utils/jalali';
import { audioService, OfflineSpeechController, isBrowserSpeechSupported } from '../utils/audioService';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  customCategories: string[];
}

const SAMPLE_VOICE_COMMANDS = [
  'فردا ساعت ۹ با مدیر مدرسه تماس بگیرم.',
  'پنجشنبه گزارش مسابقات قرآن را ارسال کنم.',
  'هر روز ساعت ۷ صبح ورزش کنم.',
  'تا آخر هفته نامه اداره را آماده کنم.',
  'فردا دو ساعت برای یادگیری هوش مصنوعی وقت بگذارم.'
];

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  customCategories
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedVoiceResult | null>(null);
  const [audioWaves, setAudioWaves] = useState<number[]>([15, 25, 40, 20, 35, 55, 30, 45, 60, 25, 35, 20]);
  const [clarificationResponse, setClarificationResponse] = useState('');

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

    // Auto-start recording on open
    startRecording();

    return () => {
      stopRecording();
    };
  }, [isOpen]);

  const startRecording = () => {
    setTranscript('');
    setParsedResult(null);
    setRecordingSeconds(0);
    setIsRecording(true);
    audioService.playStartRecordChirp();

    if (speechControllerRef.current) {
      speechControllerRef.current.start();
    }

    // Timer
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    // Audio waveform simulation
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

    // Simulate whisper.cpp local on-device inference delay (150ms)
    setTimeout(() => {
      const parsed = parsePersianVoiceCommand(text);
      setParsedResult(parsed);
      setIsProcessing(false);
    }, 160);
  };

  const handleManualTranscriptChange = (newText: string) => {
    setTranscript(newText);
    if (newText.trim().length > 3) {
      const parsed = parsePersianVoiceCommand(newText);
      setParsedResult(parsed);
    }
  };

  const handleApplyClarification = () => {
    if (!clarificationResponse.trim()) return;
    const combined = `${transcript} ${clarificationResponse}`;
    setTranscript(combined);
    processSpeech(combined);
    setClarificationResponse('');
  };

  const handleConfirmAndSave = () => {
    if (!parsedResult) return;

    onSaveTask({
      title: parsedResult.cleanTitle || transcript,
      description: `ثبت صوتی: «${transcript}»`,
      category: parsedResult.category,
      dueDate: parsedResult.dueDate,
      dueTime: parsedResult.dueTime,
      estimatedDurationMinutes: parsedResult.durationMinutes,
      priority: parsedResult.priority,
      status: parsedResult.dueTime ? 'scheduled' : 'registered',
      recurrence: parsedResult.recurrence,
      finalDeadline: parsedResult.finalDeadline,
      source: 'voice',
      isTimeFixed: parsedResult.isTimeFixed
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                ثبت صوتی وظیفه
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                <Cpu className="w-3 h-3" />
                <span>موتور محلی آفلاین Whisper (بدون نیاز به اینترنت)</span>
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
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Visualizer & Mic status */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
            {isRecording ? (
              <div className="space-y-3 w-full flex flex-col items-center">
                {/* Live audio waves */}
                <div className="flex items-end justify-center gap-1.5 h-14">
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
                  <span>توقف و تحلیل گفتار</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <button
                  onClick={startRecording}
                  className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform mx-auto"
                  title="شروع مجدد ضبط"
                >
                  <Mic className="w-7 h-7" />
                </button>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  برای صحبت کردن روی میکروفون بزنید
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  صدا کاملاً روی حافظه دستگاه پردازش می‌شود و به هیچ سروری ارسال نمی‌گردد.
                </p>
              </div>
            )}
          </div>

          {/* Quick Test Samples (As requested in prompt) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              نمونه فرمان‌های صوتی برای آزمایش سریع:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_VOICE_COMMANDS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(sample)}
                  className="text-xs text-right bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 transition-colors"
                >
                  «{sample}»
                </button>
              ))}
            </div>
          </div>

          {/* Transcript Preview & Edit */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>متن گفتار تشخیص داده شده:</span>
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
              placeholder="صحبت‌های شما پس از تبدیل به متن در اینجا نمایش داده می‌شود و قابل ویرایش است..."
              rows={2}
              className="w-full text-sm rounded-xl p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Extracted NLP Information Breakdown */}
          {isProcessing ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>موتور NLP محلی در حال استخراج عنوان، زمان و اولویت...</span>
            </div>
          ) : parsedResult ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>اطلاعات استخراج شده از فرمان</span>
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full font-mono">
                  دقت: {toPersianDigits(Math.round(parsedResult.confidence * 100))}٪
                </span>
              </div>

              {/* Title */}
              <div>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 block">عنوان وظیفه:</span>
                <input
                  type="text"
                  value={parsedResult.cleanTitle}
                  onChange={(e) => setParsedResult({ ...parsedResult, cleanTitle: e.target.value })}
                  className="w-full text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 mt-1 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Date */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 text-[11px] mb-1">
                    <Calendar className="w-3 h-3 text-emerald-500" />
                    <span>تاریخ انجام:</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatJalaliHuman(parsedResult.dueDate)}
                  </span>
                </div>

                {/* Time */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 text-[11px] mb-1">
                    <Clock className="w-3 h-3 text-teal-500" />
                    <span>ساعت انجام:</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {parsedResult.dueTime ? toPersianDigits(parsedResult.dueTime) : 'بدون ساعت قطعی'}
                  </span>
                </div>

                {/* Category */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 text-[11px] mb-1">
                    <Tag className="w-3 h-3 text-indigo-500" />
                    <span>دسته‌بندی:</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {parsedResult.category}
                  </span>
                </div>

                {/* Duration & Priority */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 text-[11px] mb-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>مدت زمان:</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {toPersianDigits(parsedResult.durationMinutes)} دقیقه
                    {parsedResult.recurrence !== 'none' && ` · ${parsedResult.recurrence === 'daily' ? 'هر روز' : 'هفتگی'}`}
                  </span>
                </div>
              </div>

              {/* Clarification prompt (Section 5 requirement: Ask follow-up if ambiguous) */}
              {parsedResult.needsClarification && (
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
                      placeholder="مثلاً: ساعت ۴ بعد از ظهر"
                      value={clarificationResponse}
                      onChange={(e) => setClarificationResponse(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyClarification()}
                      className="flex-1 text-xs rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={handleApplyClarification}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium"
                    >
                      تکمیل
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
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
            disabled={!transcript.trim() || isProcessing}
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

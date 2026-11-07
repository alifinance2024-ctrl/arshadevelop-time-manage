import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Trash2, 
  Edit, 
  Calendar, 
  ArrowRightCircle, 
  AlertTriangle,
  X,
  Plus
} from 'lucide-react';
import { Task, Priority, TaskStatus } from '../types';
import { toPersianDigits, formatJalaliHuman, addDaysToJalali, getTodayJalali } from '../utils/jalali';
import { audioService } from '../utils/audioService';

interface AllTasksViewProps {
  tasks: Task[];
  onToggleTaskComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTaskToTomorrow: (taskId: string) => void;
  onOpenNewTask: () => void;
  customCategories: string[];
}

export const AllTasksView: React.FC<AllTasksViewProps> = ({
  tasks,
  onToggleTaskComplete,
  onEditTask,
  onDeleteTask,
  onMoveTaskToTomorrow,
  onOpenNewTask,
  customCategories
}) => {
  const today = getTodayJalali();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');

  // Categories list
  const categories = [
    'all',
    'امور اداری',
    'امور قرآنی و فرهنگی',
    'امور شخصی',
    'خانواده',
    'یادگیری و آموزش',
    'مالی و سرمایه‌گذاری',
    'ورزش و سلامتی',
    'سایر',
    ...customCategories
  ];

  // Filtering
  const filteredTasks = tasks.filter((task) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q) ?? false;
      const matchCat = task.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && task.category !== selectedCategory) {
      return false;
    }

    // Status filter
    if (statusFilter === 'completed' && task.status !== 'completed') return false;
    if (statusFilter === 'pending' && task.status === 'completed') return false;
    if (statusFilter === 'overdue' && (task.dueDate >= today.formatted || task.status === 'completed')) return false;

    return true;
  });

  return (
    <div className="space-y-4 pb-6">
      {/* Top Search & Add Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="جست‌وجو در عنوان، دسته‌بندی یا توضیحات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-2xl pr-10 pl-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={onOpenNewTask}
          className="h-10 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">وظیفه جدید</span>
        </button>
      </div>

      {/* Interactive Status Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex-1 min-w-[70px] py-1.5 text-xs font-semibold rounded-lg transition-all ${
            statusFilter === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          همه ({toPersianDigits(tasks.length)})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`flex-1 min-w-[70px] py-1.5 text-xs font-semibold rounded-lg transition-all ${
            statusFilter === 'pending'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          در انتظار ({toPersianDigits(tasks.filter((t) => t.status !== 'completed').length)})
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`flex-1 min-w-[70px] py-1.5 text-xs font-semibold rounded-lg transition-all ${
            statusFilter === 'completed'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          انجام‌شده ({toPersianDigits(tasks.filter((t) => t.status === 'completed').length)})
        </button>
        <button
          onClick={() => setStatusFilter('overdue')}
          className={`flex-1 min-w-[70px] py-1.5 text-xs font-semibold rounded-lg transition-all ${
            statusFilter === 'overdue'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-rose-600/80 hover:text-rose-700'
          }`}
        >
          عقب‌افتاده ({toPersianDigits(tasks.filter((t) => t.dueDate < today.formatted && t.status !== 'completed').length)})
        </button>
      </div>

      {/* Category Horizontal Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {cat === 'all' ? 'همه دسته‌ها' : cat}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              هیچ وظیفه‌ای با این مشخصات یافت نشد.
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              می‌توانید فیلترها را تغییر دهید یا کار جدیدی ثبت کنید.
            </p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isDone = t.status === 'completed';
            const isOverdue = t.dueDate < today.formatted && !isDone;

            return (
              <div
                key={t.id}
                className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all shadow-xs ${
                  isOverdue
                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                    : isDone
                    ? 'border-slate-200 dark:border-slate-800/60 opacity-60'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Checkbox & Details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => {
                        onToggleTaskComplete(t.id);
                        if (!isDone) audioService.playSuccessChime();
                      }}
                      className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600 transition-colors"
                      title={isDone ? 'علامت‌گذاری به عنوان انجام نشده' : 'علامت‌گذاری به عنوان انجام شده'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold text-slate-900 dark:text-white truncate ${
                          isDone ? 'line-through text-slate-600 dark:text-slate-300' : ''
                        }`}>
                          {t.title}
                        </h3>
                        {t.priority === 'urgent' && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                            فوری
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[10px] text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/80 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            عقب‌افتاده
                          </span>
                        )}
                      </div>

                      {t.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {t.description}
                        </p>
                      )}

                      {/* Unboxed clean metadata (anti-slop) */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                        <span>{t.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatJalaliHuman(t.dueDate)}</span>
                        {t.dueTime && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                              ساعت {toPersianDigits(t.dueTime)}
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{toPersianDigits(t.estimatedDurationMinutes)} دقیقه</span>
                        {t.source === 'voice' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-teal-600 dark:text-teal-400 font-medium">ثبت صوتی</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Move to Tomorrow */}
                    <button
                      onClick={() => onMoveTaskToTomorrow(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="انتقال به فردا"
                    >
                      <ArrowRightCircle className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEditTask(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="ویرایش"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`آیا از حذف وظیفه «${t.title}» مطمئن هستید؟`)) {
                          onDeleteTask(t.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

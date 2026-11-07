import React from 'react';
import { 
  Home, 
  Calendar, 
  CheckSquare, 
  Settings, 
  Clock, 
  Mic 
} from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenVoice: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  onOpenVoice
}) => {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 transition-colors shadow-lg shadow-slate-900/5">
      <div className="max-w-lg mx-auto px-3 h-16 flex items-center justify-between">
        {/* Tab 1: Home */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
            currentTab === 'home'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">خانه</span>
        </button>

        {/* Tab 2: Smart Daily Planner */}
        <button
          onClick={() => onChangeTab('planner')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
            currentTab === 'planner'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">برنامه روزانه</span>
        </button>

        {/* Elevated Center Voice Button */}
        <div className="flex flex-col items-center justify-center -mt-6 px-1">
          <button
            onClick={onOpenVoice}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform border-4 border-white dark:border-slate-900"
            title="ثبت صوتی وظیفه با میکروفون"
          >
            <Mic className="w-6 h-6" />
          </button>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
            ثبت صوتی
          </span>
        </div>

        {/* Tab 3: Calendar */}
        <button
          onClick={() => onChangeTab('calendar')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
            currentTab === 'calendar'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">تقویم</span>
        </button>

        {/* Tab 4: All Tasks */}
        <button
          onClick={() => onChangeTab('tasks')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
            currentTab === 'tasks'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">همه وظایف</span>
        </button>

        {/* Tab 5: Settings */}
        <button
          onClick={() => onChangeTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
            currentTab === 'settings'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">تنظیمات</span>
        </button>
      </div>
    </div>
  );
};

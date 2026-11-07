import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { DailyPlannerView } from './components/DailyPlannerView';
import { CalendarView } from './components/CalendarView';
import { AllTasksView } from './components/AllTasksView';
import { SettingsView } from './components/SettingsView';
import { VoiceModal } from './components/VoiceModal';
import { TaskModal } from './components/TaskModal';
import { AndroidCodeExportModal } from './components/AndroidCodeExportModal';
import { WidgetPreviewModal } from './components/WidgetPreviewModal';
import { Task, UserSettings, TabType } from './types';
import { 
  loadTasksFromStorage, 
  saveTasksToStorage, 
  loadSettingsFromStorage, 
  saveSettingsToStorage 
} from './utils/storage';
import { addDaysToJalali, getTodayJalali } from './utils/jalali';
import { ScheduledSlot } from './utils/plannerAlgorithm';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettingsFromStorage());
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState(false);
  const [isWidgetPreviewOpen, setIsWidgetPreviewOpen] = useState(false);

  // POCO M4 device frame view toggle
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);

  // Sync tasks to localStorage whenever changed
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  // Sync settings to localStorage and apply theme
  useEffect(() => {
    saveSettingsToStorage(settings);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Task actions
  const handleToggleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'completed' ? (t.dueTime ? 'scheduled' : 'registered') : 'completed';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'>, existingId?: string) => {
    if (existingId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === existingId ? { ...t, ...taskData } : t))
      );
    } else {
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString()
      };
      setTasks((prev) => [newTask, ...prev]);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleMoveTaskToTomorrow = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, dueDate: addDaysToJalali(t.dueDate, 1), status: 'registered' };
        }
        return t;
      })
    );
  };

  // Overdue rollover (prompt section 11)
  const handleRolloverOverdueTasks = (taskIds?: string[]) => {
    const today = getTodayJalali();
    setTasks((prev) =>
      prev.map((t) => {
        if ((!taskIds || taskIds.includes(t.id)) && t.status !== 'completed') {
          return { ...t, dueDate: today.formatted, status: 'registered' };
        }
        return t;
      })
    );
  };

  // Apply planner algorithm proposal
  const handleApplyPlanProposal = (proposalSlots: ScheduledSlot[]) => {
    setTasks((prev) =>
      prev.map((t) => {
        const slot = proposalSlots.find((s) => s.taskId === t.id);
        if (slot) {
          return {
            ...t,
            dueTime: slot.startTime,
            status: 'scheduled',
            isTimeFixed: slot.isFixed
          };
        }
        return t;
      })
    );
  };

  const handleUpdateSettings = (partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleRestoreBackup = (newTasks: Task[], newSettings: UserSettings) => {
    setTasks(newTasks);
    setSettings(newSettings);
  };

  const openEditModal = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const openNewTaskModal = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const openNewTaskModalForDate = (jalaliDate: string) => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        isPhoneFrame={isPhoneFrame}
        onTogglePhoneFrame={() => setIsPhoneFrame(!isPhoneFrame)}
        onOpenCodeExport={() => setIsCodeExportOpen(true)}
        onOpenWidgetPreview={() => setIsWidgetPreviewOpen(true)}
      />

      {/* Main Container: Full-width responsive OR Xiaomi POCO M4 device simulator */}
      <main className="flex-1 flex justify-center p-0 sm:p-4 md:p-6 overflow-x-hidden">
        <div
          className={`w-full transition-all duration-300 ${
            isPhoneFrame
              ? 'max-w-[420px] bg-white dark:bg-slate-900 rounded-[44px] shadow-2xl border-[10px] border-slate-800 dark:border-slate-800 my-auto overflow-hidden relative min-h-[820px] flex flex-col'
              : 'max-w-5xl bg-transparent'
          }`}
        >
          {/* POCO M4 Notch & Speaker (only when isPhoneFrame is true) */}
          {isPhoneFrame && (
            <div className="pt-3 pb-2 px-6 bg-slate-900 text-white flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
              <span>09:14</span>
              <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-700 mx-auto" title="دوربین سلفی POCO M4" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-400 font-sans">8GB RAM</span>
                <span>📶 100%</span>
              </div>
            </div>
          )}

          {/* Active View Body */}
          <div className="flex-1 p-4 sm:p-5">
            {currentTab === 'home' && (
              <HomeDashboard
                tasks={tasks}
                settings={settings}
                onToggleTaskComplete={handleToggleTaskComplete}
                onOpenVoice={() => setIsVoiceModalOpen(true)}
                onOpenManualAdd={openNewTaskModal}
                onSelectTask={openEditModal}
                onRolloverOverdueTasks={handleRolloverOverdueTasks}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'planner' && (
              <DailyPlannerView
                tasks={tasks}
                settings={settings}
                onUpdateTaskTime={(taskId, newTime, isFixed) => {
                  setTasks((prev) =>
                    prev.map((t) => (t.id === taskId ? { ...t, dueTime: newTime, isTimeFixed: isFixed } : t))
                  );
                }}
                onApplyPlanProposal={handleApplyPlanProposal}
              />
            )}

            {currentTab === 'calendar' && (
              <CalendarView
                tasks={tasks}
                onSelectTask={openEditModal}
                onOpenManualAddForDate={openNewTaskModalForDate}
              />
            )}

            {currentTab === 'tasks' && (
              <AllTasksView
                tasks={tasks}
                onToggleTaskComplete={handleToggleTaskComplete}
                onEditTask={openEditModal}
                onDeleteTask={handleDeleteTask}
                onMoveTaskToTomorrow={handleMoveTaskToTomorrow}
                onOpenNewTask={openNewTaskModal}
                customCategories={settings.customCategories}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                tasks={tasks}
                onSaveSettings={(s) => setSettings(s)}
                onRestoreBackup={handleRestoreBackup}
              />
            )}
          </div>

          {/* Bottom Navigation */}
          <BottomNav
            currentTab={currentTab}
            onChangeTab={(t) => setCurrentTab(t)}
            onOpenVoice={() => setIsVoiceModalOpen(true)}
          />
        </div>
      </main>

      {/* Voice Assistant Modal */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSaveTask={handleSaveTask}
        customCategories={settings.customCategories}
      />

      {/* Manual Task Creator/Editor Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        customCategories={settings.customCategories}
      />

      {/* Android Kotlin Code Export Modal */}
      <AndroidCodeExportModal
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
      />

      {/* Android Widget Preview Modal */}
      <WidgetPreviewModal
        isOpen={isWidgetPreviewOpen}
        onClose={() => setIsWidgetPreviewOpen(false)}
        tasks={tasks}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        onOpenManualAdd={openNewTaskModal}
      />
    </div>
  );
}

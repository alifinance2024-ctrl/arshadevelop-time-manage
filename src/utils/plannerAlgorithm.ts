import { Task, UserSettings } from '../types';

export interface ScheduledSlot {
  taskId: string;
  taskTitle: string;
  category: string;
  startTime: string; // "09:00"
  endTime: string;   // "09:30"
  durationMinutes: number;
  isBreak?: boolean;
  isFixed: boolean;
  priority: string;
}

export interface DayPlanProposal {
  date: string;
  slots: ScheduledSlot[];
  unscheduledTasks: Task[];
  hasConflicts: boolean;
  conflictNotes: string[];
  totalWorkMinutes: number;
  totalBreakMinutes: number;
}

/**
 * Converts "HH:mm" to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((s) => parseInt(s, 10));
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts minutes from midnight to "HH:mm"
 */
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(h)}:${pad(m)}`;
}

/**
 * Smart Scheduler Algorithm:
 * 1. Locks tasks with fixed hours into the day's timeline.
 * 2. Checks for direct fixed time collisions.
 * 3. Sorts flexible tasks by priority (urgent -> high -> medium -> low).
 * 4. Finds available time slots between workDayStart and workDayEnd, inserting breakDurationMinutes between work blocks.
 * 5. Places flexible tasks into the optimal morning or afternoon available windows.
 */
export function generateSmartDailyPlan(
  tasksForDay: Task[],
  settings: UserSettings,
  dayJalaliDate: string
): DayPlanProposal {
  const dayStartMin = timeToMinutes(settings.workDayStart || '08:00');
  const dayEndMin = timeToMinutes(settings.workDayEnd || '17:00');
  const breakMin = settings.breakDurationMinutes || 15;

  const slots: ScheduledSlot[] = [];
  const unscheduled: Task[] = [];
  const conflictNotes: string[] = [];

  // 1. Separate fixed-time tasks and flexible tasks
  const fixedTasks: Task[] = [];
  const flexibleTasks: Task[] = [];

  tasksForDay.forEach((t) => {
    if (t.status === 'completed' || t.status === 'cancelled') {
      return; // Skip completed or cancelled
    }
    if (t.dueTime && (t.isTimeFixed || t.status === 'scheduled')) {
      fixedTasks.push(t);
    } else {
      flexibleTasks.push(t);
    }
  });

  // Sort fixed tasks chronologically
  fixedTasks.sort((a, b) => timeToMinutes(a.dueTime!) - timeToMinutes(b.dueTime!));

  // Check for conflicts among fixed tasks
  for (let i = 0; i < fixedTasks.length; i++) {
    const cur = fixedTasks[i];
    const curStart = timeToMinutes(cur.dueTime!);
    const dur = cur.estimatedDurationMinutes || 30;
    const curEnd = curStart + dur;

    if (i > 0) {
      const prev = fixedTasks[i - 1];
      const prevStart = timeToMinutes(prev.dueTime!);
      const prevEnd = prevStart + (prev.estimatedDurationMinutes || 30);
      if (curStart < prevEnd) {
        conflictNotes.push(`تداخل زمانی بین «${prev.title}» و «${cur.title}» در ساعت ${cur.dueTime}`);
      }
    }

    slots.push({
      taskId: cur.id,
      taskTitle: cur.title,
      category: cur.category,
      startTime: cur.dueTime!,
      endTime: minutesToTime(curEnd),
      durationMinutes: dur,
      isFixed: true,
      priority: cur.priority
    });
  }

  // Sort flexible tasks by priority: urgent (0) > high (1) > medium (2) > low (3)
  const priorityWeight: { [p: string]: number } = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3
  };

  flexibleTasks.sort((a, b) => {
    return (priorityWeight[a.priority] ?? 2) - (priorityWeight[b.priority] ?? 2);
  });

  // 2. Schedule flexible tasks into remaining free time gaps
  // Build a timeline of occupied intervals [start, end]
  const occupiedIntervals: Array<{ start: number; end: number }> = slots.map((s) => ({
    start: timeToMinutes(s.startTime),
    end: timeToMinutes(s.endTime) + breakMin // buffer with break
  }));

  occupiedIntervals.sort((a, b) => a.start - b.start);

  let cursor = dayStartMin;

  for (const task of flexibleTasks) {
    const dur = task.estimatedDurationMinutes || 30;
    let placed = false;

    // Scan for next free window of length >= dur
    while (cursor + dur <= dayEndMin) {
      // Check collision with any occupied interval
      const overlapping = occupiedIntervals.find(
        (intv) => !(cursor + dur <= intv.start || cursor >= intv.end)
      );

      if (!overlapping) {
        // We found a free slot!
        const slotStart = cursor;
        const slotEnd = cursor + dur;

        slots.push({
          taskId: task.id,
          taskTitle: task.title,
          category: task.category,
          startTime: minutesToTime(slotStart),
          endTime: minutesToTime(slotEnd),
          durationMinutes: dur,
          isFixed: false,
          priority: task.priority
        });

        occupiedIntervals.push({
          start: slotStart,
          end: slotEnd + breakMin
        });
        occupiedIntervals.sort((a, b) => a.start - b.start);

        cursor = slotEnd + breakMin;
        placed = true;
        break;
      } else {
        // Advance cursor past the overlapping interval
        cursor = overlapping.end;
      }
    }

    if (!placed) {
      unscheduled.push(task);
      conflictNotes.push(`وظیفه «${task.title}» به دلیل پر بودن ساعات کاری در این روز جا نشد.`);
    }
  }

  // Final sort of all slots by start time
  slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const totalWork = slots.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalBreak = Math.max(0, slots.length - 1) * breakMin;

  return {
    date: dayJalaliDate,
    slots,
    unscheduledTasks: unscheduled,
    hasConflicts: conflictNotes.length > 0,
    conflictNotes,
    totalWorkMinutes: totalWork,
    totalBreakMinutes: totalBreak
  };
}

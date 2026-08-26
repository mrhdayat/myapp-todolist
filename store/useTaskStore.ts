import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  Task,
  AppSettings,
  DailyMetric,
  MonthlyMetricSummary,
  FilterOptions,
  ToastMessage,
  ThemePalette,
  ThemeMode,
  RecurringConfig,
} from '@/types/task';
import { dbClient } from '@/lib/storage/db';
import {
  getTodayDateString,
  isYesterday,
  getDaysDifference,
  calculateMidnightTimeout,
} from '@/lib/date-utils';
import { calculateStreakUpdate } from '@/lib/streak-utils';
import {
  broadcastMessage,
  subscribeToSyncChannel,
  acquireDailyResetLock,
  releaseDailyResetLock,
} from '@/lib/sync-channel';
import { soundManager } from '@/lib/sound';

export interface TaskState {
  tasks: Task[];
  metrics: DailyMetric[];
  monthlySummaries: MonthlyMetricSummary[];
  settings: AppSettings;
  filters: FilterOptions;
  toasts: ToastMessage[];
  isLoading: boolean;
  isInitialized: boolean;
  selectedTaskId: string | null;
  isEditingTaskId: string | null;
  importModalOpen: boolean;
  settingsModalOpen: boolean;
  isSelectionMode: boolean;
  selectedTaskIds: string[];
}

export interface TaskActions {
  initializeStore: () => Promise<void>;
  addTask: (
    title: string,
    priority?: Task['priority'],
    category?: Task['category'],
    dueDate?: string | null,
    dueTime?: string | null,
    isRecurring?: boolean,
    recurringConfig?: RecurringConfig,
    isOneTime?: boolean
  ) => Promise<Task>;
  toggleTaskStatus: (id: string) => Promise<void>;
  toggleTaskPause: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteTaskWithOptions: (id: string, mode: 'permanently' | 'stop-recurrence') => Promise<void>;
  reorderTasks: (newOrderedTasks: Task[]) => Promise<void>;
  checkAndRunDailyReset: () => Promise<void>;
  importTasks: (importedTasks: Task[], mode: 'replace' | 'merge') => Promise<void>;
  restoreAutoBackup: () => Promise<boolean>;
  setFilter: (filters: Partial<FilterOptions>) => void;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  setTheme: (palette: ThemePalette, mode: ThemeMode) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  setSelectedTask: (id: string | null) => void;
  setIsEditingTaskId: (id: string | null) => void;
  setImportModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  toggleSelectionMode: () => void;
  toggleSelectTask: (id: string) => void;
  selectAllTasks: (ids?: string[]) => void;
  clearSelection: () => void;
  bulkCompleteTasks: (status: 'done' | 'pending') => Promise<void>;
  bulkDeleteTasks: () => Promise<void>;
}

export type TaskStore = TaskState & TaskActions;

function getDataTheme(palette: ThemePalette, mode: ThemeMode): string {
  return mode === 'dark' ? `${palette}-dark` : palette;
}

function applyThemeToDOM(palette: ThemePalette, mode: ThemeMode, reducedMotion: boolean) {
  if (typeof document === 'undefined') return;
  const dataTheme = getDataTheme(palette, mode);
  document.documentElement.setAttribute('data-theme', dataTheme);

  if (reducedMotion) {
    document.documentElement.classList.add('reduce-motion');
  } else {
    document.documentElement.classList.remove('reduce-motion');
  }
}

const initialSettings: AppSettings = {
  themePalette: 'warm-clay',
  themeMode: 'light',
  reducedMotion: false,
  soundEnabled: true,
  autoResetBehavior: 'carry-over',
  firstActiveDate: getTodayDateString(),
  lastActiveDate: getTodayDateString(),
  streak: 0,
  bestStreak: 0,
  schemaVersion: 2,
  retentionDays: 90,
  autoCleanArchivedMonths: 3,
};

const initialFilters: FilterOptions = {
  status: 'all',
  priority: 'all',
  category: 'all',
  searchQuery: '',
};

let midnightTimer: NodeJS.Timeout | null = null;
let syncSubscribed = false;

export const useTaskStore = create<TaskStore>()(
  subscribeWithSelector((set, get) => ({
    tasks: [],
    metrics: [],
    monthlySummaries: [],
    settings: initialSettings,
    filters: initialFilters,
    toasts: [],
    isLoading: true,
    isInitialized: false,
    selectedTaskId: null,
    isEditingTaskId: null,
    importModalOpen: false,
    settingsModalOpen: false,
    isSelectionMode: false,
    selectedTaskIds: [],

    initializeStore: async () => {
      try {
        const today = getTodayDateString();
        const [savedTasks, savedSettings, savedMetrics, savedMonthly] = await Promise.all([
          dbClient.getAllTasks(),
          dbClient.getSettings(),
          dbClient.getAllMetrics(),
          dbClient.getAllMonthlySummaries(),
        ]);

        // Migrate settings & establish Day 1 firstActiveDate
        let settings: AppSettings;
        if (savedSettings) {
          settings = {
            ...initialSettings,
            ...savedSettings,
            firstActiveDate: savedSettings.firstActiveDate || savedSettings.lastActiveDate || today,
            schemaVersion: 2,
          };
        } else {
          settings = {
            ...initialSettings,
            firstActiveDate: today,
            lastActiveDate: today,
            schemaVersion: 2,
          };
        }

        // Auto-migration for legacy tasks to recurring checklist default
        const rawTasks = savedTasks || [];
        let didMigrate = false;
        const tasks: Task[] = rawTasks.map((t, idx) => {
          const rec = t as unknown as Record<string, unknown>;
          const fallbackTitle =
            (typeof t.title === 'string' && t.title.trim()) ||
            (typeof rec.text === 'string' && rec.text.trim()) ||
            (typeof rec.name === 'string' && rec.name.trim()) ||
            (typeof rec.task === 'string' && rec.task.trim()) ||
            (typeof rec.content === 'string' && rec.content.trim()) ||
            (typeof rec.todo === 'string' && rec.todo.trim()) ||
            (typeof rec.description === 'string' && rec.description.trim()) ||
            `Task #${idx + 1}`;

          const isOneTime = Boolean(t.isOneTime);
          const isRecurring = !isOneTime;
          const recurringConfig = isRecurring ? (t.recurringConfig || { type: 'daily' }) : undefined;
          const isPaused = Boolean(t.isPaused);

          if (!t.title || t.isRecurring !== isRecurring || t.isOneTime !== isOneTime) {
            didMigrate = true;
          }

          return {
            ...t,
            title: fallbackTitle,
            isRecurring,
            recurringConfig,
            isOneTime,
            isPaused,
          };
        });

        if (didMigrate && tasks.length > 0) {
          await dbClient.saveAllTasks(tasks);
        }

        // Run long-term retention & monthly log aggregation (>90 days)
        const rawMetrics = savedMetrics || [];
        const { remainingMetrics, generatedSummaries } = await dbClient.runDataRetentionPrune(
          rawMetrics,
          settings.retentionDays || 90
        );

        const allMonthly = [...(savedMonthly || []), ...generatedSummaries];
        const monthlyMap = new Map<string, MonthlyMetricSummary>();
        allMonthly.forEach((m) => monthlyMap.set(m.month, m));
        const finalMonthly = Array.from(monthlyMap.values());

        applyThemeToDOM(settings.themePalette, settings.themeMode, settings.reducedMotion);

        // Safety Net Auto-backup
        dbClient.saveAutoBackup(tasks, settings, remainingMetrics);

        set({
          tasks,
          settings,
          metrics: remainingMetrics,
          monthlySummaries: finalMonthly,
          isLoading: false,
          isInitialized: true,
        });

        // Setup real-time midnight timer + visibility listener
        if (typeof window !== 'undefined') {
          if (midnightTimer) clearTimeout(midnightTimer);
          const scheduleMidnightCheck = () => {
            const msUntilMidnight = calculateMidnightTimeout();
            console.log(`[MidnightWatcher] Next reset scheduled in ${Math.round(msUntilMidnight / 1000)}s`);
            midnightTimer = setTimeout(async () => {
              await get().checkAndRunDailyReset();
              scheduleMidnightCheck();
            }, msUntilMidnight);
          };
          scheduleMidnightCheck();

          // Check on window focus or tab visibility change
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              get().checkAndRunDailyReset();
            }
          });

          // Multi-tab BroadcastChannel listener
          if (!syncSubscribed) {
            syncSubscribed = true;
            subscribeToSyncChannel(async (msg) => {
              console.log('[SyncChannel] Received sync message:', msg.type);
              if (msg.type === 'MUTATION_OCCURRED' || msg.type === 'TASKS_SYNC') {
                const [latestTasks, latestSettings, latestMetrics] = await Promise.all([
                  dbClient.getAllTasks(),
                  dbClient.getSettings(),
                  dbClient.getAllMetrics(),
                ]);
                set({
                  tasks: latestTasks,
                  settings: latestSettings || get().settings,
                  metrics: latestMetrics,
                });
              } else if (msg.type === 'DAILY_RESET_NOTIFY') {
                const [latestTasks, latestSettings, latestMetrics] = await Promise.all([
                  dbClient.getAllTasks(),
                  dbClient.getSettings(),
                  dbClient.getAllMetrics(),
                ]);
                set({
                  tasks: latestTasks,
                  settings: latestSettings || get().settings,
                  metrics: latestMetrics,
                });
              }
            });
          }
        }

        await get().checkAndRunDailyReset();
      } catch (err) {
        console.error('Failed to initialize task store:', err);
        set({ isLoading: false, isInitialized: true });
      }
    },

    checkAndRunDailyReset: async () => {
      const { settings, tasks, metrics, isEditingTaskId } = get();
      const today = getTodayDateString();
      const lastDate = settings.lastActiveDate;

      // If user is currently editing/typing in a task, defer reset by 20s to prevent interrupting user
      if (isEditingTaskId) {
        console.log('[DailyReset] User is actively editing a task. Deferring reset...');
        setTimeout(() => get().checkAndRunDailyReset(), 20000);
        return;
      }

      // If no lastActiveDate stored yet (first launch), set it to today and persist immediately
      if (!lastDate) {
        const newSettings: AppSettings = {
          ...settings,
          firstActiveDate: settings.firstActiveDate || today,
          lastActiveDate: today,
        };
        set({ settings: newSettings });
        await dbClient.saveSettings(newSettings);
        return;
      }

      // If already processed for today, do nothing
      if (lastDate === today) {
        return;
      }

      // Multi-tab locking mechanism
      const acquiredLock = acquireDailyResetLock(today);
      if (!acquiredLock) {
        console.log('[DailyReset] Another tab is performing daily reset. Awaiting broadcast...');
        return;
      }

      try {
        console.log('[DailyReset] Executing Daily Reset from', lastDate, 'to', today);
        const isConsecutive = isYesterday(lastDate);
        const yesterdayTasks = tasks.filter((t) => !t.date || t.date === lastDate);
        const yesterdayDone = yesterdayTasks.filter((t) => t.status === 'done').length;
        const yesterdayRate = yesterdayTasks.length > 0 ? (yesterdayDone / yesterdayTasks.length) * 100 : 0;

        // Calculate streak update using pure strict rule engine (Section 2.1)
        const streakResult = calculateStreakUpdate(
          yesterdayTasks,
          settings.streak,
          settings.bestStreak,
          isConsecutive
        );
        const newStreak = streakResult.newStreak;
        const bestStreak = streakResult.bestStreak;

        console.log('[DailyReset] Streak calculation result:', streakResult);

        let updatedMetrics = [...metrics];
        if (yesterdayTasks.length > 0 && !metrics.some((m) => m.date === lastDate)) {
          const yesterdayMetric: DailyMetric = {
            date: lastDate,
            completedCount: yesterdayDone,
            totalCount: yesterdayTasks.length,
            completionRate: Math.round(yesterdayRate),
          };
          updatedMetrics.push(yesterdayMetric);
          await dbClient.saveMetric(yesterdayMetric);
        }

        const now = new Date().toISOString();

        // Daily Checklist State Transition Logic:
        // 1. One-Time Tasks:
        //    - If completed ('done'): archived with date = lastDate (does not appear in today checklist)
        //    - If pending: carry-over to today or archive based on user setting.
        // 2. Recurring / Routine Tasks:
        //    - If isPaused === true: retained with date = lastDate / paused (does not appear on active checklist)
        //    - If interval: check interval threshold against lastGeneratedDate
        //    - If weekdays: check if today's day-of-week is included
        //    - Default Daily: ALWAYS stays in today's active list with pending status!
        const updatedTasks: Task[] = tasks.map((t) => {
          const isOneTime = Boolean(t.isOneTime) || t.isRecurring === false;

          if (isOneTime) {
            if (t.status === 'done') {
              return { ...t, date: t.date || lastDate };
            } else {
              if (settings.autoResetBehavior === 'carry-over') {
                return { ...t, date: today, updatedAt: now };
              } else {
                return { ...t, date: t.date || lastDate };
              }
            }
          } else {
            // Routine / Recurring Task
            if (t.isPaused) {
              return { ...t, date: t.date || lastDate };
            }

            if (t.recurringConfig?.type === 'interval') {
              const interval = Number(t.recurringConfig.intervalDays) || 3;
              const baseDate = t.recurringConfig.lastGeneratedDate || t.date || lastDate;
              const diff = getDaysDifference(baseDate, today);
              const isEligibleToday = diff >= interval;

              if (isEligibleToday) {
                return {
                  ...t,
                  status: 'pending',
                  completedAt: null,
                  date: today,
                  updatedAt: now,
                  recurringConfig: {
                    ...t.recurringConfig,
                    lastGeneratedDate: today,
                  },
                };
              } else {
                return { ...t, date: t.date || lastDate };
              }
            }

            if (t.recurringConfig?.type === 'weekdays') {
              const [y, m, d] = today.split('-').map(Number);
              const target = new Date(y, m - 1, d, 0, 0, 0, 0);
              const dayOfWeek = target.getDay();
              const days = t.recurringConfig.weekdays || [1, 2, 3, 4, 5];
              const isEligibleToday = days.includes(dayOfWeek);

              if (isEligibleToday) {
                return {
                  ...t,
                  status: 'pending',
                  completedAt: null,
                  date: today,
                  updatedAt: now,
                };
              } else {
                return { ...t, date: t.date || lastDate };
              }
            }

            // Default: Daily Checklist Task
            return {
              ...t,
              status: 'pending',
              completedAt: null,
              date: today,
              updatedAt: now,
              recurringConfig: t.recurringConfig || { type: 'daily' },
            };
          }
        });

        const newSettings: AppSettings = {
          ...settings,
          lastActiveDate: today,
          streak: newStreak,
          bestStreak,
        };

        set({ tasks: updatedTasks, settings: newSettings, metrics: updatedMetrics });
        await Promise.all([
          dbClient.saveAllTasks(updatedTasks),
          dbClient.saveSettings(newSettings),
        ]);

        dbClient.saveAutoBackup(updatedTasks, newSettings, updatedMetrics);
        broadcastMessage({ type: 'DAILY_RESET_NOTIFY', date: today, timestamp: Date.now() });

        get().addToast({
          type: 'info',
          title: 'Hari Baru Dimulai 🌅',
          description: `Checklist harian telah disiapkan untuk tanggal ${today}.`,
          duration: 4000,
        });
      } finally {
        releaseDailyResetLock();
      }
    },

    addTask: async (
      title,
      priority = 'normal',
      category = 'work',
      dueDate = null,
      dueTime = null,
      isRecurring = true,
      recurringConfig = { type: 'daily' },
      isOneTime = false
    ) => {
      const { tasks, settings } = get();
      const now = new Date().toISOString();
      const today = getTodayDateString();

      const finalIsOneTime = Boolean(isOneTime) || isRecurring === false;
      const finalIsRecurring = !finalIsOneTime;

      const newTask: Task = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'task_' + Date.now(),
        title: title.trim(),
        status: 'pending',
        priority,
        category,
        dueDate,
        dueTime,
        order: tasks.length,
        isRecurring: finalIsRecurring,
        recurringConfig: finalIsRecurring ? (recurringConfig || { type: 'daily' }) : undefined,
        isOneTime: finalIsOneTime,
        isPaused: false,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        date: today,
      };

      const updated = [newTask, ...tasks];
      set({ tasks: updated });
      if (settings.soundEnabled) soundManager.playClick();
      await dbClient.saveTask(newTask);
      dbClient.saveAutoBackup(updated, settings, get().metrics);
      broadcastMessage({ type: 'MUTATION_OCCURRED', source: 'addTask', timestamp: Date.now() });
      return newTask;
    },

    toggleTaskStatus: async (id: string) => {
      const { tasks, settings } = get();
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const nextStatus = task.status === 'done' ? 'pending' : 'done';
      const now = new Date().toISOString();
      const updatedTask: Task = {
        ...task,
        status: nextStatus,
        completedAt: nextStatus === 'done' ? now : null,
        updatedAt: now,
      };
      const updatedTasks = tasks.map((t) => (t.id === id ? updatedTask : t));
      set({ tasks: updatedTasks });

      if (settings.soundEnabled) {
        nextStatus === 'done' ? soundManager.playComplete() : soundManager.playClick();
      }
      await dbClient.saveTask(updatedTask);
      dbClient.saveAutoBackup(updatedTasks, settings, get().metrics);
      broadcastMessage({ type: 'MUTATION_OCCURRED', source: 'toggleTaskStatus', timestamp: Date.now() });
    },

    toggleTaskPause: async (id: string) => {
      const { tasks, settings, addToast } = get();
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const nextPaused = !task.isPaused;
      const now = new Date().toISOString();
      const updatedTask: Task = { ...task, isPaused: nextPaused, updatedAt: now };
      const updatedTasks = tasks.map((t) => (t.id === id ? updatedTask : t));
      set({ tasks: updatedTasks });

      await dbClient.saveTask(updatedTask);
      dbClient.saveAutoBackup(updatedTasks, settings, get().metrics);
      broadcastMessage({ type: 'MUTATION_OCCURRED', source: 'toggleTaskPause', timestamp: Date.now() });

      addToast({
        type: nextPaused ? 'warning' : 'success',
        title: nextPaused ? 'Task Dijeda Sementara' : 'Task Diaktifkan Kembali',
        description: nextPaused
          ? `"${task.title}" tidak akan muncul di checklist harian sampai diaktifkan lagi.`
          : `"${task.title}" kembali aktif di checklist harian.`,
      });
    },

    updateTask: async (id, updates) => {
      const { tasks, settings } = get();
      const now = new Date().toISOString();
      const updatedTasks = tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: now } : t));
      const updatedItem = updatedTasks.find((t) => t.id === id);
      set({ tasks: updatedTasks, isEditingTaskId: null });
      if (updatedItem) {
        await dbClient.saveTask(updatedItem);
        dbClient.saveAutoBackup(updatedTasks, settings, get().metrics);
        broadcastMessage({ type: 'MUTATION_OCCURRED', source: 'updateTask', timestamp: Date.now() });
      }
    },

    deleteTask: async (id: string) => {
      await get().deleteTaskWithOptions(id, 'permanently');
    },

    deleteTaskWithOptions: async (id: string, mode: 'permanently' | 'stop-recurrence') => {
      const { tasks, settings, addToast } = get();
      const taskToDelete = tasks.find((t) => t.id === id);
      if (!taskToDelete) return;

      if (mode === 'stop-recurrence') {
        // Safe option: Stop recurrence from tomorrow onwards, preserve past history & completions
        const now = new Date().toISOString();
        const updatedTasks = tasks.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              isRecurring: false,
              isOneTime: true,
              isPaused: true,
              updatedAt: now,
            };
          }
          return t;
        });
        set({ tasks: updatedTasks });
        await dbClient.saveTask({
          ...taskToDelete,
          isRecurring: false,
          isOneTime: true,
          isPaused: true,
          updatedAt: now,
        });
        dbClient.saveAutoBackup(updatedTasks, settings, get().metrics);
        broadcastMessage({ type: 'MUTATION_OCCURRED', source: 'stopRecurrence', timestamp: Date.now() });

        addToast({
          type: 'info',
          title: 'Pengulangan Dihentikan',
          description: `"${taskToDelete.title}" tidak akan muncul lagi mulai besok. Histori penyelesaian tetap tersimpan.`,
        });
        return;
      }

      // Permanent deletion with 5-second Undo
      const originalIndex = tasks.findIndex((t) => t.id === id);
      set({ tasks: tasks.filter((t) => t.id !== id) });
      if (settings.soundEnabled) soundManager.playDelete();

      let isUndone = false;
      const timer = setTimeout(async () => {
        if (!isUndone) {
          await dbClient.deleteTask(id);
          broadcastMessage({ type: 'MUTATION_OCCURRED', source: 'deleteTask', timestamp: Date.now() });
        }
      }, 5000);

      addToast({
        type: 'info',
        title: 'Task Dihapus Permanen',
        description: `"${taskToDelete.title || 'Task'}" dihapus.`,
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => {
            isUndone = true;
            clearTimeout(timer);
            const currentTasks = get().tasks;
            const restored = [...currentTasks];
            restored.splice(Math.min(originalIndex, restored.length), 0, taskToDelete);
            set({ tasks: restored });
            dbClient.saveTask(taskToDelete);
            get().addToast({
              type: 'success',
              title: 'Task Dikembalikan',
              description: `"${taskToDelete.title || 'Task'}" berhasil dipulihkan.`,
            });
          },
        },
      });
    },

    reorderTasks: async (newOrderedTasks: Task[]) => {
      const reindexed = newOrderedTasks.map((t, idx) => ({ ...t, order: idx }));
      set({ tasks: reindexed });
      await dbClient.saveAllTasks(reindexed);
      broadcastMessage({ type: 'MUTATION_OCCURRED', source: 'reorderTasks', timestamp: Date.now() });
    },

    importTasks: async (importedTasks: Task[], mode: 'replace' | 'merge') => {
      const { tasks, settings } = get();
      const today = getTodayDateString();
      const processedImports: Task[] = importedTasks.map((t, idx) => {
        const isOneTime = Boolean(t.isOneTime);
        const isRecurring = !isOneTime;
        return {
          ...t,
          id: t.id || 'imported_' + Date.now() + '_' + idx,
          date: t.date || today,
          isRecurring,
          recurringConfig: isRecurring ? (t.recurringConfig || { type: 'daily' }) : undefined,
          isOneTime,
          isPaused: Boolean(t.isPaused),
        };
      });

      let finalTasks: Task[];
      if (mode === 'replace') {
        finalTasks = processedImports;
      } else {
        const existingMap = new Map<string, Task>();
        tasks.forEach((t) => existingMap.set(t.id, t));
        processedImports.forEach((t) => existingMap.set(t.id, t));
        finalTasks = Array.from(existingMap.values());
      }
      set({ tasks: finalTasks });
      await dbClient.saveAllTasks(finalTasks);
      dbClient.saveAutoBackup(finalTasks, settings, get().metrics);
      broadcastMessage({ type: 'MUTATION_OCCURRED', source: 'importTasks', timestamp: Date.now() });
      get().addToast({
        type: 'success',
        title: 'Import Berhasil',
        description: `${importedTasks.length} task berhasil dimuat.`,
      });
    },

    restoreAutoBackup: async () => {
      const snapshot = dbClient.getAutoBackupSnapshot();
      if (!snapshot || !snapshot.tasks || snapshot.tasks.length === 0) {
        get().addToast({
          type: 'warning',
          title: 'Tidak Ada Snapshot',
          description: 'Tidak ditemukan snapshot auto-backup lokal.',
        });
        return false;
      }

      await Promise.all([
        dbClient.saveAllTasks(snapshot.tasks),
        snapshot.settings ? dbClient.saveSettings(snapshot.settings) : Promise.resolve(),
      ]);

      set({
        tasks: snapshot.tasks,
        settings: snapshot.settings || get().settings,
        metrics: snapshot.metrics || get().metrics,
      });

      get().addToast({
        type: 'success',
        title: 'Auto-Backup Dipulihkan',
        description: `${snapshot.tasks.length} task berhasil dipulihkan dari cadangan lokal.`,
      });
      return true;
    },

    setFilter: (newFilters) => {
      set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    },

    updateSettings: async (updates) => {
      const { settings, tasks, metrics } = get();
      const newSettings = { ...settings, ...updates };
      applyThemeToDOM(newSettings.themePalette, newSettings.themeMode, newSettings.reducedMotion);
      set({ settings: newSettings });
      await dbClient.saveSettings(newSettings);
      dbClient.saveAutoBackup(tasks, newSettings, metrics);
      broadcastMessage({ type: 'MUTATION_OCCURRED', source: 'updateSettings', timestamp: Date.now() });
    },

    setTheme: async (palette: ThemePalette, mode: ThemeMode) => {
      await get().updateSettings({ themePalette: palette, themeMode: mode });
    },

    toggleDarkMode: async () => {
      const { settings } = get();
      const nextMode: ThemeMode = settings.themeMode === 'dark' ? 'light' : 'dark';
      await get().updateSettings({ themeMode: nextMode });
    },

    addToast: (toast) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9) + Date.now();
      const newToast: ToastMessage = { ...toast, id, duration: toast.duration || 4000 };
      set((state) => ({ toasts: [...state.toasts, newToast] }));
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    },

    removeToast: (id: string) => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },

    setSelectedTask: (id) => set({ selectedTaskId: id }),
    setIsEditingTaskId: (id) => set({ isEditingTaskId: id }),
    setImportModalOpen: (open) => set({ importModalOpen: open }),
    setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),

    toggleSelectionMode: () => {
      set((state) => ({
        isSelectionMode: !state.isSelectionMode,
        selectedTaskIds: [],
      }));
    },

    toggleSelectTask: (id: string) => {
      set((state) => {
        const exists = state.selectedTaskIds.includes(id);
        return {
          selectedTaskIds: exists
            ? state.selectedTaskIds.filter((taskId) => taskId !== id)
            : [...state.selectedTaskIds, id],
        };
      });
    },

    selectAllTasks: (ids?: string[]) => {
      const { tasks } = get();
      const targetIds = ids || tasks.map((t) => t.id);
      set({ selectedTaskIds: targetIds });
    },

    clearSelection: () => {
      set({ selectedTaskIds: [] });
    },

    bulkCompleteTasks: async (status: 'done' | 'pending') => {
      const { tasks, selectedTaskIds, settings, addToast } = get();
      if (selectedTaskIds.length === 0) return;

      const now = new Date().toISOString();
      const idSet = new Set(selectedTaskIds);
      const updatedTasks = tasks.map((t) => {
        if (idSet.has(t.id)) {
          return {
            ...t,
            status,
            completedAt: status === 'done' ? now : null,
            updatedAt: now,
          };
        }
        return t;
      });

      set({ tasks: updatedTasks, selectedTaskIds: [], isSelectionMode: false });
      if (settings.soundEnabled) soundManager.playComplete();
      await dbClient.saveAllTasks(updatedTasks);
      dbClient.saveAutoBackup(updatedTasks, settings, get().metrics);
      broadcastMessage({ type: 'MUTATION_OCCURRED', source: 'bulkComplete', timestamp: Date.now() });

      addToast({
        type: 'success',
        title: status === 'done' ? 'Task Ditandai Selesai' : 'Task Diaktifkan Kembali',
        description: `${selectedTaskIds.length} task berhasil diperbarui.`,
      });
    },

    bulkDeleteTasks: async () => {
      const { tasks, selectedTaskIds, settings, addToast } = get();
      if (selectedTaskIds.length === 0) return;

      const idSet = new Set(selectedTaskIds);
      const tasksToDelete = tasks.filter((t) => idSet.has(t.id));
      const remainingTasks = tasks.filter((t) => !idSet.has(t.id));
      const count = tasksToDelete.length;

      set({ tasks: remainingTasks, selectedTaskIds: [], isSelectionMode: false });
      if (settings.soundEnabled) soundManager.playDelete();

      await Promise.all(tasksToDelete.map((t) => dbClient.deleteTask(t.id)));
      dbClient.saveAutoBackup(remainingTasks, settings, get().metrics);
      broadcastMessage({ type: 'MUTATION_OCCURRED', source: 'bulkDelete', timestamp: Date.now() });

      addToast({
        type: 'info',
        title: `${count} Task Dihapus`,
        description: `${count} task berhasil dihapus.`,
      });
    },
  }))
);

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Task, AppSettings, DailyMetric, FilterOptions, ToastMessage, ThemePalette, ThemeMode, RecurringConfig } from '@/types/task';
import { dbClient } from '@/lib/storage/db';
import { getTodayDateString, isYesterday, getDaysDifference, shouldGenerateRecurringTask } from '@/lib/date-utils';
import { soundManager } from '@/lib/sound';

export interface TaskState {
  tasks: Task[];
  metrics: DailyMetric[];
  settings: AppSettings;
  filters: FilterOptions;
  toasts: ToastMessage[];
  isLoading: boolean;
  isInitialized: boolean;
  selectedTaskId: string | null;
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
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (newOrderedTasks: Task[]) => Promise<void>;
  checkAndRunDailyReset: () => Promise<void>;
  importTasks: (importedTasks: Task[], mode: 'replace' | 'merge') => Promise<void>;
  setFilter: (filters: Partial<FilterOptions>) => void;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  setTheme: (palette: ThemePalette, mode: ThemeMode) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  setSelectedTask: (id: string | null) => void;
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
  lastActiveDate: getTodayDateString(),
  streak: 1,
  bestStreak: 1,
};

const initialFilters: FilterOptions = {
  status: 'all',
  priority: 'all',
  category: 'all',
  searchQuery: '',
};

export const useTaskStore = create<TaskStore>()(
  subscribeWithSelector((set, get) => ({
    tasks: [],
    metrics: [],
    settings: initialSettings,
    filters: initialFilters,
    toasts: [],
    isLoading: true,
    isInitialized: false,
    selectedTaskId: null,
    importModalOpen: false,
    settingsModalOpen: false,
    isSelectionMode: false,
    selectedTaskIds: [],

    initializeStore: async () => {
      try {
        const [savedTasks, savedSettings, savedMetrics] = await Promise.all([
          dbClient.getAllTasks(),
          dbClient.getSettings(),
          dbClient.getAllMetrics(),
        ]);

        // Migrate old settings format
        let settings: AppSettings;
        if (savedSettings) {
          // Handle migration from old 'theme' field to new themePalette/themeMode
          const raw = savedSettings as unknown as Record<string, unknown>;
          if ('theme' in raw && !('themePalette' in raw)) {
            const oldTheme = raw.theme as string;
            settings = {
              ...initialSettings,
              ...savedSettings,
              themePalette: 'warm-clay',
              themeMode: oldTheme === 'dark' ? 'dark' : 'light',
            };
          } else {
            settings = { ...initialSettings, ...savedSettings };
          }
        } else {
          settings = initialSettings;
        }

        // Ensure any tasks missing titles are safely recovered & migrate to daily checklist default
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

          if (!t.title || t.isRecurring !== isRecurring || t.isOneTime !== isOneTime) {
            didMigrate = true;
          }

          return {
            ...t,
            title: fallbackTitle,
            isRecurring,
            recurringConfig,
            isOneTime,
          };
        });

        if (didMigrate && tasks.length > 0) {
          await dbClient.saveAllTasks(tasks);
        }

        const metrics = savedMetrics || [];

        applyThemeToDOM(settings.themePalette, settings.themeMode, settings.reducedMotion);

        set({
          tasks,
          settings,
          metrics,
          isLoading: false,
          isInitialized: true,
        });

        await get().checkAndRunDailyReset();
      } catch (err) {
        console.error('Failed to initialize task store:', err);
        set({ isLoading: false, isInitialized: true });
      }
    },

    checkAndRunDailyReset: async () => {
      const { settings, tasks, metrics } = get();
      const today = getTodayDateString();
      const lastDate = settings.lastActiveDate;

      console.log('[DailyReset] Checking daily reset:', {
        lastActiveDate: lastDate,
        today,
        autoResetBehavior: settings.autoResetBehavior,
        needsReset: Boolean(lastDate && lastDate !== today),
      });

      // If no lastActiveDate stored yet (first launch), set it to today and persist immediately
      if (!lastDate) {
        const newSettings: AppSettings = { ...settings, lastActiveDate: today };
        set({ settings: newSettings });
        await dbClient.saveSettings(newSettings);
        return;
      }

      // If already processed for today, do nothing
      if (lastDate === today) {
        return;
      }

      const isConsecutive = isYesterday(lastDate);
      const yesterdayTasks = tasks.filter(t => !t.date || t.date === lastDate);
      const yesterdayDone = yesterdayTasks.filter(t => t.status === 'done').length;
      const yesterdayRate = yesterdayTasks.length > 0 ? (yesterdayDone / yesterdayTasks.length) * 100 : 0;

      let newStreak = settings.streak;
      if (isConsecutive) {
        if (yesterdayDone > 0) newStreak += 1;
      } else {
        newStreak = 1;
      }

      const bestStreak = Math.max(settings.bestStreak || 1, newStreak);

      let updatedMetrics = [...metrics];
      if (yesterdayTasks.length > 0 && !metrics.some(m => m.date === lastDate)) {
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

      // Daily Checklist Reset Logic:
      // 1. Recurring tasks (default for all routine tasks):
      //    - STAY in the daily checklist!
      //    - Status is reset from 'done' back to 'pending'
      //    - completedAt is reset to null
      //    - date is updated to today
      // 2. One-time tasks (isOneTime: true / isRecurring: false):
      //    - If completed ('done') yesterday: archived with date = lastDate (will NOT appear in today's active list)
      //    - If pending: if carry-over mode, move to today; if archive mode, archived to lastDate.
      const updatedTasks: Task[] = tasks.map((t) => {
        const isOneTime = Boolean(t.isOneTime) || t.isRecurring === false;

        if (isOneTime) {
          // One-time task
          if (t.status === 'done') {
            // Archived into history with yesterday's date
            return {
              ...t,
              date: t.date || lastDate,
            };
          } else {
            // Still pending
            if (settings.autoResetBehavior === 'carry-over') {
              return {
                ...t,
                date: today,
                updatedAt: now,
              };
            } else {
              return {
                ...t,
                date: t.date || lastDate,
              };
            }
          }
        } else {
          // Recurring / Daily Checklist task (isRecurring: true)
          // Evaluate interval or schedule if specified
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
              // Not scheduled for today; keep previous date / inactive
              return {
                ...t,
                date: t.date || lastDate,
              };
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
              return {
                ...t,
                date: t.date || lastDate,
              };
            }
          }

          // Default: Daily Checklist Task
          // ALWAYS stays in today's active list with pending status!
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
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        date: today,
      };

      const updated = [newTask, ...tasks];
      set({ tasks: updated });
      if (settings.soundEnabled) soundManager.playClick();
      await dbClient.saveTask(newTask);
      return newTask;
    },

    toggleTaskStatus: async (id: string) => {
      const { tasks, settings } = get();
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const nextStatus = task.status === 'done' ? 'pending' : 'done';
      const now = new Date().toISOString();
      const updatedTask: Task = { ...task, status: nextStatus, completedAt: nextStatus === 'done' ? now : null, updatedAt: now };
      const updatedTasks = tasks.map(t => (t.id === id ? updatedTask : t));
      set({ tasks: updatedTasks });

      if (settings.soundEnabled) {
        nextStatus === 'done' ? soundManager.playComplete() : soundManager.playClick();
      }
      await dbClient.saveTask(updatedTask);
    },

    updateTask: async (id, updates) => {
      const { tasks } = get();
      const now = new Date().toISOString();
      const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: now } : t);
      const updatedItem = updatedTasks.find(t => t.id === id);
      set({ tasks: updatedTasks });
      if (updatedItem) await dbClient.saveTask(updatedItem);
    },

    deleteTask: async (id: string) => {
      const { tasks, settings, addToast } = get();
      const taskToDelete = tasks.find((t) => t.id === id);
      if (!taskToDelete) return;

      const originalIndex = tasks.findIndex((t) => t.id === id);

      // Optimistically remove from state
      set({ tasks: tasks.filter((t) => t.id !== id) });
      if (settings.soundEnabled) soundManager.playDelete();

      let isUndone = false;

      // Schedule permanent DB deletion after 5 seconds
      const timer = setTimeout(async () => {
        if (!isUndone) {
          await dbClient.deleteTask(id);
        }
      }, 5000);

      // Show Toast with Undo action
      addToast({
        type: 'info',
        title: 'Task Dihapus',
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
    },

    importTasks: async (importedTasks: Task[], mode: 'replace' | 'merge') => {
      const { tasks } = get();
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
        };
      });

      let finalTasks: Task[];
      if (mode === 'replace') {
        finalTasks = processedImports;
      } else {
        const existingMap = new Map<string, Task>();
        tasks.forEach(t => existingMap.set(t.id, t));
        processedImports.forEach(t => existingMap.set(t.id, t));
        finalTasks = Array.from(existingMap.values());
      }
      set({ tasks: finalTasks });
      await dbClient.saveAllTasks(finalTasks);
      get().addToast({ type: 'success', title: 'Import Berhasil', description: `${importedTasks.length} task berhasil dimuat.` });
    },

    setFilter: (newFilters) => {
      set(state => ({ filters: { ...state.filters, ...newFilters } }));
    },

    updateSettings: async (updates) => {
      const { settings } = get();
      const newSettings = { ...settings, ...updates };
      applyThemeToDOM(newSettings.themePalette, newSettings.themeMode, newSettings.reducedMotion);
      set({ settings: newSettings });
      await dbClient.saveSettings(newSettings);
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
      set(state => ({ toasts: [...state.toasts, newToast] }));
      setTimeout(() => { get().removeToast(id); }, newToast.duration);
    },

    removeToast: (id: string) => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    },

    setSelectedTask: (id) => set({ selectedTaskId: id }),
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

      addToast({
        type: 'info',
        title: `${count} Task Dihapus`,
        description: `${count} task berhasil dihapus.`,
      });
    },
  }))
);

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Task, AppSettings, DailyMetric, FilterOptions, ToastMessage, ThemePalette, ThemeMode } from '@/types/task';
import { dbClient } from '@/lib/storage/db';
import { getTodayDateString, isYesterday } from '@/lib/date-utils';
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
}

export interface TaskActions {
  initializeStore: () => Promise<void>;
  addTask: (title: string, priority?: Task['priority'], category?: Task['category'], dueDate?: string | null) => Promise<Task>;
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

        // Ensure any tasks missing titles are safely recovered
        const rawTasks = savedTasks || [];
        let didRepair = false;
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

          if (!t.title || !t.title.trim()) {
            didRepair = true;
          }

          return {
            ...t,
            title: fallbackTitle,
          };
        });

        if (didRepair && tasks.length > 0) {
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

      if (!lastDate || lastDate === today) return;

      const isConsecutive = isYesterday(lastDate);
      const yesterdayTasks = tasks.filter(t => t.date === lastDate);
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

      let updatedTasks: Task[];
      if (settings.autoResetBehavior === 'carry-over') {
        updatedTasks = tasks.map(t => {
          if (t.status === 'pending') {
            return { ...t, date: today, updatedAt: new Date().toISOString() };
          }
          return t;
        });
      } else {
        updatedTasks = [...tasks];
      }

      const newSettings: AppSettings = { ...settings, lastActiveDate: today, streak: newStreak, bestStreak };
      set({ tasks: updatedTasks, settings: newSettings, metrics: updatedMetrics });
      await Promise.all([dbClient.saveAllTasks(updatedTasks), dbClient.saveSettings(newSettings)]);
    },

    addTask: async (title, priority = 'normal', category = 'work', dueDate = null) => {
      const { tasks, settings } = get();
      const now = new Date().toISOString();
      const today = getTodayDateString();

      const newTask: Task = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'task_' + Date.now(),
        title: title.trim(),
        status: 'pending',
        priority,
        category,
        dueDate,
        order: tasks.length,
        isRecurring: false,
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
      const { tasks, settings } = get();
      set({ tasks: tasks.filter(t => t.id !== id) });
      if (settings.soundEnabled) soundManager.playDelete();
      await dbClient.deleteTask(id);
      get().addToast({ type: 'info', title: 'Task Dihapus' });
    },

    reorderTasks: async (newOrderedTasks: Task[]) => {
      const reindexed = newOrderedTasks.map((t, idx) => ({ ...t, order: idx }));
      set({ tasks: reindexed });
      await dbClient.saveAllTasks(reindexed);
    },

    importTasks: async (importedTasks: Task[], mode: 'replace' | 'merge') => {
      const { tasks } = get();
      let finalTasks: Task[];
      if (mode === 'replace') {
        finalTasks = importedTasks;
      } else {
        const existingMap = new Map<string, Task>();
        tasks.forEach(t => existingMap.set(t.id, t));
        importedTasks.forEach(t => existingMap.set(t.id, t));
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
  }))
);

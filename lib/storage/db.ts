import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Task, AppSettings, DailyMetric, MonthlyMetricSummary } from '@/types/task';
import { getTodayDateString, formatYearMonth, getDaysDifference } from '@/lib/date-utils';

interface DailyFocusDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: {
      'by-date': string;
      'by-status': string;
      'by-order': number;
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  metrics: {
    key: string;
    value: DailyMetric;
  };
  monthly_summaries: {
    key: string;
    value: MonthlyMetricSummary;
  };
}

const DB_NAME = 'daily-focus-db';
const DB_VERSION = 2;
const AUTO_BACKUP_KEY = 'daily_focus_auto_backup';

let dbPromise: Promise<IDBPDatabase<DailyFocusDB>> | null = null;

function getDB(): Promise<IDBPDatabase<DailyFocusDB>> | null {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<DailyFocusDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by-date', 'date');
          taskStore.createIndex('by-status', 'status');
          taskStore.createIndex('by-order', 'order');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('metrics')) {
          db.createObjectStore('metrics', { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains('monthly_summaries')) {
          db.createObjectStore('monthly_summaries', { keyPath: 'month' });
        }
      },
    });
  }
  return dbPromise;
}

export const dbClient = {
  async getAllTasks(): Promise<Task[]> {
    try {
      const db = await getDB();
      if (!db) return this.getLocalTasks();
      return await db.getAll('tasks');
    } catch (err) {
      console.warn('[DB] Failed to getAllTasks, using fallback:', err);
      return this.getLocalTasks();
    }
  },

  async saveTask(task: Task): Promise<void> {
    try {
      const db = await getDB();
      if (db) {
        await db.put('tasks', task);
      }
      this.saveLocalTask(task);
    } catch (err) {
      console.warn('[DB] Failed to saveTask:', err);
      this.saveLocalTask(task);
    }
  },

  async saveAllTasks(tasks: Task[]): Promise<void> {
    try {
      const db = await getDB();
      if (db) {
        const tx = db.transaction('tasks', 'readwrite');
        await tx.store.clear();
        for (const task of tasks) {
          await tx.store.put(task);
        }
        await tx.done;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('daily-focus-tasks', JSON.stringify(tasks));
      }
    } catch (err) {
      console.warn('[DB] Failed to saveAllTasks:', err);
      if (typeof window !== 'undefined') {
        localStorage.setItem('daily-focus-tasks', JSON.stringify(tasks));
      }
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      const db = await getDB();
      if (db) {
        await db.delete('tasks', id);
      }
      this.deleteLocalTask(id);
    } catch {
      this.deleteLocalTask(id);
    }
  },

  async getSettings(): Promise<AppSettings | null> {
    try {
      const db = await getDB();
      if (!db) return this.getLocalSettings();
      const settings = await db.get('settings', 'app_config');
      return settings || this.getLocalSettings();
    } catch {
      return this.getLocalSettings();
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const db = await getDB();
      if (db) {
        await db.put('settings', settings, 'app_config');
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('daily-focus-settings', JSON.stringify(settings));
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.setItem('daily-focus-settings', JSON.stringify(settings));
      }
    }
  },

  async getAllMetrics(): Promise<DailyMetric[]> {
    try {
      const db = await getDB();
      if (!db) return this.getLocalMetrics();
      return await db.getAll('metrics');
    } catch {
      return this.getLocalMetrics();
    }
  },

  async saveMetric(metric: DailyMetric): Promise<void> {
    try {
      const db = await getDB();
      if (db) {
        await db.put('metrics', metric);
      }
      const local = this.getLocalMetrics();
      const idx = local.findIndex((m) => m.date === metric.date);
      if (idx >= 0) {
        local[idx] = metric;
      } else {
        local.push(metric);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('daily-focus-metrics', JSON.stringify(local));
      }
    } catch {
      // fallback
    }
  },

  async getAllMonthlySummaries(): Promise<MonthlyMetricSummary[]> {
    try {
      const db = await getDB();
      if (!db) return this.getLocalMonthlySummaries();
      return await db.getAll('monthly_summaries');
    } catch {
      return this.getLocalMonthlySummaries();
    }
  },

  async saveMonthlySummary(summary: MonthlyMetricSummary): Promise<void> {
    try {
      const db = await getDB();
      if (db) {
        await db.put('monthly_summaries', summary);
      }
      const local = this.getLocalMonthlySummaries();
      const idx = local.findIndex((s) => s.month === summary.month);
      if (idx >= 0) {
        local[idx] = summary;
      } else {
        local.push(summary);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('daily-focus-monthly-summaries', JSON.stringify(local));
      }
    } catch {
      // fallback
    }
  },

  /**
   * Data Retention & Monthly Aggregation:
   * Keeps raw daily logs for the last 90 days.
   * Summarizes daily logs >90 days into MonthlyMetricSummary records and prunes the raw entries.
   */
  async runDataRetentionPrune(
    currentMetrics: DailyMetric[],
    retentionDays: number = 90
  ): Promise<{ remainingMetrics: DailyMetric[]; generatedSummaries: MonthlyMetricSummary[] }> {
    const today = getTodayDateString();
    const olderMetrics: DailyMetric[] = [];
    const remainingMetrics: DailyMetric[] = [];

    currentMetrics.forEach((m) => {
      const diff = getDaysDifference(m.date, today);
      if (diff > retentionDays) {
        olderMetrics.push(m);
      } else {
        remainingMetrics.push(m);
      }
    });

    if (olderMetrics.length === 0) {
      return { remainingMetrics: currentMetrics, generatedSummaries: [] };
    }

    console.log(`[Retention] Summarizing and pruning ${olderMetrics.length} daily logs older than ${retentionDays} days...`);

    // Group older metrics by YYYY-MM
    const monthGroups = new Map<string, DailyMetric[]>();
    olderMetrics.forEach((m) => {
      const month = formatYearMonth(m.date);
      if (!monthGroups.has(month)) {
        monthGroups.set(month, []);
      }
      monthGroups.get(month)!.push(m);
    });

    const generatedSummaries: MonthlyMetricSummary[] = [];
    const db = await getDB();

    for (const [month, metricsList] of Array.from(monthGroups.entries())) {
      const totalCompleted = metricsList.reduce((acc, m) => acc + m.completedCount, 0);
      const totalTasks = metricsList.reduce((acc, m) => acc + m.totalCount, 0);
      const avgCompletionRate = Math.round(
        metricsList.reduce((acc, m) => acc + m.completionRate, 0) / metricsList.length
      );
      const daysTracked = metricsList.length;
      const perfectDays = metricsList.filter((m) => m.completionRate === 100).length;

      const summary: MonthlyMetricSummary = {
        month,
        totalCompleted,
        totalTasks,
        avgCompletionRate,
        daysTracked,
        perfectDays,
        updatedAt: new Date().toISOString(),
      };

      generatedSummaries.push(summary);
      await this.saveMonthlySummary(summary);
    }

    // Prune old raw metrics from DB
    if (db) {
      const tx = db.transaction('metrics', 'readwrite');
      for (const m of olderMetrics) {
        await tx.store.delete(m.date);
      }
      await tx.done;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('daily-focus-metrics', JSON.stringify(remainingMetrics));
    }

    return { remainingMetrics, generatedSummaries };
  },

  /**
   * Safety Net: Auto-backup snapshot to localStorage
   */
  saveAutoBackup(tasks: Task[], settings: AppSettings, metrics: DailyMetric[]): void {
    if (typeof window === 'undefined') return;
    try {
      const backupPayload = {
        timestamp: Date.now(),
        exportedAt: new Date().toISOString(),
        tasks,
        settings,
        metrics,
      };
      localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backupPayload));
    } catch {
      // quota or storage error
    }
  },

  getAutoBackupSnapshot(): { tasks: Task[]; settings: AppSettings; metrics: DailyMetric[] } | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(AUTO_BACKUP_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Fallbacks
  getLocalTasks(): Task[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('daily-focus-tasks');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLocalTask(task: Task): void {
    const tasks = this.getLocalTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.push(task);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('daily-focus-tasks', JSON.stringify(tasks));
    }
  },

  deleteLocalTask(id: string): void {
    const tasks = this.getLocalTasks().filter((t) => t.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('daily-focus-tasks', JSON.stringify(tasks));
    }
  },

  getLocalSettings(): AppSettings | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('daily-focus-settings');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getLocalMetrics(): DailyMetric[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('daily-focus-metrics');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getLocalMonthlySummaries(): MonthlyMetricSummary[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('daily-focus-monthly-summaries');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
};

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Task, AppSettings, DailyMetric } from '@/types/task';

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
}

const DB_NAME = 'daily-focus-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DailyFocusDB>> | null = null;

function getDB(): Promise<IDBPDatabase<DailyFocusDB>> | null {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<DailyFocusDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
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
    } catch {
      return this.getLocalTasks();
    }
  },

  async saveTask(task: Task): Promise<void> {
    try {
      const db = await getDB();
      if (!db) {
        this.saveLocalTask(task);
        return;
      }
      await db.put('tasks', task);
      this.saveLocalTask(task); // sync backup
    } catch {
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
    } catch {
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
      const idx = local.findIndex(m => m.date === metric.date);
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
    const idx = tasks.findIndex(t => t.id === task.id);
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
    const tasks = this.getLocalTasks().filter(t => t.id !== id);
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
  }
};

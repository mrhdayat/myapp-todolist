export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';

export type TaskCategory = 'work' | 'personal' | 'health' | 'learning' | 'finance' | 'other';

export type TaskStatus = 'pending' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string | null;
  order: number;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  date: string; // YYYY-MM-DD
}

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  completedCount: number;
  totalCount: number;
  completionRate: number;
}

export type AutoResetBehavior = 'carry-over' | 'archive';

export type ThemePalette = 'warm-clay' | 'blob-pastel' | 'ocean-breeze' | 'midnight-carbon';
export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  themePalette: ThemePalette;
  themeMode: ThemeMode;
  reducedMotion: boolean;
  soundEnabled: boolean;
  autoResetBehavior: AutoResetBehavior;
  lastActiveDate: string; // YYYY-MM-DD
  streak: number;
  bestStreak: number;
}

export interface LegacyImportTask {
  id?: string;
  title: string;
  completed?: boolean;
  status?: string;
  priority?: string;
  category?: string;
  dueDate?: string | null;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
  date?: string;
}

export interface ImportPayload {
  version?: number;
  exportedAt?: string;
  theme?: string;
  tasks: LegacyImportTask[];
}

export interface ImportAnalysis {
  totalTasks: number;
  validTasks: Task[];
  skippedCount: number;
  skippedReasons: string[];
  pendingCount: number;
  doneCount: number;
  exportedAt?: string;
  detectedVersion?: number;
  theme?: string;
}

export interface FilterOptions {
  status: 'all' | 'pending' | 'done';
  priority: 'all' | TaskPriority;
  category: 'all' | TaskCategory;
  searchQuery: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

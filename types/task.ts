export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';

export type TaskCategory = 'work' | 'personal' | 'health' | 'learning' | 'finance' | 'other';

export type TaskStatus = 'pending' | 'done';

export type RecurringType = 'none' | 'daily' | 'interval' | 'weekdays';

export interface RecurringConfig {
  type: RecurringType;
  intervalDays?: number; // e.g. 3 for every 3 days
  weekdays?: number[]; // [0, 1, 2, 3, 4, 5, 6] (0 = Sunday, 1 = Monday, etc.)
  lastGeneratedDate?: string; // YYYY-MM-DD
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string | null;
  dueTime?: string | null;
  order: number;
  isRecurring: boolean;
  recurringConfig?: RecurringConfig;
  isOneTime?: boolean;
  isPaused?: boolean;
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

export interface MonthlyMetricSummary {
  month: string; // YYYY-MM
  totalCompleted: number;
  totalTasks: number;
  avgCompletionRate: number;
  daysTracked: number;
  perfectDays: number;
  updatedAt: string;
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
  firstActiveDate?: string; // YYYY-MM-DD (recorded on Day 1)
  lastActiveDate: string; // YYYY-MM-DD
  streak: number;
  bestStreak: number;
  schemaVersion?: number; // Versioning for migrations (current = 2)
  retentionDays?: number; // Granular retention in days (default = 90)
  autoCleanArchivedMonths?: number; // Months of archived history before purge (default = 3, 0 = never)
}

export interface LegacyImportTask {
  id?: string;
  title: string;
  completed?: boolean;
  status?: string;
  priority?: string;
  category?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  order?: number;
  isRecurring?: boolean;
  recurringConfig?: RecurringConfig;
  isOneTime?: boolean;
  isPaused?: boolean;
  createdAt?: string;
  updatedAt?: string;
  date?: string;
}

export interface ImportPayload {
  version?: number;
  schemaVersion?: number;
  exportedAt?: string;
  theme?: string;
  tasks: LegacyImportTask[];
  metrics?: DailyMetric[];
  monthlySummaries?: MonthlyMetricSummary[];
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

export type SyncMessage =
  | { type: 'TASKS_SYNC'; tasks: Task[]; timestamp: number }
  | { type: 'SETTINGS_SYNC'; settings: AppSettings; timestamp: number }
  | { type: 'DAILY_RESET_NOTIFY'; date: string; timestamp: number }
  | { type: 'MUTATION_OCCURRED'; source: string; timestamp: number };

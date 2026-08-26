import { Task, TaskPriority, TaskCategory, TaskStatus, ImportPayload, ImportAnalysis } from '@/types/task';
import { getTodayDateString } from '@/lib/date-utils';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'task_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

function normalizePriority(raw?: unknown): TaskPriority {
  if (typeof raw === 'number') {
    if (raw >= 3) return 'urgent';
    if (raw === 2) return 'high';
    if (raw === 1) return 'normal';
    return 'low';
  }
  const lower = String(raw || '').toLowerCase().trim();
  if (['urgent', 'darurat', 'critical', 'p1', 'urgent priority'].includes(lower)) return 'urgent';
  if (['high', 'tinggi', 'p2', 'high priority'].includes(lower)) return 'high';
  if (['low', 'rendah', 'p4', 'low priority'].includes(lower)) return 'low';
  return 'normal';
}

function normalizeCategory(raw?: unknown): TaskCategory {
  const lower = String(raw || '').toLowerCase().trim();
  if (['work', 'kerja', 'kantor', 'pekerjaan', 'job', 'office'].includes(lower)) return 'work';
  if (['personal', 'pribadi', 'rumah', 'home', 'life', 'harian'].includes(lower)) return 'personal';
  if (['health', 'kesehatan', 'olahraga', 'fitnes', 'gym', 'medis'].includes(lower)) return 'health';
  if (['learning', 'belajar', 'studi', 'buku', 'study', 'kursus', 'kuliah'].includes(lower)) return 'learning';
  if (['finance', 'keuangan', 'uang', 'money', 'budget', 'finansial'].includes(lower)) return 'finance';
  return 'other';
}

function extractTaskTitle(item: Record<string, unknown>): string {
  const candidates = [
    item.title,
    item.text,
    item.name,
    item.task,
    item.content,
    item.todo,
    item.label,
    item.summary,
    item.description,
    item.header,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) {
      return c.trim();
    }
  }

  // If item is string directly
  if (typeof item === 'string') {
    return String(item).trim();
  }

  return '';
}

function extractTaskStatus(item: Record<string, unknown>): TaskStatus {
  // Check boolean flags
  if (typeof item.completed === 'boolean') {
    return item.completed ? 'done' : 'pending';
  }
  if (typeof item.isDone === 'boolean') {
    return item.isDone ? 'done' : 'pending';
  }
  if (typeof item.done === 'boolean') {
    return item.done ? 'done' : 'pending';
  }
  if (typeof item.finished === 'boolean') {
    return item.finished ? 'done' : 'pending';
  }

  // Check string status
  const rawStatus = String(item.status || item.state || item.stage || '').toLowerCase().trim();
  if (['done', 'completed', 'selesai', 'finished', 'complete', 'closed', 'resolved'].includes(rawStatus)) {
    return 'done';
  }

  return 'pending';
}

export function parseAndAnalyzeImport(jsonString: string): ImportAnalysis {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('File bukan JSON yang valid. Periksa kembali struktur file Anda.');
  }

  if (!parsed || (typeof parsed !== 'object' && !Array.isArray(parsed))) {
    throw new Error('Format JSON tidak sesuai: data utama harus berupa objek atau array.');
  }

  let tasksRaw: unknown[] = [];
  let exportedAt: string | undefined;
  let detectedVersion: number | undefined;
  let theme: string | undefined;

  if (Array.isArray(parsed)) {
    tasksRaw = parsed;
  } else {
    const obj = parsed as Record<string, unknown>;
    detectedVersion = typeof obj.version === 'number' ? obj.version : 1;
    exportedAt = typeof obj.exportedAt === 'string' ? obj.exportedAt : typeof obj.createdAt === 'string' ? obj.createdAt : undefined;
    theme = typeof obj.theme === 'string' ? obj.theme : typeof obj.themePalette === 'string' ? obj.themePalette : undefined;

    // Search for array of tasks in common keys
    if (Array.isArray(obj.tasks)) {
      tasksRaw = obj.tasks;
    } else if (Array.isArray(obj.todos)) {
      tasksRaw = obj.todos;
    } else if (Array.isArray(obj.items)) {
      tasksRaw = obj.items;
    } else if (Array.isArray(obj.data)) {
      tasksRaw = obj.data;
    } else if (Array.isArray(obj.list)) {
      tasksRaw = obj.list;
    } else {
      // Find first array property in object
      const possibleArray = Object.values(obj).find((val) => Array.isArray(val));
      if (possibleArray) {
        tasksRaw = possibleArray as unknown[];
      } else {
        throw new Error('Tidak ditemukan daftar task (array "tasks", "todos", atau "items") dalam file JSON.');
      }
    }
  }

  const today = getTodayDateString();
  const validTasks: Task[] = [];
  const skippedReasons: string[] = [];
  let skippedCount = 0;
  let pendingCount = 0;
  let doneCount = 0;

  tasksRaw.forEach((item, index) => {
    if (!item) {
      skippedCount++;
      skippedReasons.push(`Item #${index + 1}: Data kosong`);
      return;
    }

    let record: Record<string, unknown> = {};
    if (typeof item === 'string') {
      record = { title: item };
    } else if (typeof item === 'object') {
      record = item as Record<string, unknown>;
    } else {
      skippedCount++;
      skippedReasons.push(`Item #${index + 1}: Bukan format task yang valid`);
      return;
    }

    const title = extractTaskTitle(record);

    if (!title) {
      skippedCount++;
      skippedReasons.push(`Item #${index + 1}: Judul task kosong`);
      return;
    }

    const status = extractTaskStatus(record);

    if (status === 'done') {
      doneCount++;
    } else {
      pendingCount++;
    }

    const nowIso = new Date().toISOString();
    const rawId = record.id || record._id || record.key || record.uuid;

    const isOneTime = Boolean(record.isOneTime);
    const isRecurring = isOneTime ? false : (record.isRecurring !== undefined ? Boolean(record.isRecurring) : true);
    const recurringConfig = isRecurring ? ((record.recurringConfig as any) || { type: 'daily' }) : undefined;

    const task: Task = {
      id: typeof rawId === 'string' && rawId.length > 0 ? rawId : generateId(),
      title,
      description: typeof record.description === 'string' && record.description !== title ? record.description : undefined,
      status,
      priority: normalizePriority(record.priority || record.prio || record.importance),
      category: normalizeCategory(record.category || record.tag || record.label || record.folder),
      dueDate: typeof record.dueDate === 'string' ? record.dueDate : typeof record.due === 'string' ? record.due : null,
      dueTime: typeof record.dueTime === 'string' ? record.dueTime : null,
      order: typeof record.order === 'number' ? record.order : index,
      isRecurring,
      recurringConfig,
      isOneTime,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : nowIso,
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : nowIso,
      completedAt: status === 'done' ? (typeof record.completedAt === 'string' ? record.completedAt : nowIso) : null,
      date: typeof record.date === 'string' ? record.date : today,
    };

    validTasks.push(task);
  });

  return {
    totalTasks: tasksRaw.length,
    validTasks,
    skippedCount,
    skippedReasons,
    pendingCount,
    doneCount,
    exportedAt,
    detectedVersion,
    theme,
  };
}

export function exportTasksToJSON(tasks: Task[], theme: string = 'warm-clay'): string {
  const payload: ImportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    theme,
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.status === 'done',
      status: t.status,
      priority: t.priority,
      category: t.category,
      dueDate: t.dueDate || null,
      dueTime: t.dueTime || null,
      order: t.order,
      isRecurring: t.isRecurring,
      recurringConfig: t.recurringConfig,
      isOneTime: t.isOneTime,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      date: t.date,
    })),
  };

  return JSON.stringify(payload, null, 2);
}

import { Task } from '@/types/task';

export interface StreakCalculationResult {
  newStreak: number;
  bestStreak: number;
  status: 'incremented' | 'broken' | 'neutral';
  reason: string;
}

/**
 * Pure function to calculate streak progression according to strict lifecycle rules:
 * 1. Minimal 1 task and 100% completed on the day -> Streak +1 (if consecutive day) or reset to 1 (if gap).
 * 2. 0 tasks on the day (empty list) -> Neutral (does not increment, does not break streak).
 * 3. Minimal 1 task and < 100% completed -> Streak broken, reset to 0.
 */
export function calculateStreakUpdate(
  yesterdayTasks: Task[],
  currentStreak: number = 0,
  bestStreak: number = 0,
  isConsecutiveDay: boolean = true
): StreakCalculationResult {
  const activeTasks = yesterdayTasks.filter((t) => !t.isPaused);
  const totalCount = activeTasks.length;

  // Case 1: Empty list all day -> Neutral
  if (totalCount === 0) {
    return {
      newStreak: currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      status: 'neutral',
      reason: 'Tidak ada task pada hari sebelumnya (kasus netral, streak dipertahankan).',
    };
  }

  const doneCount = activeTasks.filter((t) => t.status === 'done').length;
  const isAllDone = doneCount === totalCount;

  // Case 2: All tasks completed 100%
  if (isAllDone) {
    const newStreak = isConsecutiveDay ? currentStreak + 1 : 1;
    const newBestStreak = Math.max(bestStreak, newStreak);
    return {
      newStreak,
      bestStreak: newBestStreak,
      status: 'incremented',
      reason: `Semua ${totalCount} task selesai (100%). Streak bertambah.`,
    };
  }

  // Case 3: Incomplete tasks remain -> Streak broken to 0
  return {
    newStreak: 0,
    bestStreak: Math.max(bestStreak, currentStreak),
    status: 'broken',
    reason: `${totalCount - doneCount} dari ${totalCount} task belum selesai. Streak reset ke 0.`,
  };
}

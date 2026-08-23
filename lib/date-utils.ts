/**
 * Date utility helpers for Daily Focus
 */
import { RecurringConfig } from '@/types/task';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(dateStr: string, locale: string = 'id-ID'): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

export function isYesterday(dateStr: string): boolean {
  const today = new Date();
  const target = new Date(dateStr);
  const diffTime = today.setHours(0, 0, 0, 0) - target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

export function getPast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
  }
  return days;
}

export function getDayName(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('id-ID', { weekday: 'short' });
  } catch {
    return '';
  }
}

export function getDaysDifference(dateStrA: string, dateStrB: string): number {
  try {
    const [yA, mA, dA] = dateStrA.split('-').map(Number);
    const [yB, mB, dB] = dateStrB.split('-').map(Number);
    const dateA = new Date(yA, mA - 1, dA);
    const dateB = new Date(yB, mB - 1, dB);
    const diffTime = Math.abs(dateA.getTime() - dateB.getTime());
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function shouldGenerateRecurringTask(
  config: RecurringConfig | undefined,
  fallbackBaseDate: string | undefined,
  targetDate: string
): boolean {
  if (!config || config.type === 'none') return false;
  if (config.lastGeneratedDate === targetDate) return false;

  const [y, m, d] = targetDate.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const dayOfWeek = target.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

  if (config.type === 'daily') {
    return true;
  }

  if (config.type === 'interval') {
    const interval = Number(config.intervalDays) || 3;
    const baseDate = config.lastGeneratedDate || fallbackBaseDate;
    if (!baseDate) return true;
    const diff = getDaysDifference(baseDate, targetDate);
    return diff >= interval;
  }

  if (config.type === 'weekdays') {
    const days = config.weekdays || [1, 2, 3, 4, 5];
    return days.includes(dayOfWeek);
  }

  return false;
}

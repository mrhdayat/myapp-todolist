import { Task } from '@/types/task';
import { formatDateDisplay, getTodayDateString } from './date-utils';

/**
 * Generate formatted text summary of daily tasks ready for copy-paste
 */
export const formatTasksSummary = (tasks: Task[], dateString?: string): string => {
  const dateToUse = dateString || getTodayDateString();
  const formattedDate = formatDateDisplay(dateToUse);

  const todayTasks = tasks.filter((t) => !t.date || t.date === dateToUse);
  const doneTasks = todayTasks.filter((t) => t.status === 'done');
  const pendingTasks = todayTasks.filter((t) => t.status === 'pending');
  const total = todayTasks.length;
  const doneCount = doneTasks.length;

  let summary = `📋 Fokus Hari Ini — ${formattedDate}\n\n`;

  summary += `✅ Selesai (${doneCount}/${total}):\n`;
  if (doneTasks.length === 0) {
    summary += `  (Belum ada task selesai)\n`;
  } else {
    doneTasks.forEach((t) => {
      summary += `- ${t.title || 'Task'}\n`;
    });
  }

  summary += `\n⏳ Belum Selesai (${pendingTasks.length}):\n`;
  if (pendingTasks.length === 0) {
    summary += `  (Semua task selesai! 🎉)\n`;
  } else {
    pendingTasks.forEach((t) => {
      const priorityLabel =
        t.priority === 'urgent' ? ' [Darurat]' : t.priority === 'high' ? ' [Tinggi]' : '';
      summary += `- ${t.title || 'Task'}${priorityLabel}\n`;
    });
  }

  return summary.trim();
};

/**
 * Robust clipboard copy with fallback
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};

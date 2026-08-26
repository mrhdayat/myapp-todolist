'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';
import { getTodayDateString } from '@/lib/date-utils';
import { formatTasksSummary, copyToClipboard } from '@/lib/clipboard';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import { IconWrapper } from '@/components/ui/IconWrapper';
import { NeuButton } from '@/components/ui/NeuButton';

export const SignatureTitle: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const addToast = useTaskStore((state) => state.addToast);
  const [copied, setCopied] = useState(false);
  const today = getTodayDateString();

  const todayTasks = tasks.filter((t) => !t.date || t.date === today);
  const activeTodayTasks = todayTasks.filter((t) => !t.isPaused);
  const completedCount = activeTodayTasks.filter((t) => t.status === 'done').length;
  const totalCount = activeTodayTasks.length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCopySummary = async () => {
    const summaryText = formatTasksSummary(tasks, today);
    const success = await copyToClipboard(summaryText);
    if (success) {
      setCopied(true);
      addToast({
        type: 'success',
        title: 'Ringkasan Disalin ke Clipboard',
        description: `${completedCount}/${totalCount} task siap dibagikan.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      addToast({
        type: 'error',
        title: 'Gagal Menyalin',
        description: 'Izin clipboard ditolak oleh browser.',
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 my-3 sm:my-4 select-none">
      {/* Title & Progress Badge */}
      <div className="flex items-center gap-3">
        <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-text-primary tracking-normal leading-tight">
          Fokus Hari Ini
        </h1>

        {/* High-Contrast Neumorphic Badge */}
        <motion.div
          key={`${completedCount}/${totalCount}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center"
        >
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-neu-sm font-mono text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 shadow-[3px_3px_7px_var(--shadow-dark),-2px_-2px_6px_var(--shadow-light)] border border-[var(--border-subtle)] ${
              isAllDone
                ? 'bg-status-done text-white ring-2 ring-status-done/30'
                : 'bg-surface-raised text-text-primary'
            }`}
          >
            {isAllDone && <IconWrapper icon={CheckCircle2} size={14} color="#FFFFFF" />}
            <span className={isAllDone ? 'text-white' : 'text-accent font-extrabold'}>
              {completedCount}/{totalCount}
            </span>
            <span className={`text-[11px] font-medium ${isAllDone ? 'text-white' : 'text-text-primary'}`}>
              Selesai ({percentage}%)
            </span>
          </div>
        </motion.div>
      </div>

      {/* Copy Summary Button */}
      {totalCount > 0 && (
        <NeuButton
          type="button"
          size="sm"
          variant="default"
          onClick={handleCopySummary}
          aria-label="Salin ringkasan fokus task hari ini ke clipboard"
          className="flex items-center gap-1.5"
        >
          <IconWrapper
            icon={copied ? Check : Copy}
            size="sm"
            color={copied ? 'var(--status-done)' : 'var(--text-primary)'}
          />
          <span className="text-xs font-semibold font-body">
            {copied ? 'Disalin!' : 'Copy Ringkasan'}
          </span>
        </NeuButton>
      )}
    </div>
  );
};

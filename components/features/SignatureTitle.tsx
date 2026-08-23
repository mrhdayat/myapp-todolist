'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';
import { getTodayDateString } from '@/lib/date-utils';
import { CheckCircle2 } from 'lucide-react';
import { IconWrapper } from '@/components/ui/IconWrapper';

export const SignatureTitle: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const today = getTodayDateString();

  const todayTasks = tasks.filter((t) => t.date === today);
  const completedCount = todayTasks.filter((t) => t.status === 'done').length;
  const totalCount = todayTasks.length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 my-3 sm:my-4 select-none">
      {/* Title */}
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
    </div>
  );
};

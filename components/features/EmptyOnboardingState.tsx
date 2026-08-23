'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, CheckCircle2, RotateCcw, Compass, SunMedium } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { IconWrapper } from '@/components/ui/IconWrapper';
import { TaskCategory, TaskPriority } from '@/types/task';
import { DURATION, EASE_ENTER } from '@/lib/motion-tokens';

interface StarterTemplate {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  icon: string;
}

const STARTER_TASKS: StarterTemplate[] = [
  {
    id: 'starter-1',
    title: '🌅 Minum segelas air putih & peregangan pagi',
    category: 'health',
    priority: 'normal',
    icon: '💧',
  },
  {
    id: 'starter-2',
    title: '🎯 Tentukan 3 prioritas utama pekerjaan hari ini',
    category: 'work',
    priority: 'high',
    icon: '⚡',
  },
  {
    id: 'starter-3',
    title: '🧘 Istirahat 5 menit setelah 25 menit sesi fokus',
    category: 'personal',
    priority: 'normal',
    icon: '🌱',
  },
];

export const EmptyOnboardingState: React.FC = () => {
  const addTask = useTaskStore((state) => state.addTask);
  const addToast = useTaskStore((state) => state.addToast);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [isAddingAll, setIsAddingAll] = useState(false);

  const handleAddTemplate = async (template: StarterTemplate) => {
    if (addedIds.includes(template.id)) return;

    await addTask(template.title, template.priority, template.category);
    setAddedIds((prev) => [...prev, template.id]);
    addToast({
      type: 'success',
      title: 'Task Ditambahkan',
      description: template.title,
    });
  };

  const handleAddAll = async () => {
    if (isAddingAll) return;
    setIsAddingAll(true);
    try {
      for (const t of STARTER_TASKS) {
        if (!addedIds.includes(t.id)) {
          await addTask(t.title, t.priority, t.category);
        }
      }
      setAddedIds(STARTER_TASKS.map((t) => t.id));
      addToast({
        type: 'success',
        title: '3 Task Awal Ditambahkan',
        description: 'Mulai hari produktif kamu sekarang!',
      });
    } finally {
      setIsAddingAll(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: DURATION.slow, ease: EASE_ENTER }}
      className="py-10 px-6 sm:px-8 rounded-neu-lg neu-inset text-center flex flex-col items-center justify-center gap-5 select-none my-4 border border-[var(--border-subtle)]"
    >
      {/* Neumorphic Tactical Badge */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl neu-button bg-surface-raised flex items-center justify-center text-accent shadow-[6px_6px_14px_var(--shadow-dark),-6px_-6px_14px_var(--shadow-light)]">
          <IconWrapper icon={SunMedium} size={32} color="var(--accent)" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-status-done text-white flex items-center justify-center shadow-md">
          <IconWrapper icon={Sparkles} size={12} color="#FFFFFF" />
        </div>
      </div>

      {/* Welcoming Text */}
      <div className="max-w-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-neu-sm bg-accent/10 text-accent text-xs font-mono font-medium mb-2 border border-accent/20">
          <span>Hari Baru, Fokus Baru</span>
        </div>
        <h3 className="font-display font-bold text-xl sm:text-2xl text-text-primary tracking-tight">
          Belum Ada Task Hari Ini
        </h3>
        <p className="font-body text-xs sm:text-sm text-text-secondary mt-1.5 leading-relaxed">
          Mulai harimu dengan 3–5 hal paling penting. Klik rekomendasi di bawah untuk langsung menambahkan ke daftar:
        </p>
      </div>

      {/* Quick Add Suggestions List */}
      <div className="w-full max-w-md flex flex-col gap-2.5">
        {STARTER_TASKS.map((template) => {
          const isAdded = addedIds.includes(template.id);
          return (
            <button
              key={template.id}
              type="button"
              disabled={isAdded}
              onClick={() => handleAddTemplate(template)}
              className={`w-full text-left p-3 rounded-neu-md transition-all flex items-center justify-between gap-3 border border-[var(--border-subtle)] ${
                isAdded
                  ? 'neu-inset opacity-60 cursor-default text-text-secondary'
                  : 'neu-button hover:shadow-[5px_5px_12px_var(--shadow-dark),-5px_-5px_12px_var(--shadow-light)] active:scale-[0.99] text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base flex-shrink-0">{template.icon}</span>
                <span className="text-xs sm:text-sm font-body truncate font-medium">
                  {template.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isAdded ? (
                  <span className="text-[11px] font-mono text-status-done flex items-center gap-1">
                    <IconWrapper icon={CheckCircle2} size={14} color="var(--status-done)" />
                    <span>Ditambahkan</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-neu-sm bg-base text-accent font-semibold flex items-center gap-1 border border-accent/20">
                    <IconWrapper icon={Plus} size={12} color="var(--accent)" />
                    <span>Tambah</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Add All Starter Tasks Shortcut */}
      {addedIds.length < STARTER_TASKS.length && (
        <button
          type="button"
          disabled={isAddingAll}
          onClick={handleAddAll}
          className="text-xs font-mono text-text-secondary hover:text-accent underline transition-colors"
        >
          + Tambahkan semua 3 rekomendasi sekaligus
        </button>
      )}
    </motion.div>
  );
};

export const FilterEmptyState: React.FC = () => {
  const setFilter = useTaskStore((state) => state.setFilter);

  return (
    <div className="py-10 px-4 rounded-neu-lg neu-inset text-center flex flex-col items-center justify-center gap-3 select-none my-4 border border-[var(--border-subtle)]">
      <div className="w-12 h-12 rounded-neu-md neu-button flex items-center justify-center text-text-secondary">
        <IconWrapper icon={Compass} size={24} />
      </div>
      <div>
        <h4 className="font-display font-semibold text-base text-text-primary">
          Tidak Ada Task yang Cocok
        </h4>
        <p className="font-body text-xs text-text-secondary mt-1 max-w-xs">
          Coba sesuaikan kata kunci pencarian atau filter status dan prioritas.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setFilter({ status: 'all', priority: 'all', category: 'all', searchQuery: '' })}
        className="mt-1 px-3.5 py-1.5 rounded-neu-sm neu-button text-xs font-mono font-semibold text-accent flex items-center gap-1.5 hover:shadow-sm"
      >
        <IconWrapper icon={RotateCcw} size={12} />
        <span>Reset Semua Filter</span>
      </button>
    </div>
  );
};

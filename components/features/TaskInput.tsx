'use client';

import React, { useState } from 'react';
import { Plus, Tag, Flag, Calendar, Sparkles } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { TaskPriority, TaskCategory } from '@/types/task';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuCard } from '@/components/ui/NeuCard';
import { IconWrapper } from '@/components/ui/IconWrapper';

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Darurat', color: 'var(--status-urgent)' },
  { value: 'high', label: 'Tinggi', color: 'var(--status-urgent)' },
  { value: 'normal', label: 'Normal', color: 'var(--accent)' },
  { value: 'low', label: 'Rendah', color: 'var(--text-secondary)' },
];

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'work', label: 'Kerja' },
  { value: 'personal', label: 'Pribadi' },
  { value: 'health', label: 'Kesehatan' },
  { value: 'learning', label: 'Belajar' },
  { value: 'finance', label: 'Keuangan' },
  { value: 'other', label: 'Lainnya' },
];

export const TaskInput: React.FC = () => {
  const addTask = useTaskStore((state) => state.addTask);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [showOptions, setShowOptions] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addTask(title, priority, category, dueDate || null);
      setTitle('');
      setDueDate('');
      setShowOptions(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <NeuCard padding="sm" className="mb-6 border border-[var(--shadow-dark)]/15">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Main Input Row */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tulis fokus task baru kamu di sini..."
              className="w-full bg-base text-text-primary placeholder:text-text-secondary placeholder:opacity-75 text-sm sm:text-base font-body rounded-neu-md neu-inset py-3 px-4 pr-16 outline-none focus:ring-1 focus:ring-accent transition-all border border-[var(--border-subtle)]"
            />
            {title.trim() && (
              <span className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-text-secondary/70 bg-surface-raised px-1.5 py-0.5 rounded border border-[var(--border-subtle)] pointer-events-none">
                ↵ Enter
              </span>
            )}
          </div>

          <NeuButton
            type="button"
            size="md"
            variant={showOptions ? 'inset' : 'default'}
            onClick={() => setShowOptions(!showOptions)}
            aria-label="Pengaturan prioritas dan kategori task"
            className="hidden sm:inline-flex"
          >
            <IconWrapper icon={Tag} size="sm" />
            <span className="text-xs">Detail</span>
          </NeuButton>

          <NeuButton
            type="submit"
            size="md"
            variant="accent-solid"
            disabled={!title.trim() || isSubmitting}
            aria-label="Tambah Task"
          >
            <IconWrapper icon={Plus} size="md" color="var(--accent-text)" />
            <span className="hidden sm:inline text-xs font-semibold">Tambah</span>
          </NeuButton>
        </div>

        {/* Options Panel (Priority, Category, Due Date) */}
        {showOptions && (
          <div className="pt-2 border-t border-[var(--shadow-dark)]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            {/* Priority Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-text-secondary font-medium mr-1 flex items-center gap-1">
                <IconWrapper icon={Flag} size="sm" /> Prioritas:
              </span>
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`text-xs px-2.5 py-1 rounded-neu-sm font-medium transition-all ${
                    priority === p.value
                      ? 'neu-inset text-accent font-semibold'
                      : 'bg-base text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-text-secondary font-medium mr-1 flex items-center gap-1">
                <IconWrapper icon={Tag} size="sm" /> Kategori:
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="bg-base text-text-primary text-xs font-body rounded-neu-sm neu-inset px-2.5 py-1 outline-none cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                <IconWrapper icon={Calendar} size="sm" /> Target:
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-base text-text-primary text-xs font-mono rounded-neu-sm neu-inset px-2 py-1 outline-none"
              />
            </div>
          </div>
        )}
      </form>
    </NeuCard>
  );
};

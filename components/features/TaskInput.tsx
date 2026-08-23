'use client';

import React, { useState } from 'react';
import { Plus, Tag, Flag, Calendar, Repeat } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { TaskPriority, TaskCategory, RecurringType, RecurringConfig } from '@/types/task';
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

const WEEKDAY_OPTIONS = [
  { day: 1, label: 'Sen' },
  { day: 2, label: 'Sel' },
  { day: 3, label: 'Rab' },
  { day: 4, label: 'Kam' },
  { day: 5, label: 'Jum' },
  { day: 6, label: 'Sab' },
  { day: 0, label: 'Min' },
];

export const TaskInput: React.FC = () => {
  const addTask = useTaskStore((state) => state.addTask);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [showOptions, setShowOptions] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<RecurringType>('interval');
  const [intervalDays, setIntervalDays] = useState(3);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleWeekday = (day: number) => {
    if (selectedWeekdays.includes(day)) {
      if (selectedWeekdays.length > 1) {
        setSelectedWeekdays(selectedWeekdays.filter((d) => d !== day));
      }
    } else {
      setSelectedWeekdays([...selectedWeekdays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const recurringConfig: RecurringConfig | undefined = isRecurring
        ? {
            type: recurringType,
            intervalDays: recurringType === 'interval' ? Number(intervalDays) || 3 : undefined,
            weekdays: recurringType === 'weekdays' ? selectedWeekdays : undefined,
          }
        : undefined;

      await addTask(title, priority, category, dueDate || null, isRecurring, recurringConfig);
      setTitle('');
      setDueDate('');
      setShowOptions(false);
      setIsRecurring(false);
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
              className="w-full bg-base text-text-primary placeholder:text-text-secondary placeholder:opacity-75 text-sm sm:text-base font-body rounded-neu-md neu-inset py-3 px-4 outline-none focus:ring-1 focus:ring-accent transition-all border border-[var(--border-subtle)]"
            />
          </div>

          <NeuButton
            type="button"
            size="md"
            variant={showOptions ? 'inset' : 'default'}
            onClick={() => setShowOptions(!showOptions)}
            aria-label="Pengaturan prioritas, kategori, dan perulangan task"
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

        {/* Options Panel */}
        {showOptions && (
          <div className="pt-3 border-t border-[var(--shadow-dark)]/20 flex flex-col gap-3 animate-fadeIn">
            {/* Top row: Priority, Category, Target Date */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
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

            {/* Recurring Section */}
            <div className="pt-2 border-t border-[var(--shadow-dark)]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-neu-sm font-medium transition-all ${
                    isRecurring
                      ? 'neu-inset text-accent font-semibold'
                      : 'bg-base text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <IconWrapper icon={Repeat} size="sm" />
                  <span>{isRecurring ? '🔄 Perulangan Aktif' : 'Perulangan Rutin'}</span>
                </button>
              </div>

              {isRecurring && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Type Buttons */}
                  <div className="inline-flex rounded-neu-sm bg-base p-0.5 neu-inset-sm">
                    <button
                      type="button"
                      onClick={() => setRecurringType('daily')}
                      className={`text-xs px-2.5 py-1 rounded-neu-sm font-medium transition-all ${
                        recurringType === 'daily'
                          ? 'bg-surface-raised text-accent font-semibold shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Harian
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurringType('interval')}
                      className={`text-xs px-2.5 py-1 rounded-neu-sm font-medium transition-all ${
                        recurringType === 'interval'
                          ? 'bg-surface-raised text-accent font-semibold shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Setiap N Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurringType('weekdays')}
                      className={`text-xs px-2.5 py-1 rounded-neu-sm font-medium transition-all ${
                        recurringType === 'weekdays'
                          ? 'bg-surface-raised text-accent font-semibold shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Hari Tertentu
                    </button>
                  </div>

                  {/* Interval Number Input */}
                  {recurringType === 'interval' && (
                    <div className="flex items-center gap-1 text-xs text-text-secondary font-medium">
                      <span>Setiap</span>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={intervalDays}
                        onChange={(e) => setIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 bg-base text-text-primary font-mono text-center text-xs rounded-neu-sm neu-inset px-1.5 py-1 outline-none font-bold"
                      />
                      <span>hari sekali</span>
                    </div>
                  )}

                  {/* Weekday Checkbox Pills */}
                  {recurringType === 'weekdays' && (
                    <div className="flex items-center gap-1">
                      {WEEKDAY_OPTIONS.map((opt) => (
                        <button
                          key={opt.day}
                          type="button"
                          onClick={() => toggleWeekday(opt.day)}
                          className={`text-[11px] w-7 h-7 rounded-neu-sm font-medium flex items-center justify-center transition-all ${
                            selectedWeekdays.includes(opt.day)
                              ? 'neu-inset text-accent font-bold ring-1 ring-accent/40'
                              : 'bg-base text-text-secondary/70 hover:text-text-primary'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </NeuCard>
  );
};

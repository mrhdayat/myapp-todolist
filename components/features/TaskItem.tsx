'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, GripVertical, Calendar, Clock, Edit3, Check, X, Copy, Zap } from 'lucide-react';
import { Task } from '@/types/task';
import { useTaskStore } from '@/store/useTaskStore';
import { NeuCheckbox } from '@/components/ui/NeuCheckbox';
import { NeuBadge } from '@/components/ui/NeuBadge';
import { NeuIconButton } from '@/components/ui/NeuIconButton';
import { IconWrapper } from '@/components/ui/IconWrapper';
import { copyToClipboard } from '@/lib/clipboard';
import { DURATION, EASE_ENTER } from '@/lib/motion-tokens';

interface TaskItemProps {
  task: Task;
  isDragging?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isDragging = false }) => {
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const addToast = useTaskStore((state) => state.addToast);
  const isSelectionMode = useTaskStore((state) => state.isSelectionMode);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const toggleSelectTask = useTaskStore((state) => state.toggleSelectTask);
  const isSelected = selectedTaskIds.includes(task.id);

  const rawRecord = task as unknown as Record<string, unknown>;
  const displayTitle =
    (typeof task.title === 'string' && task.title.trim()) ||
    (typeof rawRecord.text === 'string' && rawRecord.text.trim()) ||
    (typeof rawRecord.name === 'string' && rawRecord.name.trim()) ||
    (typeof rawRecord.task === 'string' && rawRecord.task.trim()) ||
    (typeof rawRecord.content === 'string' && rawRecord.content.trim()) ||
    (typeof rawRecord.todo === 'string' && rawRecord.todo.trim()) ||
    (typeof rawRecord.description === 'string' && rawRecord.description.trim()) ||
    'Task ' + (task.order !== undefined ? Number(task.order) + 1 : 'Baru');

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(displayTitle);
  const [justCopied, setJustCopied] = useState(false);
  const isDone = task.status === 'done';

  const handleToggle = () => {
    toggleTaskStatus(task.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode && !isEditing) {
      toggleSelectTask(task.id);
    }
  };

  const handleStartEdit = () => {
    setEditTitle(displayTitle);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateTask(task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(displayTitle);
    setIsEditing(false);
  };

  const handleCopyTask = async () => {
    const textToCopy = `${isDone ? '✅ [Selesai]' : '⏳ [Belum]'} ${displayTitle}${
      task.dueDate ? ` (Target: ${task.dueDate})` : ''
    }${task.dueTime ? ` [${task.dueTime}]` : ''}`;
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setJustCopied(true);
      addToast({
        type: 'success',
        title: 'Task Disalin',
        description: `"${displayTitle}" disalin ke clipboard.`,
      });
      setTimeout(() => setJustCopied(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      work: 'Kerja',
      personal: 'Pribadi',
      health: 'Kesehatan',
      learning: 'Belajar',
      finance: 'Keuangan',
      other: 'Lainnya',
    };
    return map[category] || category || 'Lainnya';
  };

  const getRecurringLabel = () => {
    if (task.isOneTime) return null;
    if (!task.isRecurring) return null;
    if (!task.recurringConfig) return 'Harian';
    const { type, intervalDays, weekdays } = task.recurringConfig;
    if (type === 'daily') return 'Harian';
    if (type === 'interval') return `${intervalDays || 3} Hari`;
    if (type === 'weekdays') {
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      return (weekdays || []).map((d) => dayNames[d]).join(', ');
    }
    return 'Rutin';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, height: 0, marginBottom: 0 }}
      transition={{
        duration: DURATION.normal,
        ease: EASE_ENTER,
      }}
      onClick={handleCardClick}
      className={`group rounded-neu-md p-3.5 sm:p-4 mb-3 select-none flex items-center justify-between gap-3 border border-[var(--border-subtle)] transition-all ${
        isSelectionMode ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'neu-inset ring-2 ring-accent shadow-[inset_3px_3px_7px_var(--shadow-dark)]'
          : isDone
          ? 'neu-inset'
          : isDragging
          ? 'neu-card ring-2 ring-accent/30 shadow-[8px_8px_20px_var(--shadow-dark)]'
          : 'neu-button hover:shadow-[6px_6px_14px_var(--shadow-dark),-6px_-6px_14px_var(--shadow-light)]'
      }`}
    >
      {/* Left: Drag Handle or Selection Checkbox */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        {!isSelectionMode && (
          <div
            className="text-text-secondary/40 group-hover:text-text-secondary/80 cursor-grab active:cursor-grabbing p-1 transition-colors touch-none"
            title="Geser untuk mengatur urutan"
          >
            <IconWrapper icon={GripVertical} size={16} />
          </div>
        )}

        {isSelectionMode ? (
          <NeuCheckbox
            checked={isSelected}
            onChange={() => toggleSelectTask(task.id)}
            aria-label={`Pilih task "${displayTitle}"`}
          />
        ) : (
          <NeuCheckbox
            checked={isDone}
            onChange={handleToggle}
            aria-label={`Tandai task "${displayTitle}" sebagai ${isDone ? 'belum selesai' : 'selesai'}`}
          />
        )}
      </div>

      {/* Center: Title & Metadata / Edit Mode */}
      <div className="flex-1 min-w-0 px-1">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--base)',
                caretColor: 'var(--accent)',
              }}
              className="w-full text-sm sm:text-base font-body font-medium rounded-neu-sm neu-inset-sm px-3.5 py-2 outline-none border border-accent/40 focus:ring-2 focus:ring-accent/40 shadow-[inset_2px_2px_5px_var(--shadow-dark),inset_-2px_-2px_5px_var(--shadow-light)] transition-all duration-200"
            />
            <NeuIconButton
              icon={Check}
              size="sm"
              variant="accent"
              onClick={handleSaveEdit}
              aria-label="Simpan perubahan"
            />
            <NeuIconButton
              icon={X}
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}
              aria-label="Batal edit"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <span
              className={`font-body text-sm sm:text-base leading-relaxed break-words block select-text ${
                isDone
                  ? 'line-through font-medium'
                  : 'font-semibold'
              }`}
              style={{
                color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)',
                opacity: isDone ? 0.75 : 1,
                textDecoration: isDone ? 'line-through' : 'none',
              }}
              title={displayTitle}
            >
              {displayTitle}
            </span>

            {(task.dueDate || task.dueTime || (task.description && task.description !== displayTitle)) && (
              <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mt-0.5 flex-wrap">
                {task.dueDate && (
                  <span className="flex items-center gap-1">
                    <IconWrapper icon={Calendar} size={12} />
                    <span>{task.dueDate}</span>
                  </span>
                )}
                {task.dueTime && (
                  <span className="flex items-center gap-1 font-semibold text-accent">
                    <IconWrapper icon={Clock} size={12} />
                    <span>{task.dueTime}</span>
                  </span>
                )}
                {task.description && task.description !== displayTitle && (
                  <span className="truncate max-w-[200px] text-text-secondary/80">
                    {task.description}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Badges & Action Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Priority Badge */}
        {task.priority && task.priority !== 'normal' && (
          <NeuBadge
            variant={task.priority === 'urgent' ? 'urgent' : task.priority === 'high' ? 'urgent' : 'subtle'}
            size="sm"
            className="hidden sm:inline-flex"
          >
            {task.priority === 'urgent' ? 'Darurat' : task.priority === 'high' ? 'Tinggi' : 'Rendah'}
          </NeuBadge>
        )}

        {/* Category Badge */}
        <NeuBadge variant="subtle" size="sm" className="hidden sm:inline-flex">
          {getCategoryLabel(task.category)}
        </NeuBadge>

        {/* Recurring or One-Time Badge */}
        {task.isOneTime ? (
          <NeuBadge variant="subtle" size="sm" className="hidden sm:inline-flex gap-1 font-mono opacity-80">
            <IconWrapper icon={Zap} size={11} />
            <span>Sekali</span>
          </NeuBadge>
        ) : (
          task.isRecurring && (
            <NeuBadge variant="accent" size="sm" className="hidden sm:inline-flex gap-1 font-mono">
              <span>🔄</span>
              <span>{getRecurringLabel()}</span>
            </NeuBadge>
          )
        )}

        {/* Copy Task Button */}
        {!isEditing && (
          <button
            type="button"
            onClick={handleCopyTask}
            className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-text-primary p-1.5 rounded-neu-sm transition-opacity hidden sm:block hover:bg-[var(--surface-raised)]"
            aria-label="Salin teks task"
            title="Copy teks task"
          >
            <IconWrapper icon={justCopied ? Check : Copy} size={16} color={justCopied ? 'var(--status-done)' : undefined} />
          </button>
        )}

        {/* Edit Button */}
        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-text-primary p-1.5 rounded-neu-sm transition-opacity hidden sm:block hover:bg-[var(--surface-raised)]"
            aria-label="Edit judul task"
            title="Edit judul"
          >
            <IconWrapper icon={Edit3} size={16} />
          </button>
        )}

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => deleteTask(task.id)}
          className="text-text-secondary/70 hover:text-status-urgent p-1.5 rounded-neu-sm transition-colors hover:bg-status-urgent/10"
          aria-label={`Hapus task "${displayTitle}"`}
          title="Hapus task"
        >
          <IconWrapper icon={Trash2} size={16} />
        </button>
      </div>
    </motion.div>
  );
};

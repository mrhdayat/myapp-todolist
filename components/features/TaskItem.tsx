'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, GripVertical, Calendar, Edit3, Check, X } from 'lucide-react';
import { Task } from '@/types/task';
import { useTaskStore } from '@/store/useTaskStore';
import { NeuCheckbox } from '@/components/ui/NeuCheckbox';
import { NeuBadge } from '@/components/ui/NeuBadge';
import { NeuIconButton } from '@/components/ui/NeuIconButton';
import { IconWrapper } from '@/components/ui/IconWrapper';

interface TaskItemProps {
  task: Task;
  isDragging?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isDragging = false }) => {
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const updateTask = useTaskStore((state) => state.updateTask);

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
  const isDone = task.status === 'done';

  const handleToggle = () => {
    toggleTaskStatus(task.id);
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, height: 0, marginBottom: 0 }}
      transition={{
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`group rounded-neu-md p-3.5 sm:p-4 mb-3 transition-all duration-200 select-none flex items-center justify-between gap-3 border border-[var(--border-subtle)] ${
        isDone
          ? 'neu-inset'
          : isDragging
          ? 'neu-card ring-2 ring-accent/30 shadow-[8px_8px_20px_var(--shadow-dark)]'
          : 'neu-button hover:shadow-[6px_6px_14px_var(--shadow-dark),-6px_-6px_14px_var(--shadow-light)]'
      }`}
    >
      {/* Left: Drag Handle & Checkbox */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        <div
          className="text-text-secondary/40 group-hover:text-text-secondary/80 cursor-grab active:cursor-grabbing p-1 transition-colors touch-none"
          title="Geser untuk mengatur urutan"
        >
          <IconWrapper icon={GripVertical} size={16} />
        </div>

        <NeuCheckbox
          checked={isDone}
          onChange={handleToggle}
          aria-label={`Tandai task "${displayTitle}" sebagai ${isDone ? 'belum selesai' : 'selesai'}`}
        />
      </div>

      {/* Center: Title & Metadata */}
      <div className="flex-1 min-w-0 px-1">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full bg-base text-text-primary text-sm sm:text-base font-body rounded-neu-sm neu-inset-sm px-3 py-1.5 outline-none focus:ring-1 focus:ring-accent border border-[var(--border-subtle)]"
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

            {(task.dueDate || (task.description && task.description !== displayTitle)) && (
              <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mt-0.5">
                {task.dueDate && (
                  <span className="flex items-center gap-1">
                    <IconWrapper icon={Calendar} size={12} />
                    <span>{task.dueDate}</span>
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

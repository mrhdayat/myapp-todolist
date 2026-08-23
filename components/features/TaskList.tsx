'use client';

import React, { useEffect, useRef } from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { CheckCircle, Inbox, PlusCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTaskStore } from '@/store/useTaskStore';
import { Task } from '@/types/task';
import { TaskItem } from './TaskItem';
import { EmptyOnboardingState, FilterEmptyState } from './EmptyOnboardingState';
import { IconWrapper } from '@/components/ui/IconWrapper';

export const TaskList: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const filters = useTaskStore((state) => state.filters);
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const prevAllDoneRef = useRef(false);

  // Filter tasks based on status, priority, category, searchQuery
  const filteredTasks = tasks.filter((task) => {
    if (filters.status === 'pending' && task.status !== 'pending') return false;
    if (filters.status === 'done' && task.status !== 'done') return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.category !== 'all' && task.category !== filters.category) return false;
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  // Check if all today's tasks are completed to fire celebration confetti
  useEffect(() => {
    if (tasks.length > 0) {
      const allDone = tasks.every((t) => t.status === 'done');
      if (allDone && !prevAllDoneRef.current) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#2F5FE0', '#1F8A5F', '#C7BCA8', '#F6F1E7'],
        });
      }
      prevAllDoneRef.current = allDone;
    } else {
      prevAllDoneRef.current = false;
    }
  }, [tasks]);

  const handleReorder = (newOrder: Task[]) => {
    // Merge new order for filtered items back into overall tasks list
    const filteredIdSet = new Set(newOrder.map((t) => t.id));
    const nonFiltered = tasks.filter((t) => !filteredIdSet.has(t.id));
    const combined = [...newOrder, ...nonFiltered];
    reorderTasks(combined);
  };

  if (tasks.length === 0) {
    return <EmptyOnboardingState />;
  }

  if (filteredTasks.length === 0) {
    return <FilterEmptyState />;
  }

  return (
    <div className="w-full">
      <Reorder.Group
        axis="y"
        values={filteredTasks}
        onReorder={handleReorder}
        className="flex flex-col list-none p-0 m-0"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {filteredTasks.map((task) => (
            <Reorder.Item
              key={task.id}
              value={task}
              id={task.id}
              className="list-none"
            >
              <TaskItem task={task} />
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
};

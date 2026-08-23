'use client';

import React, { useEffect, useRef } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { getTodayDateString } from '@/lib/date-utils';
import { sendBrowserNotification, getNotificationPermission } from '@/lib/notifications';

export const ReminderScheduler: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkReminders = () => {
      if (typeof window === 'undefined' || getNotificationPermission() !== 'granted') {
        return;
      }

      const today = getTodayDateString();
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;

      tasks.forEach((task) => {
        if (
          task.status === 'pending' &&
          task.dueTime &&
          (!task.dueDate || task.dueDate === today || task.date === today)
        ) {
          const reminderKey = `${task.id}_${today}_${task.dueTime}`;
          if (task.dueTime === currentTime && !notifiedTasksRef.current.has(reminderKey)) {
            notifiedTasksRef.current.add(reminderKey);
            sendBrowserNotification('🔔 Pengingat Fokus Task', {
              body: `Saatnya mengerjakan: ${task.title}${
                task.priority === 'urgent' ? ' [Darurat]' : ''
              }`,
              tag: reminderKey,
            });
          }
        }
      });
    };

    // Check immediately and every 25 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 25000);
    return () => clearInterval(interval);
  }, [tasks]);

  return null;
};

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, TrendingUp, BarChart2, ShieldAlert, Calendar } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { getTodayDateString, getPast7Days, getDayName, isBeforeDate } from '@/lib/date-utils';
import { NeuCard } from '@/components/ui/NeuCard';
import { IconWrapper } from '@/components/ui/IconWrapper';
import { DURATION, EASE_STANDARD } from '@/lib/motion-tokens';

export const BentoStats: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const settings = useTaskStore((state) => state.settings);
  const metrics = useTaskStore((state) => state.metrics);
  const monthlySummaries = useTaskStore((state) => state.monthlySummaries);

  const today = getTodayDateString();
  const firstActiveDate = settings.firstActiveDate || settings.lastActiveDate || today;
  const todayTasks = tasks.filter((t) => !t.date || t.date === today);
  const activeTodayTasks = todayTasks.filter((t) => !t.isPaused);
  const completedToday = activeTodayTasks.filter((t) => t.status === 'done').length;
  const totalToday = activeTodayTasks.length;
  const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const urgentTasks = activeTodayTasks.filter((t) => t.priority === 'urgent' && t.status === 'pending');

  // Past 7 days rolling calendar window [today - 6 ... today]
  const past7Days = getPast7Days();
  const weekData = past7Days.map((dateStr) => {
    const isToday = dateStr === today;
    const isBeforeFirstUse = isBeforeDate(dateStr, firstActiveDate);

    if (isToday) {
      return {
        date: dateStr,
        dayName: 'Hari Ini',
        completed: completedToday,
        total: totalToday,
        rate: completionRate,
        isToday: true,
        isBeforeFirstUse: false,
      };
    }

    if (isBeforeFirstUse) {
      return {
        date: dateStr,
        dayName: getDayName(dateStr),
        completed: 0,
        total: 0,
        rate: 0,
        isToday: false,
        isBeforeFirstUse: true,
      };
    }

    const foundMetric = metrics.find((m) => m.date === dateStr);
    const dayTasks = tasks.filter((t) => t.date === dateStr && !t.isPaused);
    const done = dayTasks.filter((t) => t.status === 'done').length;
    const total = dayTasks.length;
    const rate = total > 0 ? Math.round((done / total) * 100) : foundMetric ? foundMetric.completionRate : 0;

    return {
      date: dateStr,
      dayName: getDayName(dateStr),
      completed: total > 0 ? done : foundMetric ? foundMetric.completedCount : 0,
      total: total > 0 ? total : foundMetric ? foundMetric.totalCount : 0,
      rate,
      isToday: false,
      isBeforeFirstUse: false,
    };
  });

  const activeDaysCount = weekData.filter((d) => !d.isBeforeFirstUse).length;
  const activeRateSum = weekData.filter((d) => !d.isBeforeFirstUse).reduce((acc, d) => acc + d.rate, 0);
  const averageRate = activeDaysCount > 0 ? Math.round(activeRateSum / activeDaysCount) : 0;

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-5 select-none min-w-0">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg sm:text-xl text-text-primary flex items-center gap-2">
          <IconWrapper icon={BarChart2} size="md" color="var(--accent)" />
          Statistik & Konsistensi
        </h2>
        <span className="font-mono text-xs text-text-secondary">
          7 Hari Terakhir (Rolling)
        </span>
      </div>

      {/* Bento Grid Layout (2x2 on desktop, single column on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 min-w-0">
        {/* Card 1: Today's Completion Rate */}
        <NeuCard padding="lg" className="w-full flex flex-col justify-between min-w-0 border border-[var(--border-subtle)]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-body uppercase tracking-wider font-semibold text-text-secondary">
                Tingkat Penyelesaian
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display font-bold text-3xl sm:text-4xl text-text-primary">
                  {completionRate}%
                </span>
                <span className="font-mono text-xs text-text-secondary">
                  ({completedToday}/{totalToday} selesai)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-neu-md neu-small flex items-center justify-center text-accent">
              <IconWrapper icon={TrendingUp} size="md" color="var(--accent)" />
            </div>
          </div>

          {/* Neumorphic Inset Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-3 rounded-full neu-inset p-0.5 overflow-hidden border border-[var(--border-subtle)]">
              <motion.div
                className="h-full rounded-full bg-accent transition-all duration-300 shadow-[0_0_8px_var(--accent)]"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: DURATION.slow, ease: EASE_STANDARD }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-text-secondary mt-1.5">
              <span>0%</span>
              <span>Target 100%</span>
            </div>
          </div>
        </NeuCard>

        {/* Card 2: Streak Counter */}
        <NeuCard padding="lg" className="w-full flex flex-col justify-between min-w-0 border border-[var(--border-subtle)]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-body uppercase tracking-wider font-semibold text-text-secondary">
                Fokus Streak
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display font-bold text-3xl sm:text-4xl text-text-primary">
                  {settings.streak || 0}
                </span>
                <span className="font-body text-sm font-medium text-text-secondary">
                  Hari Beruntun (100% Selesai)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-neu-md neu-small flex items-center justify-center text-status-urgent">
              <IconWrapper icon={Flame} size="md" color="var(--status-urgent)" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-body text-text-secondary">
            <span>Rekor Terbaik:</span>
            <span className="font-mono font-bold text-text-primary px-2 py-0.5 rounded-neu-sm bg-base neu-inset-sm">
              {settings.bestStreak || settings.streak || 0} Hari
            </span>
          </div>
        </NeuCard>

        {/* Card 3: 7-Day Activity Chart with Partial / Pre-use State Support */}
        <NeuCard padding="lg" className="w-full flex flex-col justify-between min-w-0 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-body uppercase tracking-wider font-semibold text-text-secondary">
              Aktivitas 7 Hari
            </span>
            <span className="text-[11px] font-mono text-text-secondary font-medium">
              Rata-rata: {averageRate}%
            </span>
          </div>

          {/* 7 Responsive Vertical Capsule Bars */}
          <div className="grid grid-cols-7 gap-2 items-end h-28 pt-2 w-full">
            {weekData.map((item, idx) => {
              const percentage = item.rate;

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end min-w-0">
                  <div className="w-full flex-1 flex items-end justify-center">
                    {/* Fixed Capsule Track */}
                    <div
                      className={`w-full max-w-[20px] h-full rounded-full p-0.5 flex flex-col justify-end overflow-hidden border transition-all ${
                        item.isBeforeFirstUse
                          ? 'border-dashed border-[var(--border-subtle)]/60 bg-base/30'
                          : item.isToday
                          ? 'border-accent/40 ring-1 ring-accent/30 neu-inset'
                          : 'border-[var(--border-subtle)] neu-inset'
                      }`}
                      title={
                        item.isBeforeFirstUse
                          ? `${item.dayName}: Belum digunakan (sebelum mulai pakai app)`
                          : item.total === 0
                          ? `${item.dayName}: Tidak ada task`
                          : `${item.dayName}: ${item.rate}% (${item.completed}/${item.total} selesai)`
                      }
                    >
                      {/* Fill Inside Track */}
                      {!item.isBeforeFirstUse && (
                        <motion.div
                          className={`w-full h-full rounded-full ${
                            item.isToday
                              ? 'bg-accent shadow-[0_0_8px_var(--accent)]'
                              : item.rate >= 80
                              ? 'bg-status-done'
                              : item.rate > 0
                              ? 'bg-text-secondary/60'
                              : 'bg-transparent'
                          }`}
                          style={{ transformOrigin: 'bottom' }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: percentage / 100 }}
                          transition={{
                            duration: DURATION.slow,
                            ease: EASE_STANDARD,
                            delay: idx * 0.04,
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono capitalize text-center truncate w-full block ${
                      item.isBeforeFirstUse
                        ? 'text-text-secondary/40'
                        : item.isToday
                        ? 'font-bold text-accent'
                        : 'text-text-secondary'
                    }`}
                    title={item.date}
                  >
                    {item.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </NeuCard>

        {/* Card 4: Urgent & Attention Status + Multi-Year Indicator */}
        <NeuCard padding="lg" className="w-full flex flex-col justify-between min-w-0 border border-[var(--border-subtle)]">
          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-body uppercase tracking-wider font-semibold text-text-secondary block">
                Status Perhatian
              </span>
              {monthlySummaries.length > 0 && (
                <span className="text-[10px] font-mono text-text-secondary/80 flex items-center gap-1">
                  <IconWrapper icon={Calendar} size={11} />
                  <span>{monthlySummaries.length} bln terarsip</span>
                </span>
              )}
            </div>

            {urgentTasks.length > 0 ? (
              <div className="mt-2.5 p-3 rounded-neu-md bg-status-urgent/10 border border-status-urgent/25 flex items-start gap-2.5 min-w-0">
                <IconWrapper icon={ShieldAlert} size="md" color="var(--status-urgent)" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-status-urgent font-body truncate">
                    {urgentTasks.length} Task Darurat Aktif
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5 truncate">
                    {urgentTasks[0].title}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-2.5 p-3 rounded-neu-md bg-status-done/10 border border-status-done/20 flex items-center gap-2.5 min-w-0">
                <IconWrapper icon={CheckCircle2} size="md" color="var(--status-done)" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-status-done font-body">
                    Semua Prioritas Terkendali
                  </h4>
                  <p className="text-[11px] text-text-secondary">
                    Tidak ada task darurat yang tertunda.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-body text-text-secondary">
            <span>Selesai hari ini:</span>
            <span className="font-mono font-bold text-text-primary">
              {completedToday} Task
            </span>
          </div>
        </NeuCard>
      </div>
    </div>
  );
};

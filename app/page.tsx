'use client';

import React, { useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { Header } from '@/components/features/Header';
import { SignatureTitle } from '@/components/features/SignatureTitle';
import { TaskInput } from '@/components/features/TaskInput';
import { TaskFilters } from '@/components/features/TaskFilters';
import { TaskList } from '@/components/features/TaskList';
import { BentoStats } from '@/components/features/BentoStats';
import { ImportExportModal } from '@/components/features/ImportExportModal';
import { SettingsModal } from '@/components/features/SettingsModal';
import { ToastContainer } from '@/components/features/Toast';
import { CommandPalette } from '@/components/features/CommandPalette';

export default function DailyFocusPage() {
  const initializeStore = useTaskStore((state) => state.initializeStore);
  const isInitialized = useTaskStore((state) => state.isInitialized);
  const isLoading = useTaskStore((state) => state.isLoading);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <main className="min-h-screen bg-base text-text-primary">
      {/* 1200px max-width container with responsive 24px/48px horizontal padding */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10">
        {/* App Header */}
        <Header />

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--grid-gap-mobile)] lg:gap-[var(--grid-gap-desktop)] items-start">
          {/* Left / Primary Column (Task Management): Span 7 on Desktop */}
          <section
            aria-label="Daftar Fokus Harian"
            className="col-span-1 lg:col-span-7 flex flex-col min-w-0"
          >
            {/* Signature Element: Clash Display Heading + Overlapping IBM Plex Mono Badge */}
            <div className="mb-4">
              <SignatureTitle />
            </div>

            {/* Quick Add Task Input */}
            <TaskInput />

            {/* Filters & Search */}
            <TaskFilters />

            {/* Interactive Task List */}
            {isLoading && !isInitialized ? (
              <div className="py-12 text-center text-text-secondary font-body text-sm animate-pulse">
                Memuat data harian...
              </div>
            ) : (
              <TaskList />
            )}
          </section>

          {/* Right / Secondary Column (Bento Statistics & Streak): Span 5 on Desktop */}
          <aside
            aria-label="Statistik dan Performa"
            className="col-span-1 lg:col-span-5 flex flex-col mt-4 lg:mt-0 min-w-0"
          >
            <BentoStats />
          </aside>
        </div>
      </div>

      {/* Modals & Portals */}
      <ImportExportModal />
      <SettingsModal />
      <ToastContainer />
      <CommandPalette />
    </main>
  );
}

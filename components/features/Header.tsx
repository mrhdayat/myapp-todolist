'use client';

import React from 'react';
import { Flame, Moon, Sun, Settings, ArrowDownToLine, CheckSquare2 } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { formatDateDisplay, getTodayDateString } from '@/lib/date-utils';
import { NeuIconButton } from '@/components/ui/NeuIconButton';
import { IconWrapper } from '@/components/ui/IconWrapper';

export const Header: React.FC = () => {
  const settings = useTaskStore((state) => state.settings);
  const toggleDarkMode = useTaskStore((state) => state.toggleDarkMode);
  const setImportModalOpen = useTaskStore((state) => state.setImportModalOpen);
  const setSettingsModalOpen = useTaskStore((state) => state.setSettingsModalOpen);

  const todayStr = getTodayDateString();
  const formattedDate = formatDateDisplay(todayStr);
  const isDark = settings.themeMode === 'dark';

  return (
    <header className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-[var(--shadow-dark)]/20 mb-6">
      {/* Brand & Date */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-neu-md bg-accent text-accent-text flex items-center justify-center shadow-[4px_4px_10px_var(--shadow-dark),-3px_-3px_8px_var(--shadow-light)]">
          <IconWrapper icon={CheckSquare2} size="lg" color="var(--accent-text)" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg tracking-tight text-text-primary">
              Daily Focus
            </span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-neu-sm bg-accent/10 text-accent border border-accent/20">
              v1.1
            </span>
          </div>
          <p className="text-xs font-body text-text-secondary capitalize">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Actions & Streak */}
      <div className="flex items-center gap-2.5 sm:gap-3 self-end sm:self-auto flex-wrap">
        {/* Streak Counter Badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-neu-md neu-button cursor-default select-none text-text-primary"
          title={`Streak saat ini: ${settings.streak} hari berturut-turut (Rekor: ${settings.bestStreak || settings.streak} hari)`}
        >
          <IconWrapper icon={Flame} size="md" color="var(--status-urgent)" />
          <span className="font-mono text-xs font-bold tracking-tight">
            {settings.streak} <span className="font-body font-normal text-text-secondary text-[11px]">Hari</span>
          </span>
        </div>

        {/* Import / Export */}
        <NeuIconButton
          icon={ArrowDownToLine}
          size="md"
          onClick={() => setImportModalOpen(true)}
          aria-label="Import atau Export data"
          title="Import / Export Data"
        />

        {/* Theme Dark / Light Toggle */}
        <NeuIconButton
          icon={isDark ? Sun : Moon}
          size="md"
          onClick={toggleDarkMode}
          aria-label={`Ganti ke mode ${isDark ? 'terang' : 'gelap'}`}
          title={`Mode ${isDark ? 'Terang' : 'Gelap'}`}
        />

        {/* Settings & Palette Customizer */}
        <NeuIconButton
          icon={Settings}
          size="md"
          onClick={() => setSettingsModalOpen(true)}
          aria-label="Pengaturan aplikasi dan tema"
          title="Pengaturan & Tema"
        />
      </div>
    </header>
  );
};

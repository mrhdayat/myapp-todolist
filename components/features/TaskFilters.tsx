'use client';

import React, { useRef, useEffect } from 'react';
import { Search, X, CheckSquare, ListChecks } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { TaskPriority } from '@/types/task';
import { IconWrapper } from '@/components/ui/IconWrapper';
import { getTodayDateString } from '@/lib/date-utils';

export const TaskFilters: React.FC = () => {
  const filters = useTaskStore((state) => state.filters);
  const setFilter = useTaskStore((state) => state.setFilter);
  const tasks = useTaskStore((state) => state.tasks);
  const isSelectionMode = useTaskStore((state) => state.isSelectionMode);
  const toggleSelectionMode = useTaskStore((state) => state.toggleSelectionMode);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const today = getTodayDateString();
  const todayTasks = tasks.filter((t) => !t.date || t.date === today);

  const handleStatusChange = (status: 'all' | 'pending' | 'done') => {
    setFilter({ status });
  };

  // Keyboard shortcut: '/' focuses search when not in input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName || '';
      const isInputActive =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (filters.searchQuery) {
        setFilter({ searchQuery: '' });
      }
      searchInputRef.current?.blur();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 select-none">
      {/* Status Segmented Buttons & Multi-Select Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex items-center p-1 rounded-neu-md neu-inset gap-1">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'pending', label: 'Aktif' },
              { id: 'done', label: 'Selesai' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleStatusChange(tab.id)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-neu-sm text-xs font-medium transition-all ${
                filters.status === tab.id
                  ? 'bg-base text-accent font-semibold shadow-[2px_2px_5px_var(--shadow-dark),-2px_-2px_5px_var(--shadow-light)]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Multi-Select Toggle Button */}
        {todayTasks.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectionMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-neu-sm text-xs font-semibold transition-all ${
              isSelectionMode
                ? 'neu-inset text-accent ring-1 ring-accent/30'
                : 'neu-button text-text-secondary hover:text-text-primary'
            }`}
            title="Mode multi-select untuk aksi massal"
          >
            <IconWrapper icon={isSelectionMode ? CheckSquare : ListChecks} size={14} />
            <span>{isSelectionMode ? 'Batal' : 'Pilih'}</span>
          </button>
        )}
      </div>

      {/* Search & Category Filter */}
      <div className="flex items-center gap-2">
        {/* Search Bar with '/' Shortcut */}
        <div className="relative flex-1 sm:w-52">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
            <IconWrapper icon={Search} size="sm" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilter({ searchQuery: e.target.value })}
            onKeyDown={handleSearchKeyDown}
            placeholder="Cari task... (/)"
            className="w-full bg-base text-text-primary placeholder:text-text-secondary placeholder:opacity-75 text-xs font-body rounded-neu-sm neu-inset py-2 pl-8 pr-8 outline-none focus:ring-1 focus:ring-accent border border-[var(--border-subtle)]"
          />
          {filters.searchQuery ? (
            <button
              onClick={() => setFilter({ searchQuery: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
              aria-label="Bersihkan pencarian (ESC)"
            >
              <IconWrapper icon={X} size="sm" />
            </button>
          ) : (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-text-secondary/80 px-1.5 py-0.5 rounded bg-surface-raised border border-[var(--border-subtle)] pointer-events-none">
              /
            </kbd>
          )}
        </div>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => setFilter({ priority: e.target.value as 'all' | TaskPriority })}
          className="bg-base text-text-primary text-xs font-body rounded-neu-sm neu-inset py-2 px-2 outline-none cursor-pointer border border-[var(--border-subtle)]"
          aria-label="Filter berdasarkan prioritas"
        >
          <option value="all">Semua Prioritas</option>
          <option value="urgent">Darurat</option>
          <option value="high">Tinggi</option>
          <option value="normal">Normal</option>
          <option value="low">Rendah</option>
        </select>
      </div>
    </div>
  );
};

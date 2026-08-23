'use client';

import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { TaskPriority, TaskCategory } from '@/types/task';
import { IconWrapper } from '@/components/ui/IconWrapper';

export const TaskFilters: React.FC = () => {
  const filters = useTaskStore((state) => state.filters);
  const setFilter = useTaskStore((state) => state.setFilter);

  const handleStatusChange = (status: 'all' | 'pending' | 'done') => {
    setFilter({ status });
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 select-none">
      {/* Status Segmented Buttons */}
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

      {/* Search & Category Filter */}
      <div className="flex items-center gap-2">
        {/* Search Bar */}
        <div className="relative flex-1 sm:w-48">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
            <IconWrapper icon={Search} size="sm" />
          </div>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilter({ searchQuery: e.target.value })}
            placeholder="Cari task..."
            className="w-full bg-base text-text-primary placeholder:text-text-secondary/60 text-xs font-body rounded-neu-sm neu-inset py-2 pl-8 pr-7 outline-none focus:ring-1 focus:ring-accent"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilter({ searchQuery: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
              aria-label="Bersihkan pencarian"
            >
              <IconWrapper icon={X} size="sm" />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => setFilter({ priority: e.target.value as 'all' | TaskPriority })}
          className="bg-base text-text-primary text-xs font-body rounded-neu-sm neu-inset py-2 px-2 outline-none cursor-pointer"
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

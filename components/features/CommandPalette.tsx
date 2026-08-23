'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Moon,
  Sun,
  Palette,
  Download,
  Upload,
  Settings,
  CheckCircle2,
  Copy,
  Clock,
  Trash2,
  CornerDownLeft,
  X,
} from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { IconWrapper } from '@/components/ui/IconWrapper';
import { ThemePalette } from '@/types/task';
import { formatTasksSummary, copyToClipboard } from '@/lib/clipboard';
import { getTodayDateString } from '@/lib/date-utils';

interface CommandItem {
  id: string;
  title: string;
  category: 'Aksi Cepat' | 'Tema & Tampilan' | 'Data & Pengaturan' | 'Task';
  icon: any;
  shortcut?: string;
  perform: () => void;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const tasks = useTaskStore((state) => state.tasks);
  const settings = useTaskStore((state) => state.settings);
  const toggleDarkMode = useTaskStore((state) => state.toggleDarkMode);
  const setTheme = useTaskStore((state) => state.setTheme);
  const setImportModalOpen = useTaskStore((state) => state.setImportModalOpen);
  const setSettingsModalOpen = useTaskStore((state) => state.setSettingsModalOpen);
  const setFilter = useTaskStore((state) => state.setFilter);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const addToast = useTaskStore((state) => state.addToast);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command items
  const baseCommands: CommandItem[] = [
    {
      id: 'copy-summary',
      title: 'Salin Ringkasan Fokus Hari Ini ke Clipboard',
      category: 'Aksi Cepat',
      icon: Copy,
      shortcut: 'Copy',
      perform: async () => {
        const text = formatTasksSummary(tasks, getTodayDateString());
        const ok = await copyToClipboard(text);
        if (ok) {
          addToast({
            type: 'success',
            title: 'Ringkasan Disalin',
            description: 'Format ringkasan harian disalin ke clipboard.',
          });
        }
      },
    },
    {
      id: 'toggle-mode',
      title: `Ganti ke Mode ${settings.themeMode === 'dark' ? 'Terang' : 'Gelap'}`,
      category: 'Tema & Tampilan',
      icon: settings.themeMode === 'dark' ? Sun : Moon,
      shortcut: 'Tema',
      perform: () => {
        toggleDarkMode();
      },
    },
    {
      id: 'theme-warm-clay',
      title: 'Ganti Palet: Warm Clay (Porcelain Hangat)',
      category: 'Tema & Tampilan',
      icon: Palette,
      perform: () => setTheme('warm-clay', settings.themeMode),
    },
    {
      id: 'theme-blob-pastel',
      title: 'Ganti Palet: Blob Pastel (Candy Soft 3D)',
      category: 'Tema & Tampilan',
      icon: Palette,
      perform: () => setTheme('blob-pastel', settings.themeMode),
    },
    {
      id: 'theme-ocean-breeze',
      title: 'Ganti Palet: Frost Slate (Cool Ice Slate)',
      category: 'Tema & Tampilan',
      icon: Palette,
      perform: () => setTheme('ocean-breeze', settings.themeMode),
    },
    {
      id: 'theme-midnight-carbon',
      title: 'Ganti Palet: Midnight Carbon (Industrial Matte)',
      category: 'Tema & Tampilan',
      icon: Palette,
      perform: () => setTheme('midnight-carbon', settings.themeMode),
    },
    {
      id: 'export-data',
      title: 'Export & Download Backup JSON',
      category: 'Data & Pengaturan',
      icon: Download,
      perform: () => setImportModalOpen(true),
    },
    {
      id: 'import-data',
      title: 'Import File Backup JSON',
      category: 'Data & Pengaturan',
      icon: Upload,
      perform: () => setImportModalOpen(true),
    },
    {
      id: 'open-settings',
      title: 'Buka Pengaturan Aplikasi',
      category: 'Data & Pengaturan',
      icon: Settings,
      shortcut: 'Setelan',
      perform: () => setSettingsModalOpen(true),
    },
    {
      id: 'filter-all',
      title: 'Tampilkan Semua Task',
      category: 'Aksi Cepat',
      icon: CheckCircle2,
      perform: () => setFilter({ status: 'all', searchQuery: '' }),
    },
    {
      id: 'filter-pending',
      title: 'Filter Hanya Task Belum Selesai (Aktif)',
      category: 'Aksi Cepat',
      icon: Clock,
      perform: () => setFilter({ status: 'pending' }),
    },
    {
      id: 'filter-done',
      title: 'Filter Hanya Task Selesai',
      category: 'Aksi Cepat',
      icon: CheckCircle2,
      perform: () => setFilter({ status: 'done' }),
    },
  ];

  // Also include matching tasks if user types a query
  const matchingTasks: CommandItem[] = query.trim()
    ? tasks
        .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map((t) => ({
          id: `task-${t.id}`,
          title: `${t.status === 'done' ? '✅' : '⏳'} ${t.title}`,
          category: 'Task',
          icon: CheckCircle2,
          shortcut: t.status === 'done' ? 'Selesai' : 'Aktif',
          perform: () => {
            toggleTaskStatus(t.id);
            addToast({
              type: 'info',
              title: t.status === 'done' ? 'Task Belum Selesai' : 'Task Selesai',
              description: t.title,
            });
          },
        }))
    : [];

  const filteredCommands = query.trim()
    ? [
        ...matchingTasks,
        ...baseCommands.filter((c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
        ),
      ]
    : baseCommands;

  // Handle arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].perform();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Palette Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-surface-raised rounded-neu-lg shadow-[12px_12px_28px_var(--shadow-dark),-12px_-12px_28px_var(--shadow-light)] border border-[var(--border-subtle)] overflow-hidden z-10"
        >
          {/* Search Header */}
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
            <IconWrapper icon={Search} size={18} color="var(--accent)" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Cari aksi atau ketik judul task..."
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-secondary placeholder:opacity-75 text-sm sm:text-base font-body outline-none"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-secondary hover:text-text-primary p-1 rounded-neu-sm transition-colors text-xs font-mono px-2 py-1 bg-base neu-inset-sm"
            >
              ESC
            </button>
          </div>

          {/* Commands List */}
          <div
            ref={listRef}
            className="max-h-[360px] overflow-y-auto p-2 flex flex-col gap-1 divide-y divide-[var(--border-subtle)]/30"
          >
            {filteredCommands.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-secondary">
                Tidak ada perintah atau task yang cocok dengan "{query}".
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => {
                      cmd.perform();
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-neu-sm flex items-center justify-between gap-3 transition-all duration-150 ${
                      isSelected
                        ? 'bg-base neu-inset text-accent font-semibold shadow-sm'
                        : 'text-text-primary hover:bg-base/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-neu-sm ${
                          isSelected ? 'text-accent' : 'text-text-secondary'
                        }`}
                      >
                        <IconWrapper icon={cmd.icon} size={16} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-body truncate leading-snug">
                          {cmd.title}
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono">
                          {cmd.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {cmd.shortcut && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-neu-sm bg-base/80 text-text-secondary border border-[var(--border-subtle)]">
                          {cmd.shortcut}
                        </span>
                      )}
                      {isSelected && (
                        <IconWrapper icon={CornerDownLeft} size={12} color="var(--accent)" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Guide */}
          <div className="p-3 bg-base/50 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-text-secondary">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigasi</span>
              <span>↵ Pilih</span>
              <span>ESC Tutup</span>
            </div>
            <span>Cmd+K / Ctrl+K</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

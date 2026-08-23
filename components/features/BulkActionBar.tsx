'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trash2, X, CheckSquare, RotateCcw, AlertTriangle } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { IconWrapper } from '@/components/ui/IconWrapper';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuModal } from '@/components/ui/NeuModal';

export const BulkActionBar: React.FC = () => {
  const isSelectionMode = useTaskStore((state) => state.isSelectionMode);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const toggleSelectionMode = useTaskStore((state) => state.toggleSelectionMode);
  const selectAllTasks = useTaskStore((state) => state.selectAllTasks);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const bulkCompleteTasks = useTaskStore((state) => state.bulkCompleteTasks);
  const bulkDeleteTasks = useTaskStore((state) => state.bulkDeleteTasks);
  const tasks = useTaskStore((state) => state.tasks);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (!isSelectionMode) return null;

  const count = selectedTaskIds.length;
  const isAllSelected = count > 0 && count === tasks.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAllTasks();
    }
  };

  const handleConfirmDelete = async () => {
    await bulkDeleteTasks();
    setConfirmDeleteOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 select-none"
        >
          <div className="bg-surface-raised rounded-neu-lg p-3 sm:p-4 shadow-[10px_10px_24px_var(--shadow-dark),-10px_-10px_24px_var(--shadow-light)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 flex-wrap">
            {/* Left: Counter & Select All */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs px-2.5 py-1.5 rounded-neu-sm neu-button font-medium text-text-primary hover:text-accent transition-all flex items-center gap-1.5"
              >
                <IconWrapper icon={CheckSquare} size={14} color="var(--accent)" />
                <span>{isAllSelected ? 'Batal Semua' : 'Pilih Semua'}</span>
              </button>
              <span className="text-xs font-mono font-bold text-accent px-2 py-1 rounded-neu-sm bg-base neu-inset-sm">
                {count} Dipilih
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Mark Done */}
              <button
                type="button"
                disabled={count === 0}
                onClick={() => bulkCompleteTasks('done')}
                className="text-xs px-3 py-1.5 rounded-neu-sm neu-button text-status-done font-semibold hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Tandai task terpilih sebagai selesai"
              >
                <IconWrapper icon={CheckCircle2} size={14} color="var(--status-done)" />
                <span className="hidden sm:inline">Selesai</span>
              </button>

              {/* Mark Pending */}
              <button
                type="button"
                disabled={count === 0}
                onClick={() => bulkCompleteTasks('pending')}
                className="text-xs px-3 py-1.5 rounded-neu-sm neu-button text-text-secondary font-semibold hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Tandai task terpilih sebagai aktif"
              >
                <IconWrapper icon={RotateCcw} size={14} />
                <span className="hidden sm:inline">Aktifkan</span>
              </button>

              {/* Bulk Delete */}
              <button
                type="button"
                disabled={count === 0}
                onClick={() => setConfirmDeleteOpen(true)}
                className="text-xs px-3 py-1.5 rounded-neu-sm neu-button text-status-urgent font-semibold hover:bg-status-urgent/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Hapus task terpilih"
              >
                <IconWrapper icon={Trash2} size={14} color="var(--status-urgent)" />
                <span className="hidden sm:inline">Hapus</span>
              </button>

              {/* Close Multi-select */}
              <button
                type="button"
                onClick={toggleSelectionMode}
                className="p-1.5 rounded-neu-sm text-text-secondary hover:text-text-primary transition-colors"
                title="Tutup mode pilih"
              >
                <IconWrapper icon={X} size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Confirmation Modal for Bulk Delete */}
      <NeuModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Konfirmasi Hapus Massal"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-status-urgent">
            <div className="w-10 h-10 rounded-neu-md neu-small flex items-center justify-center text-status-urgent">
              <IconWrapper icon={AlertTriangle} size={20} />
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm text-text-primary">
                Hapus {count} task terpilih?
              </h4>
              <p className="text-xs text-text-secondary">
                Tindakan ini akan menghapus {count} task dari database.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <NeuButton
              size="sm"
              variant="default"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Batal
            </NeuButton>
            <NeuButton
              size="sm"
              variant="default"
              onClick={handleConfirmDelete}
              className="text-status-urgent font-bold"
            >
              Ya, Hapus {count} Task
            </NeuButton>
          </div>
        </div>
      </NeuModal>
    </>
  );
};

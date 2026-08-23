'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Undo2 } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { IconWrapper } from '@/components/ui/IconWrapper';
import { DURATION, EASE_ENTER, EASE_EXIT } from '@/lib/motion-tokens';

export const ToastContainer: React.FC = () => {
  const toasts = useTaskStore((state) => state.toasts);
  const removeToast = useTaskStore((state) => state.removeToast);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <IconWrapper icon={CheckCircle2} size="md" color="var(--status-done)" />;
      case 'warning':
        return <IconWrapper icon={AlertTriangle} size="md" color="var(--status-urgent)" />;
      case 'error':
        return <IconWrapper icon={AlertCircle} size="md" color="var(--status-urgent)" />;
      default:
        return <IconWrapper icon={Info} size="md" color="var(--accent)" />;
    }
  };

  return (
    <aside
      aria-label="Notifikasi sistem"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0 select-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: DURATION.normal, ease: EASE_ENTER }}
            role="status"
            aria-live="polite"
            className="pointer-events-auto bg-base rounded-neu-md p-4 shadow-[8px_8px_20px_var(--shadow-dark),-8px_-8px_20px_var(--shadow-light)] border border-[var(--border-subtle)] flex items-start gap-3"
          >
            <div className="mt-0.5">{getIcon(toast.type)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-text-primary font-body tracking-tight">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="text-xs text-text-secondary mt-0.5 font-body leading-relaxed break-words">
                  {toast.description}
                </p>
              )}

              {/* Action Button (e.g. Undo) */}
              {toast.action && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-neu-sm bg-surface-raised neu-button text-xs font-bold text-accent hover:brightness-105 active:scale-95 transition-all"
                  >
                    <IconWrapper icon={Undo2} size={12} color="var(--accent)" />
                    <span>{toast.action.label}</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-secondary hover:text-text-primary p-1 rounded-neu-sm -mr-1 -mt-1 transition-colors"
              aria-label="Tutup notifikasi"
            >
              <IconWrapper icon={X} size="sm" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </aside>
  );
};

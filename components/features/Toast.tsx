'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { IconWrapper } from '@/components/ui/IconWrapper';

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
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="polite"
            className="pointer-events-auto bg-base rounded-neu-md p-4 shadow-[6px_6px_16px_var(--shadow-dark),-6px_-6px_16px_var(--shadow-light)] border border-[var(--shadow-dark)]/15 flex items-start gap-3"
          >
            <div className="mt-0.5">{getIcon(toast.type)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-text-primary font-body tracking-tight">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="text-xs text-text-secondary mt-0.5 font-body leading-relaxed">
                  {toast.description}
                </p>
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

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { IconWrapper } from './IconWrapper';
import { SPRING_TACTILE, DURATION } from '@/lib/motion-tokens';

export interface NeuCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
  id?: string;
}

export const NeuCheckbox: React.FC<NeuCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  'aria-label': ariaLabel = 'Toggle task completion',
  id,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <motion.button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileTap={!disabled ? { scale: 0.92 } : undefined}
      className={`relative w-7 h-7 min-w-[28px] min-h-[28px] rounded-neu-sm flex items-center justify-center select-none outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-200 ${
        checked
          ? 'bg-status-done text-white shadow-[2px_2px_5px_var(--shadow-dark)]'
          : 'bg-base neu-small hover:shadow-[4px_4px_8px_var(--shadow-dark),-4px_-4px_8px_var(--shadow-light)] active:shadow-[inset_2px_2px_4px_var(--shadow-dark)]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <AnimatePresence mode="wait">
        {checked && (
          <motion.div
            key="checked-icon"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={SPRING_TACTILE}
            className="flex items-center justify-center"
          >
            <IconWrapper icon={Check} size={16} color="#FFFFFF" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

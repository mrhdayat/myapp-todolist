import React from 'react';
import { Check } from 'lucide-react';
import { IconWrapper } from './IconWrapper';

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
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative w-7 h-7 min-w-[28px] min-h-[28px] rounded-neu-sm flex items-center justify-center transition-all duration-150 ease-out select-none outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        checked
          ? 'bg-status-done text-white shadow-[2px_2px_5px_var(--shadow-dark)]'
          : 'bg-base neu-small hover:shadow-[4px_4px_8px_var(--shadow-dark),-4px_-4px_8px_var(--shadow-light)] active:shadow-[inset_2px_2px_4px_var(--shadow-dark)]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div
        className={`transition-all duration-150 ease-out transform ${
          checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        <IconWrapper icon={Check} size={16} color="#FFFFFF" />
      </div>
    </button>
  );
};

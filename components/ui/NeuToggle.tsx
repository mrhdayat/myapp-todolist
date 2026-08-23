import React from 'react';
import { LucideIcon } from 'lucide-react';
import { IconWrapper } from './IconWrapper';

export interface NeuToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  id?: string;
}

export const NeuToggle: React.FC<NeuToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  icon,
  disabled = false,
  id,
}) => {
  const toggleId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      {(label || icon) && (
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-text-secondary">
              <IconWrapper icon={icon} size="md" />
            </div>
          )}
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={toggleId}
                className="text-sm font-medium text-text-primary cursor-pointer select-none"
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-text-secondary select-none">
                {description}
              </span>
            )}
          </div>
        </div>
      )}

      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full neu-inset p-1 transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          checked ? 'bg-[var(--surface-raised)]' : 'bg-base'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full transform transition-transform duration-200 ease-out shadow-[2px_2px_5px_var(--shadow-dark),-1px_-1px_3px_var(--shadow-light)] ${
            checked
              ? 'translate-x-5 bg-accent text-accent-text'
              : 'translate-x-0 bg-base text-text-secondary'
          }`}
        />
      </button>
    </div>
  );
};

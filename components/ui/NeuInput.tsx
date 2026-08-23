import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { IconWrapper } from './IconWrapper';

export interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconClick?: () => void;
  containerClassName?: string;
}

export const NeuInput = forwardRef<HTMLInputElement, NeuInputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      onRightIconClick,
      containerClassName = '',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-secondary select-none px-1 tracking-wide"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-text-secondary flex items-center">
              <IconWrapper icon={leftIcon} size="md" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-base text-text-primary placeholder:text-text-secondary/60 text-sm font-body rounded-neu-md neu-inset py-3 px-4 transition-all duration-200 outline-none focus:ring-1 focus:ring-accent ${
              leftIcon ? 'pl-11' : ''
            } ${rightIcon ? 'pr-11' : ''} ${
              error ? 'ring-1 ring-status-urgent' : ''
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className={`absolute right-3 text-text-secondary hover:text-text-primary p-1 rounded-neu-sm transition-colors ${
                onRightIconClick ? 'cursor-pointer' : 'pointer-events-none'
              }`}
            >
              <IconWrapper icon={rightIcon} size="md" />
            </button>
          )}
        </div>

        {error && (
          <span className="text-xs text-status-urgent px-1 mt-0.5 font-medium animate-fadeIn">
            {error}
          </span>
        )}
      </div>
    );
  }
);

NeuInput.displayName = 'NeuInput';

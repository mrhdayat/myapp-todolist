import React, { forwardRef } from 'react';

export interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'accent' | 'accent-solid' | 'inset' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const NeuButton = forwardRef<HTMLButtonElement, NeuButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      fullWidth = false,
      disabled = false,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    let variantStyles = 'neu-button text-text-primary';

    if (variant === 'accent-solid') {
      variantStyles =
        'rounded-neu-md bg-accent text-accent-text font-medium shadow-[4px_4px_10px_var(--shadow-dark),-3px_-3px_8px_var(--shadow-light)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3)] active:scale-[0.98] transition-all duration-150';
    } else if (variant === 'accent') {
      variantStyles =
        'neu-button text-accent font-medium hover:text-accent/90';
    } else if (variant === 'inset') {
      variantStyles =
        'neu-inset rounded-neu-md text-accent font-semibold shadow-[inset_4px_4px_8px_var(--shadow-dark),inset_-4px_-4px_8px_var(--shadow-light)]';
    } else if (variant === 'danger') {
      variantStyles =
        'neu-button text-status-urgent font-medium hover:text-status-urgent/80';
    } else if (variant === 'ghost') {
      variantStyles =
        'rounded-neu-md text-text-secondary hover:text-text-primary hover:bg-[var(--surface-raised)]/50 transition-colors';
    }

    const sizeStyles =
      size === 'sm'
        ? 'px-3 py-1.5 text-xs min-h-[36px]'
        : size === 'lg'
        ? 'px-6 py-3.5 text-base min-h-[50px]'
        : 'px-4 py-2.5 text-sm min-h-[44px]';

    const disabledStyles = disabled
      ? 'opacity-40 cursor-not-allowed shadow-none active:scale-100'
      : 'cursor-pointer';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 font-body font-medium select-none text-center ${variantStyles} ${sizeStyles} ${
          fullWidth ? 'w-full' : ''
        } ${disabledStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

NeuButton.displayName = 'NeuButton';

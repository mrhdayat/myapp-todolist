import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { IconWrapper, IconSizeKey } from './IconWrapper';

export interface NeuIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  iconSize?: IconSizeKey | number;
  variant?: 'default' | 'accent' | 'inset' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  'aria-label': string;
}

export const NeuIconButton = forwardRef<HTMLButtonElement, NeuIconButtonProps>(
  (
    {
      icon,
      iconSize,
      variant = 'default',
      size = 'md',
      active = false,
      disabled = false,
      className = '',
      'aria-label': ariaLabel,
      type = 'button',
      ...props
    },
    ref
  ) => {
    let variantStyles = 'neu-button text-text-secondary hover:text-text-primary';

    if (active || variant === 'inset') {
      variantStyles =
        'neu-inset rounded-neu-md text-accent shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)]';
    } else if (variant === 'accent') {
      variantStyles = 'neu-button text-accent hover:text-accent/90';
    } else if (variant === 'danger') {
      variantStyles = 'neu-button text-status-urgent hover:text-status-urgent/80';
    } else if (variant === 'ghost') {
      variantStyles = 'text-text-secondary hover:text-text-primary rounded-neu-md hover:bg-[var(--surface-raised)]/60';
    }

    const sizeStyles =
      size === 'sm'
        ? 'w-9 h-9 min-w-[36px] min-h-[36px] rounded-neu-sm'
        : size === 'lg'
        ? 'w-12 h-12 min-w-[48px] min-h-[48px] rounded-neu-md'
        : 'w-11 h-11 min-w-[44px] min-h-[44px] rounded-neu-md'; // 44px default touch target

    const defaultIconSize: IconSizeKey = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

    const disabledStyles = disabled
      ? 'opacity-40 cursor-not-allowed shadow-none active:scale-100'
      : 'cursor-pointer';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-center select-none flex-shrink-0 ${variantStyles} ${sizeStyles} ${disabledStyles} ${className}`}
        {...props}
      >
        <IconWrapper icon={icon} size={iconSize || defaultIconSize} />
      </button>
    );
  }
);

NeuIconButton.displayName = 'NeuIconButton';

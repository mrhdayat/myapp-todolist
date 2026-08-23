import React, { forwardRef } from 'react';

export interface NeuCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'raised' | 'inset' | 'flat';
  padding?: 'lg' | 'sm' | 'none';
  interactive?: boolean;
  as?: React.ElementType;
}

export const NeuCard = forwardRef<HTMLDivElement, NeuCardProps>(
  (
    {
      children,
      variant = 'raised',
      padding = 'lg',
      interactive = false,
      className = '',
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    let variantClass = 'neu-card';
    if (variant === 'inset') {
      variantClass = 'neu-inset rounded-neu-lg';
    } else if (variant === 'flat') {
      variantClass = 'bg-base rounded-neu-lg border border-[var(--shadow-dark)]/20';
    } else if (interactive) {
      variantClass = 'neu-card-interactive';
    }

    const paddingClass =
      padding === 'lg'
        ? 'p-6' // 24px
        : padding === 'sm'
        ? 'p-4' // 16px
        : 'p-0';

    return (
      <Component
        ref={ref}
        className={`${variantClass} ${paddingClass} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

NeuCard.displayName = 'NeuCard';

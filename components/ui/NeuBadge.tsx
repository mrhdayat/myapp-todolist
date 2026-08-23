import React from 'react';
import { LucideIcon } from 'lucide-react';
import { IconWrapper } from './IconWrapper';

export interface NeuBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'done' | 'urgent' | 'inset' | 'subtle';
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  className?: string;
}

export const NeuBadge: React.FC<NeuBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
}) => {
  let variantStyles = 'bg-base text-text-secondary neu-small';

  if (variant === 'accent') {
    variantStyles = 'bg-accent/10 text-accent border border-accent/20';
  } else if (variant === 'done') {
    variantStyles = 'bg-status-done/15 text-status-done border border-status-done/20';
  } else if (variant === 'urgent') {
    variantStyles = 'bg-status-urgent/15 text-status-urgent border border-status-urgent/25 font-semibold';
  } else if (variant === 'inset') {
    variantStyles = 'neu-inset-sm text-text-secondary font-mono';
  } else if (variant === 'subtle') {
    variantStyles = 'bg-[var(--surface-raised)]/60 text-text-secondary';
  }

  const sizeStyles =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-neu-sm font-medium tracking-wide select-none ${variantStyles} ${sizeStyles} ${className}`}
    >
      {icon && <IconWrapper icon={icon} size={14} />}
      <span>{children}</span>
    </span>
  );
};

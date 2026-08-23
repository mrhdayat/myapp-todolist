import React from 'react';
import { LucideIcon } from 'lucide-react';

export const ICON_SIZE = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export type IconSizeKey = keyof typeof ICON_SIZE;

interface IconWrapperProps {
  icon: LucideIcon;
  size?: IconSizeKey | number;
  className?: string;
  color?: string;
  'aria-hidden'?: boolean;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({
  icon: Icon,
  size = 'md',
  className = '',
  color,
  'aria-hidden': ariaHidden = true,
}) => {
  const pixelSize = typeof size === 'number' ? size : ICON_SIZE[size] || 20;

  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        color: color || 'inherit',
      }}
      aria-hidden={ariaHidden}
    >
      <Icon
        size={pixelSize}
        strokeWidth={1.75}
        className="w-full h-full"
      />
    </span>
  );
};

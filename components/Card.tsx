import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Dark variant: navy background, light text */
  variant?: 'default' | 'dark';
  children: ReactNode;
  className?: string;
}

/**
 * Base card primitive — rounded-3xl, with soft shadow and generous padding.
 * Accepts a `variant="dark"` for hero/compare cards on navy background.
 */
export function Card({ variant = 'default', children, className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-card)] p-6 transition-colors duration-200',
        variant === 'dark'
          ? 'text-white'
          : 'text-[var(--color-text-primary)]',
        className,
      )}
      style={{
        backgroundColor: variant === 'dark' ? 'var(--color-navy-dark)' : 'var(--color-surface)',
        boxShadow: variant === 'dark' ? 'var(--shadow-card-dark)' : 'var(--shadow-card)',
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

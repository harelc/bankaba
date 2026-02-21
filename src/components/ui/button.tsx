'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          {
            'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-200': variant === 'primary',
            'bg-white text-purple-600 border-2 border-purple-200 hover:border-purple-400': variant === 'secondary',
            'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
            'text-purple-600 hover:bg-purple-50': variant === 'ghost',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-5 py-2.5 text-base': size === 'md',
            'px-7 py-3.5 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

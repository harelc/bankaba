import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'purple' | 'mint' | 'yellow' | 'red' | 'gray';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'purple', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        {
          'bg-purple-100 text-purple-700': variant === 'purple',
          'bg-mint-100 text-mint-500': variant === 'mint',
          'bg-yellow-100 text-yellow-400': variant === 'yellow',
          'bg-red-100 text-red-600': variant === 'red',
          'bg-gray-100 text-gray-600': variant === 'gray',
        },
        className
      )}
    >
      {children}
    </span>
  );
}

import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl p-6 transition-all duration-200',
        {
          'bg-white/80 backdrop-blur-sm shadow-lg shadow-purple-100/50': variant === 'default',
          'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl shadow-purple-200': variant === 'highlight',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

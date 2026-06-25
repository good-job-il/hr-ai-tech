import React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef(({ className, variant = 'elevated', ...props }, ref) => {
  const variants = {
    elevated: 'bg-white/90 border border-blue-300/50 shadow-card hover:shadow-lg transition-all backdrop-blur-md',
    glass: 'bg-gradient-to-br from-white/95 to-white/85 border border-blue-300/60 shadow-glass backdrop-blur-2xl',
    minimal: 'bg-white border border-blue-200/80 shadow-sm hover:shadow-md transition-all',
    dark: 'bg-gray-900 border border-gray-800 shadow-xl',
  };

  return (
    <div
      ref={ref}
      className={cn('rounded-3xl p-8 transition-all', variants[variant], className)}
      {...props}
    />
  );
});

Card.displayName = 'Card';
export default Card;
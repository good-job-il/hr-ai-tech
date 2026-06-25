import React from 'react';
import { cn } from '@/lib/utils';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', ...props }, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl',
    secondary: 'bg-white/90 border-2 border-purple-600 text-purple-600 hover:bg-white/100 transition-all backdrop-blur-sm',
    outline: 'border-2 border-purple-300 text-purple-700 hover:bg-purple-50 transition-all',
    ghost: 'text-purple-700 hover:bg-purple-50 transition-all',
    error: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl',
  };

  const sizes = {
    xs: 'px-3 py-1.5 text-xs rounded-md',
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl h-12',
    lg: 'px-8 py-4 text-lg rounded-xl h-14',
    xl: 'px-10 py-5 text-xl rounded-xl h-16',
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

Button.displayName = 'Button';
export default Button;
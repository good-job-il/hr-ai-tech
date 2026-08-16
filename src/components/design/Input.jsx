import React from 'react';
import { cn } from '@/lib/utils';

/** @type {React.ForwardRefExoticComponent<React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement> & {variant?: 'default'|'filled'|'flush'}>} */
const Input = React.forwardRef(({ className = '', variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-white/80 border border-blue-300/50 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-300/50 placeholder-gray-500 backdrop-blur-sm',
    filled: 'bg-blue-50/80 border border-blue-300/40 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-300/50 placeholder-gray-500',
    flush: 'border-0 border-b-2 border-gray-300 bg-transparent text-gray-900 focus:border-purple-600 focus:ring-0 placeholder-gray-400 px-0',
  };

  return (
    <input
      ref={ref}
      className={cn(
        'text-base h-12 px-4 rounded-xl outline-none transition-all',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
export default Input;

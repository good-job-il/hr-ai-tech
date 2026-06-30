import { cn } from '@/lib/utils';

export function GradientButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center h-12 px-7 rounded-2xl text-white font-bold text-[15px] transition-all',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, #7C4DFF 0%, #4F7CFF 100%)',
        boxShadow: '0 18px 42px rgba(124, 77, 255, 0.35)',
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default GradientButton;
import { cn } from '@/lib/utils';

export function GradientButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center h-12 px-7 rounded-2xl text-white font-bold text-[15px] transition-all',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, #A855F7 0%, #6C4DFF 48%, #2F80FF 100%)',
        boxShadow: '0 18px 42px rgba(108, 77, 255, 0.35)',
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default GradientButton;
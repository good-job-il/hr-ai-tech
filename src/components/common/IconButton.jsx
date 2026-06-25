import { cn } from '@/lib/utils';

export function IconButton({ icon: Icon, className, size = 'md', ...props }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <button
      className={cn(
        sizes[size],
        'rounded-lg flex items-center justify-center transition-all border border-[#E4ECFF] bg-white hover:bg-[#F3EFFF]',
        className
      )}
      {...props}
    >
      <Icon className="w-5 h-5 text-[#6C4DFF]" />
    </button>
  );
}

export default IconButton;
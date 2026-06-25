/**
 * Reusable Glass Card Component
 * Uses centralized glass styles from design tokens
 */
import { GLASS_STYLES, SPACING } from '@/theme/tokens';
import { cn } from '@/lib/utils';

export function GlassCard({ children, className, variant = 'card', ...props }) {
  const baseStyles = GLASS_STYLES[variant];

  return (
    <div
      className={cn('transition-all duration-200', className)}
      style={baseStyles}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassPanel({ children, className, padding = 6, ...props }) {
  const baseStyles = GLASS_STYLES.panel;
  const paddingValue = SPACING[padding];

  return (
    <div
      className={cn('transition-all duration-200', className)}
      style={{
        ...baseStyles,
        padding: paddingValue,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassInput({ className, ...props }) {
  const baseStyles = GLASS_STYLES.input;

  return (
    <input
      className={cn(
        'w-full outline-none text-sm font-medium placeholder:text-neutral-400 transition-all duration-200',
        className
      )}
      style={baseStyles}
      {...props}
    />
  );
}

export default GlassCard;
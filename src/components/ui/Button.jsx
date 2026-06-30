/**
 * Unified Button Component System
 * Centralized styling using design tokens
 */
import { SHADOWS, SPACING, TRANSITIONS } from '@/theme/tokens';
import { cn } from '@/lib/utils';

const buttonVariants = {
  // Primary button with gradient
  primary: {
    bg: 'linear-gradient(90deg, #9136f0 0%, #575de8 50%, #5a8eee 100%)',
    text: '#FFFFFF',
    hover: {
      transform: 'translateY(-1px)',
    },
  },

  // Secondary button with border
  secondary: {
    bg: '#FFFFFF',
    text: '#374151',
    border: '1.5px solid #E5E7EB',
    hover: {
      borderColor: '#A78BFA',
      color: '#7C3AED',
      bg: 'rgba(124, 58, 237, 0.03)',
    },
  },

  // Ghost button minimal style
  ghost: {
    bg: 'transparent',
    text: '#64748B',
    hover: {
      bg: '#F1F6FF',
      color: '#6C4DFF',
    },
  },

  // Outline style
  outline: {
    bg: 'transparent',
    text: '#6C4DFF',
    border: '1.5px solid #DDEBFF',
    hover: {
      bg: '#F3EFFF',
      borderColor: '#7C3AED',
    },
  },

  // Danger button
  danger: {
    bg: '#EF4444',
    text: '#FFFFFF',
    shadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
    hover: {
      opacity: 0.9,
      shadow: '0 6px 16px rgba(239, 68, 68, 0.4)',
    },
  },

  // Success button
  success: {
    bg: '#10B981',
    text: '#FFFFFF',
    shadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    hover: {
      opacity: 0.9,
      shadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
    },
  },
};

const sizes = {
  xs: {
    padding: `${SPACING[2]} ${SPACING[3]}`,
    fontSize: '12px',
    fontWeight: 700,
    borderRadius: '10px',
    height: '32px',
  },
  sm: {
    padding: `${SPACING[2]} ${SPACING[4]}`,
    fontSize: '14px',
    fontWeight: 700,
    borderRadius: '10px',
    height: '40px',
  },
  md: {
    padding: `${SPACING[3]} ${SPACING[6]}`,
    fontSize: '15px',
    fontWeight: 700,
    borderRadius: '12px',
    height: '48px',
  },
  lg: {
    padding: `${SPACING[4]} ${SPACING[8]}`,
    fontSize: '16px',
    fontWeight: 700,
    borderRadius: '14px',
    height: '56px',
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  asChild = false,
  ...props
}) {
  const variantStyles = buttonVariants[variant];
  const sizeStyles = sizes[size];

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: TRANSITIONS.base,
    opacity: disabled ? 0.5 : 1,
    ...sizeStyles,
    background: variantStyles.bg,
    color: variantStyles.text,
    ...(variantStyles.border && { border: variantStyles.border }),
    ...(variantStyles.shadow && { boxShadow: variantStyles.shadow }),
  };

  const element = (
    <button
      style={baseStyle}
      className={cn('font-assistant transition-all duration-200 hover:scale-105', className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );

  return element;
}

export default Button;

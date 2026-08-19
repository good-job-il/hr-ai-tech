/**
 * Unified Card System
 * Single source of truth for all card styling
 */
import { GLASS_STYLES, SHADOWS, RADIUS, TRANSITIONS } from "@/theme/tokens"
import { cn } from "@/lib/utils"

/** @param {React.HTMLAttributes<HTMLDivElement> & {variant?: 'glass' | 'panel', hoverable?: boolean}} props */
export function Card({
  children = null,
  className = "",
  variant = "glass",
  hoverable = false,
  ...props
}) {
  const baseStyles = variant === "glass" ? GLASS_STYLES.card : GLASS_STYLES.panel

  return (
    <div
      className={cn(
        "transition-all duration-200",
        hoverable && "hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(108,77,255,0.16)]",
        className,
      )}
      style={baseStyles}
      {...props}
    >
      {children}
    </div>
  )
}

/** @param {React.HTMLAttributes<HTMLDivElement>} props */
export function CardHeader({ children = null, className = "", ...props }) {
  return (
    <div className={cn("border-b border-[#E4ECFF] pb-4 mb-4", className)} {...props}>
      {children}
    </div>
  )
}

/** @param {React.HTMLAttributes<HTMLHeadingElement>} props */
export function CardTitle({ children = null, className = "", ...props }) {
  return (
    <h3 className={cn("text-xl font-black text-[#0F172A]", className)} {...props}>
      {children}
    </h3>
  )
}

/** @param {React.HTMLAttributes<HTMLDivElement>} props */
export function CardContent({ children = null, className = "", ...props }) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  )
}

/** @param {React.HTMLAttributes<HTMLDivElement>} props */
export function CardFooter({ children = null, className = "", ...props }) {
  return (
    <div className={cn("border-t border-[#E4ECFF] pt-4 mt-4", className)} {...props}>
      {children}
    </div>
  )
}

export default Card

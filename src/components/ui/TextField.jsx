/**
 * Unified Text Input Component
 */
import { GLASS_STYLES } from "@/theme/tokens"
import { cn } from "@/lib/utils"

export function TextField({
  label,
  error,
  helpText,
  size = "md",
  icon: Icon,
  className,
  ...props
}) {
  const sizes = {
    sm: "h-10 px-3 text-sm",
    md: "h-12 px-4 text-base",
    lg: "h-14 px-5 text-lg",
  }

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-bold text-[#0F172A] mb-2">{label}</label>}

      <div className="relative">
        {Icon && (
          <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
        )}

        <input
          className={cn(
            "w-full rounded-2xl outline-none transition-all duration-200 font-medium",
            "placeholder:text-[#CBD5E1]",
            "focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-50",
            Icon && "pr-12",
            sizes[size],
            error && "border-2 border-[#EF4444]",
            !error && "border border-[#E4ECFF]",
            className,
          )}
          style={{
            backgroundColor: GLASS_STYLES.input.background,
            borderColor: error ? "#EF4444" : GLASS_STYLES.input.border,
          }}
          {...props}
        />
      </div>

      {error && <p className="text-sm text-[#EF4444] font-semibold mt-2">{error}</p>}
      {helpText && !error && <p className="text-sm text-[#64748B] mt-2">{helpText}</p>}
    </div>
  )
}

export default TextField

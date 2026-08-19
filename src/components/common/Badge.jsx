import { cn } from "@/lib/utils"

export function Badge({ children, variant = "default", className, ...props }) {
  const variants = {
    default: "bg-[#EEF4FF] text-[#7C3AED] border border-[#DDEBFF]",
    success: "bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]",
    warning: "bg-[#FFFBEB] text-[#D97706] border border-[#FEE3C3]",
    error: "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
    secondary: "bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge

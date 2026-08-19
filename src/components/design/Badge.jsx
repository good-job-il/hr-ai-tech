import React from "react"
import { cn } from "@/lib/utils"

/** @type {React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement> & {variant?: 'primary'|'secondary'|'success'|'warning'|'error'|'neutral'|'outline'}>} */
const Badge = React.forwardRef(({ className = "", variant = "primary", ...props }, ref) => {
  const variants = {
    primary: "bg-purple-100 text-purple-700 border border-purple-300/50",
    secondary: "bg-blue-100 text-blue-700 border border-blue-300/50",
    success: "bg-green-100 text-green-700 border border-green-300/50",
    warning: "bg-yellow-100 text-yellow-700 border border-yellow-300/50",
    error: "bg-red-100 text-red-700 border border-red-300/50",
    neutral: "bg-gray-100 text-gray-700 border border-gray-300/50",
    outline: "bg-transparent border border-purple-400 text-purple-700",
  }

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
        variants[variant],
        className,
      )}
      {...props}
    />
  )
})

Badge.displayName = "Badge"
export default Badge

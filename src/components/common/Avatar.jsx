import { cn } from "@/lib/utils"

export function Avatar({ src, alt, initials, size = "md", className, ...props }) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] text-white",
        sizes[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}

export default Avatar

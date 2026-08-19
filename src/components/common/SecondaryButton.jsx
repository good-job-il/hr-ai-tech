import { cn } from "@/lib/utils"

export function SecondaryButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center h-12 px-7 rounded-2xl border border-[#DDEBFF] bg-white text-[#6C4DFF] font-bold text-[15px] transition-all hover:bg-[#F3EFFF]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default SecondaryButton

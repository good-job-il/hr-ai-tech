import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const statTones = {
  violet: {
    icon: "text-violet-600",
    iconBg: "from-violet-100 to-fuchsia-50",
    glow: "bg-violet-200",
  },
  blue: {
    icon: "text-blue-600",
    iconBg: "from-blue-100 to-cyan-50",
    glow: "bg-blue-200",
  },
  cyan: {
    icon: "text-cyan-600",
    iconBg: "from-cyan-100 to-sky-50",
    glow: "bg-cyan-200",
  },
  fuchsia: {
    icon: "text-fuchsia-600",
    iconBg: "from-fuchsia-100 to-pink-50",
    glow: "bg-fuchsia-200",
  },
  emerald: {
    icon: "text-emerald-600",
    iconBg: "from-emerald-100 to-teal-50",
    glow: "bg-emerald-200",
  },
  rose: {
    icon: "text-rose-600",
    iconBg: "from-rose-100 to-orange-50",
    glow: "bg-rose-200",
  },
  amber: {
    icon: "text-amber-600",
    iconBg: "from-amber-100 to-orange-50",
    glow: "bg-amber-200",
  },
  slate: {
    icon: "text-slate-600",
    iconBg: "from-slate-100 to-gray-50",
    glow: "bg-slate-200",
  },
}

export function formatPlatformNumber(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0)
}

export function PlatformPageShell({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "relative -m-6 min-h-full overflow-hidden bg-[linear-gradient(135deg,#f7faff_0%,#f7fbff_45%,#f4f1ff_100%)] p-6",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />

      <div className="pointer-events-none absolute right-10 top-0 h-80 w-80 rounded-full bg-violet-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-[1480px]">{children}</div>
    </div>
  )
}

export function PlatformPageHeader({ title, subtitle, actions, icon: Icon = Sparkles, className }) {
  return (
    <header
      className={cn("flex flex-col justify-between gap-4 sm:flex-row sm:items-center", className)}
    >
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[26px] font-black tracking-tight text-slate-900 sm:text-[30px]">
            {title}
          </h1>

          {Icon && <Icon className="h-5 w-5 text-violet-500" />}
        </div>

        {subtitle && <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}

export function PlatformCard({ className, children, as: Component = "section", ...props }) {
  return (
    <Component
      className={cn(
        "rounded-[22px] border border-white/80 bg-white/90 shadow-[0_12px_38px_rgba(54,74,138,0.08)] backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export function PlatformStatCard({
  icon: Icon,
  label,
  value,
  prefix = "",
  suffix = "",
  change,
  meta,
  tone = "violet",
  loading,
  to,
  className,
}) {
  const colors = statTones[tone] || statTones.violet

  const content = (
    <div
      className={cn(
        "group relative h-full min-h-[132px] overflow-hidden rounded-[22px] border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(54,74,138,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(77,70,170,0.13)]",
        className,
      )}
    >
      <div
        className={cn(
          "absolute -right-8 -top-9 h-24 w-24 rounded-full opacity-25 blur-2xl",
          colors.glow,
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-slate-500">{label}</p>

          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-2 text-[28px] font-black tracking-tight text-slate-900">
              {prefix}

              {formatPlatformNumber(value)}

              {suffix}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br",
              colors.iconBg,
            )}
          >
            <Icon className={cn("h-6 w-6", colors.icon)} strokeWidth={1.8} />
          </div>
        )}
      </div>

      {(change !== undefined || meta || to) && (
        <div className="relative mt-3 flex items-center gap-1 text-[11px] font-semibold">
          {change !== undefined && <span className="text-emerald-600">+{change}%</span>}

          {meta && <span className="text-slate-400">{meta}</span>}

          {to && (
            <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-slate-300 transition group-hover:text-violet-500" />
          )}
        </div>
      )}
    </div>
  )

  return to ? <Link to={to}>{content}</Link> : content
}

export function PlatformWidgetHeader({
  title,
  subtitle,
  linkTo,
  action,
  actionLabel = "View all",
  className,
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div>
        <h2 className="text-[15px] font-extrabold text-slate-800">{title}</h2>

        {subtitle && <p className="mt-1 text-xs font-medium text-slate-400">{subtitle}</p>}
      </div>

      {action ||
        (linkTo && (
          <Link
            to={linkTo}
            className="flex items-center gap-1 text-xs font-bold text-violet-600 transition hover:text-violet-800"
          >
            {actionLabel}

            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ))}
    </div>
  )
}

export function PlatformEmptyState({ children, icon: Icon, className }) {
  return (
    <div
      className={cn(
        "flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center text-sm font-medium text-slate-400",
        className,
      )}
    >
      {Icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
          <Icon className="h-5 w-5" />
        </div>
      )}

      {children}
    </div>
  )
}

export function PlatformModal({
  children,
  title,
  subtitle,
  icon: Icon,
  onClose,
  maxWidth = "max-w-md",
  tone = "violet",
  dir,
}) {
  const colors = statTones[tone] || statTones.violet

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
    >
      <div
        className={cn(
          "w-full rounded-[24px] border border-white/80 bg-white p-6 shadow-2xl",
          maxWidth,
        )}
      >
        <div className="mb-5 flex items-start gap-3">
          {Icon && (
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br",
                colors.iconBg,
                colors.icon,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-black text-slate-900">{title}</h3>

            {subtitle && <p className="mt-0.5 text-xs font-medium text-slate-400">{subtitle}</p>}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {children}
      </div>
    </div>
  )
}

export const platformFieldClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"

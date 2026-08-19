import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Calendar, CheckCircle2, Globe, Mail, Plug, Shield } from "lucide-react"
import { useTranslation } from "react-i18next"
import { integrationConnectionService } from "@/api/services/integrationConnectionService"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"

const ICONS = { gmail: Mail, google_calendar: Calendar, linkedin: Globe }

export default function IntegrationsSettings() {
  const { i18n } = useTranslation()

  const isRTL = !i18n.language?.startsWith("en")

  const { can } = usePermissionMatrix()

  const qc = useQueryClient()

  const {
    data: integrations = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["integration-connections"],
    queryFn: integrationConnectionService.list,
    staleTime: 30_000,
  })

  const mutation = useMutation({
    mutationFn: async ({ action, provider }) => {
      if (action === "disconnect") {
        return integrationConnectionService.disconnect(provider)
      }

      const result =
        action === "reconnect"
          ? await integrationConnectionService.reconnect(provider)
          : await integrationConnectionService.connect(provider)

      window.location.assign(result.authorization_url)

      return result
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integration-connections"] }),
  })

  const text = isRTL
    ? {
        title: "אינטגרציות וחיבורים",
        subtitle: "מצב חיבור אמיתי, הרשאות, סנכרון ושגיאות",
        connected: "מחוברות",
        available: "זמינות",
        unavailable: "לא זמינות",
        connect: "חבר",
        disconnect: "נתק",
        reconnect: "חבר מחדש",
        lastSync: "סנכרון אחרון",
        scopes: "הרשאות",
        notEnabled: "האינטגרציה אינה מופעלת בסביבה זו",
        noConnections: "אין אינטגרציות מחוברות",
        error: "לא ניתן לטעון את מצב האינטגרציות",
        retry: "נסה שוב",
      }
    : {
        title: "Integrations",
        subtitle: "Real connection state, scopes, synchronization and errors",
        connected: "Connected",
        available: "Available",
        unavailable: "Unavailable",
        connect: "Connect",
        disconnect: "Disconnect",
        reconnect: "Reconnect",
        lastSync: "Last sync",
        scopes: "Scopes",
        notEnabled: "This integration is not enabled in this environment",
        noConnections: "No connected integrations",
        error: "Unable to load integrations",
        retry: "Try again",
      }

  if (error) {
    return (
      <PlatformPageShell dir={isRTL ? "rtl" : "ltr"}>
        <PlatformCard className="p-5">
          <PlatformEmptyState icon={AlertCircle} className="min-h-72">
            <p role="alert" className="font-bold text-slate-700">
              {text.error}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              disabled={isRefetching}
              onClick={() => refetch()}
            >
              {text.retry}
            </Button>
          </PlatformEmptyState>
        </PlatformCard>
      </PlatformPageShell>
    )
  }

  const connected = integrations.filter((item) => item.status === "connected").length

  const available = integrations.filter((item) => item.feature_available).length

  const errors = integrations.filter((item) => item.status === "error").length

  return (
    <PlatformPageShell dir={isRTL ? "rtl" : "ltr"}>
      <div className="space-y-6">
        <PlatformPageHeader title={text.title} subtitle={text.subtitle} icon={Plug} />
        <div className="grid gap-4 sm:grid-cols-3">
          <PlatformStatCard
            icon={CheckCircle2}
            label={text.connected}
            value={connected}
            loading={isLoading}
            tone="emerald"
          />
          <PlatformStatCard
            icon={Plug}
            label={text.available}
            value={available}
            loading={isLoading}
            tone="violet"
          />
          <PlatformStatCard
            icon={AlertCircle}
            label="Errors"
            value={errors}
            loading={isLoading}
            tone="rose"
          />
        </div>
        <PlatformCard className="p-5">
          <PlatformWidgetHeader title={text.title} subtitle={`${integrations.length}`} />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {integrations.map((item) => {
              const Icon = ICONS[item.provider] || Plug

              const pending = mutation.isPending && mutation.variables?.provider === item.provider

              return (
                <div
                  key={item.provider}
                  className={`rounded-2xl border p-5 ${item.status === "error" ? "border-rose-200 bg-rose-50/60" : item.status === "connected" ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-black text-slate-800">{item.name}</h3>
                        <Status value={item.status} />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {item.external_account_label || item.provider}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    <p>
                      <strong>{text.scopes}:</strong>{" "}
                      {(item.scopes.length ? item.scopes : item.required_scopes).join(", ") || "—"}
                    </p>
                    <p>
                      <strong>{text.lastSync}:</strong>{" "}
                      {item.last_sync_at ? new Date(item.last_sync_at).toLocaleString() : "—"}{" "}
                      {item.last_sync_status ? `(${item.last_sync_status})` : ""}
                    </p>
                    {item.last_error && (
                      <p className="rounded-lg bg-rose-100 p-2 font-bold text-rose-700">
                        {item.last_error}
                      </p>
                    )}
                    {!item.feature_available && item.status !== "connected" && (
                      <p className="rounded-lg bg-slate-100 p-2 font-bold text-slate-500">
                        {text.notEnabled}
                      </p>
                    )}
                  </div>
                  {can("manage_settings") && (
                    <div className="mt-4 flex justify-end gap-2">
                      {item.status === "connected" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() =>
                            mutation.mutate({ action: "disconnect", provider: item.provider })
                          }
                        >
                          <Unplug className="h-4 w-4" />
                          {text.disconnect}
                        </Button>
                      ) : (
                        item.feature_available && (
                          <Button
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              mutation.mutate({
                                action: item.status === "error" ? "reconnect" : "connect",
                                provider: item.provider,
                              })
                            }
                          >
                            {pending ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plug className="h-4 w-4" />
                            )}
                            {item.status === "error" ? text.reconnect : text.connect}
                          </Button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {!isLoading && connected === 0 && (
            <PlatformEmptyState icon={Shield} className="mt-5">
              {text.noConnections}
            </PlatformEmptyState>
          )}
          {mutation.error && (
            <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">
              {mutation.error.message}
            </p>
          )}
        </PlatformCard>
      </div>
    </PlatformPageShell>
  )
}

function Status({ value }) {
  const tone =
    value === "connected"
      ? "bg-emerald-100 text-emerald-700"
      : value === "error"
        ? "bg-rose-100 text-rose-700"
        : value === "pending"
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-500"

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${tone}`}>
      {value}
    </span>
  )
}

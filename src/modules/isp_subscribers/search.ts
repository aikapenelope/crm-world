import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const STATUS_LABELS: Record<string, string> = {
  pending_installation: 'En instalación',
  active: 'Activo',
  suspended_overdue: 'Moroso',
  suspended_voluntary: 'Suspendido',
  cancelled: 'Cancelado',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // isp_subscribers.subscriber — Abonados del ISP
    // Búsqueda prioritaria: por número de cuenta, dirección o ciudad.
    // El pppoe_username se indexa solo como hash para login lookup seguro.
    // =========================================================================
    {
      entityId: 'isp_subscribers.isp_subscriber',
      enabled: true,
      priority: 50,

      fieldPolicy: {
        searchable: ['account_number', 'subscriber_type', 'service_status', 'installation_city', 'installation_address', 'reference_description'],
        hashOnly: ['pppoe_username', 'ip_address', 'mac_address'],
        excluded: ['monthly_price_usd', 'cut_policy_days', 'billing_cycle_day'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.account_number) lines.push(`Cuenta: ${r.account_number}`)
        if (r.installation_city) lines.push(`Ciudad: ${r.installation_city}`)
        if (r.installation_address) lines.push(`Dirección: ${r.installation_address}`)
        if (r.reference_description) lines.push(String(r.reference_description))
        if (r.subscriber_type) lines.push(`Tipo: ${r.subscriber_type}`)
        if (!lines.length) return null

        const statusLabel = STATUS_LABELS[String(r.service_status ?? '')] ?? String(r.service_status ?? '')

        return {
          text: lines,
          presenter: {
            title: (norm(r.account_number) ?? undefined) ?? 'Abonado',
            subtitle: [norm(r.installation_city), norm(r.subscriber_type)].filter(Boolean).join(' · ') || undefined,
            icon: 'users',
            badge: statusLabel,
          },
          links: [{ href: `/backend/isp-subscribers/${r.id}`, label: 'Ver abonado', kind: 'primary' }],
          checksumSource: {
            account_number: r.account_number,
            service_status: r.service_status,
            installation_city: r.installation_city,
            last_payment_date: r.last_payment_date,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.service_status ?? '')] ?? String(r.service_status ?? '')
        return {
          title: (norm(r.account_number) ?? undefined) ?? 'Abonado',
          subtitle: [norm(r.installation_city), norm(r.subscriber_type)].filter(Boolean).join(' · ') || undefined,
          icon: 'users',
          badge: statusLabel,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/isp-subscribers/${ctx.record.id}`,
    },
  ],
}

export default searchConfig
export const config = searchConfig

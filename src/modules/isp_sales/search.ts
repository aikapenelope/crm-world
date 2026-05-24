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
  new: 'Nuevo', coverage_check: 'Verificando cobertura', quoted: 'Cotizado',
  scheduled: 'Agendado', installed: '✓ Instalado', lost: 'Perdido',
}

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp', instagram: 'Instagram', referral: 'Referido',
  website: 'Web', cold_call: 'Llamada', other: 'Otro',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // isp_sales.lead — Leads / Prospectos del ISP
    // Agentes buscan por nombre, teléfono o ciudad del prospecto.
    // El teléfono se indexa solo como hash para lookup seguro.
    // =========================================================================
    {
      entityId: 'isp_sales.lead',
      enabled: true,
      priority: 35,

      fieldPolicy: {
        searchable: ['name', 'city', 'source', 'status', 'address'],
        hashOnly: ['phone', 'email'],
        excluded: ['notes'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.city) lines.push(`Ciudad: ${r.city}`)
        if (r.source) lines.push(`Canal: ${SOURCE_LABELS[String(r.source)] ?? r.source}`)
        if (r.address) lines.push(`Dirección: ${r.address}`)
        if (!lines.length) return null

        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')

        return {
          text: lines,
          presenter: {
            title: (norm(r.name) ?? undefined) ?? 'Lead',
            subtitle: [norm(r.city), SOURCE_LABELS[String(r.source ?? '')] ?? norm(r.source)].filter(Boolean).join(' · ') || undefined,
            icon: 'trending-up',
            badge: statusLabel,
          },
          links: [{ href: `/backend/isp-sales/${r.id}`, label: 'Ver lead', kind: 'primary' }],
          checksumSource: { name: r.name, status: r.status, city: r.city, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: (norm(r.name) ?? undefined) ?? 'Lead',
          subtitle: [norm(r.city), SOURCE_LABELS[String(r.source ?? '')] ?? norm(r.source)].filter(Boolean).join(' · ') || undefined,
          icon: 'trending-up',
          badge: statusLabel,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/isp-sales/${ctx.record.id}`,
    },
  ],
}

export default searchConfig
export const config = searchConfig

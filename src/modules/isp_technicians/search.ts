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

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // isp_technicians.work_order — Órdenes de trabajo
    // Técnicos buscan sus órdenes por número o dirección.
    // =========================================================================
    {
      entityId: 'isp_technicians:isp_work_order',
      enabled: true,
      priority: 25,

      fieldPolicy: {
        searchable: ['work_order_number', 'type', 'status', 'address', 'priority'],
        excluded: ['km_traveled', 'coordinates_lat', 'coordinates_lng'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.work_order_number) lines.push(`OT: ${r.work_order_number}`)
        if (r.address) lines.push(`Dirección: ${r.address}`)
        if (r.type) lines.push(`Tipo: ${r.type}`)
        if (!lines.length) return null

        const STATUS_ICON: Record<string, string> = { pending: '⏳', scheduled: '📅', in_progress: '🔧', completed: '✅', cancelled: '❌' }
        const icon = STATUS_ICON[String(r.status ?? '')] ?? ''

        return {
          text: lines,
          presenter: {
            title: `${icon} ${norm(r.work_order_number) ?? 'OT'}`.trim(),
            subtitle: (norm(r.address) ?? undefined) ?? undefined,
            icon: 'tool',
            badge: String(r.status ?? ''),
          },
          links: [{ href: `/backend/isp-technicians/work-orders/${r.id}`, label: 'Ver OT', kind: 'primary' }],
          checksumSource: { work_order_number: r.work_order_number, status: r.status, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.work_order_number) ?? undefined) ?? 'OT',
          subtitle: (norm(r.address) ?? undefined) ?? undefined,
          icon: 'tool',
          badge: String(r.status ?? ''),
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/isp-technicians/work-orders/${ctx.record.id}`,
    },

    // =========================================================================
    // isp_technicians.technician — Técnicos de campo
    // =========================================================================
    {
      entityId: 'isp_technicians:isp_field_technician',
      enabled: true,
      priority: 10,

      fieldPolicy: {
        searchable: ['name', 'coverage_zone', 'status'],
        hashOnly: ['phone'],
        excluded: ['fuel_allowance_usd', 'commission_per_install'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.coverage_zone) lines.push(`Zona: ${r.coverage_zone}`)
        if (!lines.length) return null

        return {
          text: lines,
          presenter: {
            title: (norm(r.name) ?? undefined) ?? 'Técnico',
            subtitle: (norm(r.coverage_zone) ?? undefined) ?? undefined,
            icon: 'user',
            badge: String(r.status ?? ''),
          },
          links: [{ href: `/backend/isp-technicians/${r.id}`, label: 'Ver técnico', kind: 'primary' }],
          checksumSource: { name: r.name, status: r.status, coverage_zone: r.coverage_zone },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name) ?? undefined) ?? 'Técnico',
          subtitle: (norm(r.coverage_zone) ?? undefined) ?? undefined,
          icon: 'user',
          badge: String(r.status ?? ''),
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/isp-technicians/${ctx.record.id}`,
    },
  ],
}

export default searchConfig
export const config = searchConfig

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
    {
      entityId: 'dist_delivery:dist_delivery_order',
      enabled: true,
      priority: 25,

      fieldPolicy: {
        searchable: ['delivery_number', 'customer_name', 'status'],
        hashOnly: ['customer_phone'],
        excluded: ['total_amount'],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.delivery_number) lines.push(String(r.delivery_number))
        if (r.customer_name) lines.push(String(r.customer_name))
        if (r.status) lines.push(String(r.status))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.delivery_number) ?? undefined) ?? 'Delivery Number',
          subtitle: ((norm(r.customer_name) ?? '') + ' · ' + (norm(r.status) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'truck',
          badge: (norm(r.status) ?? undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/dist_delivery', label: 'Ver despachos', kind: 'primary' }],
          checksumSource: { delivery_number: r.delivery_number, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.delivery_number) ?? undefined) ?? 'Delivery Number',
          subtitle: (norm(r.customer_name) ?? undefined) ?? undefined,
          icon: 'truck',
          badge: (norm(r.status) ?? undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/dist_delivery'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

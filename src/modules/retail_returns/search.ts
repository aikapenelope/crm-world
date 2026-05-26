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
      entityId: 'retail_returns.retail_return_policy',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: ['return_number', 'reason', 'status'],
        excluded: ['refund_amount'],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.return_number) lines.push(String(r.return_number))
        if (r.reason) lines.push(String(r.reason))
        if (r.status) lines.push(String(r.status))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.return_number) ?? undefined) ?? 'Return Number',
          subtitle: ((norm(r.reason) ?? '') + ' · ' + (norm(r.status) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'rotate-ccw',
          badge: (norm(r.status) ?? undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/retail_returns', label: 'Ver devoluciones', kind: 'primary' }],
          checksumSource: { return_number: r.return_number, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.return_number) ?? undefined) ?? 'Return Number',
          subtitle: (norm(r.reason) ?? undefined) ?? undefined,
          icon: 'rotate-ccw',
          badge: (norm(r.status) ?? undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/retail_returns'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

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
      entityId: 'condo_accounting.entry',
      enabled: true,
      priority: 15,

      fieldPolicy: {
        searchable: ['description', 'category', 'entry_type'],
        excluded: ['amount', 'amount_ves', 'exchange_rate'],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.description) lines.push(String(r.description))
        if (r.category) lines.push(String(r.category))
        if (r.entry_type) lines.push(String(r.entry_type))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.description) ?? undefined) ?? 'Description',
          subtitle: ((norm(r.category) ?? '') + ' · ' + (norm(r.entry_type) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'dollar-sign',
          badge: (norm(r.entry_type) ?? undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/condo_accounting', label: 'Ver contabilidad', kind: 'primary' }],
          checksumSource: { description: r.description, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.description) ?? undefined) ?? 'Description',
          subtitle: (norm(r.category) ?? undefined) ?? undefined,
          icon: 'dollar-sign',
          badge: (norm(r.entry_type) ?? undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/condo_accounting'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

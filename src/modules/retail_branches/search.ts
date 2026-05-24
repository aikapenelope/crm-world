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
      entityId: 'retail_branches.branch',
      enabled: true,
      priority: 25,

      fieldPolicy: {
        searchable: ['name', 'code', 'city', 'branch_type'],
        excluded: [],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.code) lines.push(String(r.code))
        if (r.city) lines.push(String(r.city))
        if (r.branch_type) lines.push(String(r.branch_type))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.name) ?? undefined) ?? 'Name',
          subtitle: ((norm(r.city) ?? '') + ' · ' + (norm(r.branch_type) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'store',
          badge: (norm(r.branch_type) ?? undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/retail_branches/[id]', label: 'Ver sucursal', kind: 'primary' }],
          checksumSource: { name: r.name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name) ?? undefined) ?? 'Name',
          subtitle: (norm(r.city) ?? undefined) ?? undefined,
          icon: 'store',
          badge: (norm(r.branch_type) ?? undefined) ?? undefined,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => {
        const id = ctx.record.id
        return id ? `/backend/retail_branches/${encodeURIComponent(String(id))}`  : '/backend/retail_branches/'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

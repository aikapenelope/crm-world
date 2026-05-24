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
      entityId: 'condo_comms.circular',
      enabled: true,
      priority: 15,

      fieldPolicy: {
        searchable: ['title', 'category', 'status'],
        excluded: [],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.title) lines.push(String(r.title))
        if (r.category) lines.push(String(r.category))
        if (r.status) lines.push(String(r.status))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.title) as string | undefined) ?? 'Title',
          subtitle: ((norm(r.category) ?? '') + ' · ' + (norm(r.status) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'mail',
          badge: (norm(r.category) as string | undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/condo_comms', label: 'Ver comunicaciones', kind: 'primary' }],
          checksumSource: { title: r.title, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.title) as string | undefined) ?? 'Title',
          subtitle: (norm(r.category) as string | undefined) ?? undefined,
          icon: 'mail',
          badge: (norm(r.category) as string | undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/condo_comms'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

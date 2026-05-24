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
      entityId: 'retail_loyalty.program',
      enabled: true,
      priority: 15,

      fieldPolicy: {
        searchable: ['name', 'description'],
        excluded: [],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.description) lines.push(String(r.description))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.name as string) as string | undefined) ?? 'Name',
          subtitle: ((norm(r.description as string) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'star',
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/retail_loyalty', label: 'Ver lealtad', kind: 'primary' }],
          checksumSource: { name: r.name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name as string) as string | undefined) ?? 'Name',
          subtitle: (norm(r.description as string) as string | undefined) ?? undefined,
          icon: 'star',
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/retail_loyalty'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

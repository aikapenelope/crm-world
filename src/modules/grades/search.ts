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
      entityId: 'grades:subject',
      enabled: true,
      priority: 10,

      fieldPolicy: {
        searchable: ['name', 'code'],
        excluded: [],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.code) lines.push(String(r.code))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.name) ?? undefined) ?? 'Name',
          subtitle: ((norm(r.code) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'award',
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/grades', label: 'Ver materias', kind: 'primary' }],
          checksumSource: { name: r.name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name) ?? undefined) ?? 'Name',
          subtitle: (norm(r.code) ?? undefined) ?? undefined,
          icon: 'award',
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/grades'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

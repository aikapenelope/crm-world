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
      entityId: 'auto_parts.part',
      enabled: true,
      priority: 25,

      fieldPolicy: {
        searchable: ['code', 'name', 'category', 'brand'],
        excluded: ['cost_price', 'selling_price'],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.code) lines.push(String(r.code))
        if (r.name) lines.push(String(r.name))
        if (r.category) lines.push(String(r.category))
        if (r.brand) lines.push(String(r.brand))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.name as string) as string | undefined) ?? 'Name',
          subtitle: ((norm(r.code as string) ?? '') + ' · ' + (norm(r.category as string) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'wrench',
          badge: (norm(r.category as string) as string | undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/auto_parts', label: 'Ver repuestos', kind: 'primary' }],
          checksumSource: { name: r.name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name as string) as string | undefined) ?? 'Name',
          subtitle: (norm(r.code as string) as string | undefined) ?? undefined,
          icon: 'wrench',
          badge: (norm(r.category as string) as string | undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/auto_parts'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

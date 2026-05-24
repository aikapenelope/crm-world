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
      entityId: 'retail_purchasing.supplier',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: ['name', 'contact_name', 'city', 'category'],
        hashOnly: ['email', 'phone', 'rif'],
        excluded: [],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.contact_name) lines.push(String(r.contact_name))
        if (r.city) lines.push(String(r.city))
        if (r.category) lines.push(String(r.category))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.name) ?? undefined) ?? 'Name',
          subtitle: ((norm(r.city) ?? '') + ' · ' + (norm(r.category) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'building',
          badge: (norm(r.category) ?? undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/retail_purchasing', label: 'Ver proveedores', kind: 'primary' }],
          checksumSource: { name: r.name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name) ?? undefined) ?? 'Name',
          subtitle: (norm(r.city) ?? undefined) ?? undefined,
          icon: 'building',
          badge: (norm(r.category) ?? undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/retail_purchasing'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

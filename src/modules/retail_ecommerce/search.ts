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
      entityId: 'retail_ecommerce.storefront',
      enabled: true,
      priority: 15,

      fieldPolicy: {
        searchable: ['name', 'slug', 'status'],
        excluded: [],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.slug) lines.push(String(r.slug))
        if (r.status) lines.push(String(r.status))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: norm(r.name) ?? 'Name',
          subtitle: ((norm(r.slug) ?? '') + ' · ' + (norm(r.status) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'shopping-bag',
          badge: norm(r.status) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/retail_ecommerce', label: 'Ver tienda', kind: 'primary' }],
          checksumSource: { name: r.name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: norm(r.name) ?? 'Name',
          subtitle: norm(r.slug) ?? undefined,
          icon: 'shopping-bag',
          badge: norm(r.status) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/retail_ecommerce'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

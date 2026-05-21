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
      entityId: 'dist_inventory.item',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: ['product_name', 'sku', 'warehouse_name', 'category'],
        excluded: ['cost_price', 'selling_price'],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.product_name) lines.push(String(r.product_name))
        if (r.sku) lines.push(String(r.sku))
        if (r.warehouse_name) lines.push(String(r.warehouse_name))
        if (r.category) lines.push(String(r.category))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: norm(r.product_name) ?? 'Product Name',
          subtitle: ((norm(r.sku) ?? '') + ' · ' + (norm(r.category) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'package',
          badge: norm(r.category) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/dist_inventory', label: 'Ver inventario', kind: 'primary' }],
          checksumSource: { product_name: r.product_name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: norm(r.product_name) ?? 'Product Name',
          subtitle: norm(r.sku) ?? undefined,
          icon: 'package',
          badge: norm(r.category) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/dist_inventory'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

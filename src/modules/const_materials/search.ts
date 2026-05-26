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
      entityId: 'const_materials:const_material_order',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: ['order_number', 'supplier_name', 'status'],
        excluded: ['total_amount'],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.order_number) lines.push(String(r.order_number))
        if (r.supplier_name) lines.push(String(r.supplier_name))
        if (r.status) lines.push(String(r.status))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.order_number) ?? undefined) ?? 'Order Number',
          subtitle: ((norm(r.supplier_name) ?? '') + ' · ' + (norm(r.status) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'package',
          badge: (norm(r.status) ?? undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/const_materials', label: 'Ver materiales', kind: 'primary' }],
          checksumSource: { order_number: r.order_number, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.order_number) ?? undefined) ?? 'Order Number',
          subtitle: (norm(r.supplier_name) ?? undefined) ?? undefined,
          icon: 'package',
          badge: (norm(r.status) ?? undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/const_materials'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

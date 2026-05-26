import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { if (v == null) return null; const s = String(v).trim(); return s.length > 0 ? s : null }

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'retail_pricing.retail_pricing_rule',
      enabled: true,
      priority: 10,
      fieldPolicy: { searchable: ['name', 'rule_type'], excluded: ['min_margin_percent'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.name) return null
        return { text: [String(r.name)], presenter: { title: (norm(r.name) ?? undefined) ?? 'Regla de precio', icon: 'percent' }, links: [{ href: '/backend/retail_pricing', label: 'Ver precios', kind: 'primary' }], checksumSource: { name: r.name, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => ({ title: norm(ctx.record.name) ?? 'Regla de precio', icon: 'percent' }),
      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => '/backend/retail_pricing',
    },
  ],
}
export default searchConfig
export const config = searchConfig

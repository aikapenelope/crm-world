import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { if (v == null) return null; const s = String(v).trim(); return s.length > 0 ? s : null }

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'dist_price_lists:dist_price_list',
      enabled: true,
      priority: 15,
      fieldPolicy: { searchable: ['name', 'code', 'description'], excluded: [] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.name) return null
        return { text: [String(r.name), norm(r.code) ?? '', norm(r.description) ?? ''].filter(Boolean), presenter: { title: (norm(r.name) ?? undefined) ?? 'Lista de precios', subtitle: (norm(r.code) ?? undefined) ?? undefined, icon: 'tag' }, links: [{ href: '/backend/dist_price_lists', label: 'Ver listas', kind: 'primary' }], checksumSource: { name: r.name, code: r.code, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => ({ title: norm(ctx.record.name) ?? 'Lista de precios', subtitle: norm(ctx.record.code) ?? undefined, icon: 'tag' }),
      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => '/backend/dist_price_lists',
    },
  ],
}
export default searchConfig
export const config = searchConfig

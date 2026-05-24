import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { if (v == null) return null; const s = String(v).trim(); return s.length > 0 ? s : null }

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'retail_inventory.count',
      enabled: true,
      priority: 15,
      fieldPolicy: { searchable: ['count_number', 'status', 'count_type'], excluded: [] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.count_number) return null
        return { text: [String(r.count_number), String(r.status ?? '')].filter(Boolean), presenter: { title: (norm(r.count_number) as string | undefined) ?? 'Conteo', subtitle: (norm(r.status) as string | undefined) ?? undefined, icon: 'package' }, links: [{ href: '/backend/retail_inventory', label: 'Ver inventario', kind: 'primary' }], checksumSource: { count_number: r.count_number, status: r.status, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => ({ title: norm(ctx.record.count_number) ?? 'Conteo', subtitle: norm(ctx.record.status) ?? undefined, icon: 'package' }),
      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => '/backend/retail_inventory',
    },
  ],
}
export default searchConfig
export const config = searchConfig

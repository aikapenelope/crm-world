import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { const s = String(v ?? '').trim(); return s.length > 0 ? s : null }
export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_costs.variance',
      enabled: true, priority: 40,
      fieldPolicy: { searchable: ['order_number', 'product_code', 'product_name', 'status'], excluded: ['tenant_id', 'organization_id', 'order_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record; if (!r.order_number) return null
        const variance = Number(r.total_variance_usd)
        return { text: [norm(r.order_number as string) ?? '', norm(r.product_code as string) ?? ''].filter(Boolean), presenter: { title: (norm(r.order_number as string) as string | undefined) ?? 'Orden', subtitle: `Variación: USD ${variance.toFixed(2)} (${variance > 0 ? 'desfavorable' : 'favorable'})`, icon: 'dollar-sign', badge: r.status }, links: [{ href: '/backend/mfg-costs', label: 'Ver costos', kind: 'primary' }], checksumSource: { order_number: r.order_number, status: r.status, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => { const r = ctx.record; return { title: (norm(r.order_number as string) as string | undefined) ?? 'Variación', subtitle: (norm(r.product_code as string) as string | undefined) ?? undefined, icon: 'dollar-sign', badge: r.status } },
      resolveUrl: async (): Promise<string | null> => '/backend/mfg-costs',
    },
  ],
}
export default searchConfig
export const config = searchConfig

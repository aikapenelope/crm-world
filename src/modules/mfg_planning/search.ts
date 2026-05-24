import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { const s = String(v ?? '').trim(); return s.length > 0 ? s : null }
export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_planning.schedule',
      enabled: true, priority: 40,
      fieldPolicy: { searchable: ['schedule_number', 'product_code', 'product_name', 'status'], excluded: ['tenant_id', 'organization_id', 'product_id', 'work_center_id', 'production_order_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record; if (!r.schedule_number) return null
        return { text: [norm(r.schedule_number) ?? '', norm(r.product_code) ?? ''].filter(Boolean), presenter: { title: (norm(r.schedule_number) ?? undefined) ?? 'MPS', subtitle: `${norm(r.product_code)} · ${r.planned_quantity} ${r.uom}`, icon: 'calendar', badge: r.status as string | undefined }, links: [{ href: '/backend/mfg-planning', label: 'Ver MPS', kind: 'primary' }], checksumSource: { schedule_number: r.schedule_number, status: r.status, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => { const r = ctx.record; return { title: (norm(r.schedule_number) ?? undefined) ?? 'MPS', subtitle: (norm(r.product_code) ?? undefined) ?? undefined, icon: 'calendar', badge: r.status as string | undefined } },
      resolveUrl: async (): Promise<string | null> => '/backend/mfg-planning',
    },
  ],
}
export default searchConfig
export const config = searchConfig

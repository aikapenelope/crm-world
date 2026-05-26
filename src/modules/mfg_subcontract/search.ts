import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { const s = String(v ?? '').trim(); return s.length > 0 ? s : null }
const SC_STATUS: Record<string, string> = { draft: 'Borrador', materials_sent: 'Mat. enviados', in_production: 'En producción', completed: 'Completado', cancelled: 'Cancelado' }
export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_subcontract:mfg_subcontract_order',
      enabled: true, priority: 40,
      fieldPolicy: { searchable: ['order_number', 'subcontractor_name', 'product_code', 'status'], excluded: ['tenant_id', 'organization_id', 'product_id', 'subcontractor_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record; if (!r.order_number) return null
        return { text: [norm(r.order_number) ?? '', norm(r.subcontractor_name) ?? ''].filter(Boolean), presenter: { title: (norm(r.order_number) ?? undefined) ?? 'SC', subtitle: `${norm(r.subcontractor_name) ?? ''} · ${r.product_code}`, icon: 'external-link', badge: SC_STATUS[String(r.status ?? '')] ?? String(r.status ?? '') }, links: [{ href: '/backend/mfg-subcontract', label: 'Ver maquila', kind: 'primary' }], checksumSource: { order_number: r.order_number, status: r.status, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => { const r = ctx.record; return { title: (norm(r.order_number) ?? undefined) ?? 'SC', subtitle: (norm(r.subcontractor_name) ?? undefined) ?? undefined, icon: 'external-link', badge: SC_STATUS[String(r.status ?? '')] ?? '' } },
      resolveUrl: async (): Promise<string | null> => '/backend/mfg-subcontract',
    },
  ],
}
export default searchConfig
export const config = searchConfig

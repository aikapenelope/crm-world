import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { const s = String(v ?? '').trim(); return s.length > 0 ? s : null }
export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_mrp:mfg_purchase_requisition',
      enabled: true,
      priority: 40,
      fieldPolicy: { searchable: ['requisition_number', 'material_code', 'material_name', 'status'], excluded: ['tenant_id', 'organization_id', 'material_id', 'supplier_id', 'mrp_requirement_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record; if (!r.requisition_number) return null
        return { text: [norm(r.requisition_number) ?? '', norm(r.material_code) ?? ''].filter(Boolean), presenter: { title: (norm(r.requisition_number) ?? undefined) ?? 'REQ', subtitle: `${norm(r.material_code)} — ${r.quantity} ${r.uom}`, icon: 'shopping-cart', badge: r.status as string | undefined }, links: [{ href: `/backend/mfg-mrp`, label: 'Ver MRP', kind: 'primary' }], checksumSource: { requisition_number: r.requisition_number, status: r.status, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => { const r = ctx.record; return { title: (norm(r.requisition_number) ?? undefined) ?? 'REQ', subtitle: (norm(r.material_code) ?? undefined) ?? undefined, icon: 'shopping-cart', badge: r.status as string | undefined } },
      resolveUrl: async (): Promise<string | null> => `/backend/mfg-mrp`,
    },
  ],
}
export default searchConfig
export const config = searchConfig

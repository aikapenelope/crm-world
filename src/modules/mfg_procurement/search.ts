import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { const s = String(v ?? '').trim(); return s.length > 0 ? s : null }
const PO_STATUS: Record<string, string> = { draft: 'Borrador', sent: 'Enviada', confirmed: 'Confirmada', in_transit: 'En tránsito', at_customs: 'En aduana VE', delivered: 'Recibida', cancelled: 'Cancelada' }
export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_procurement.purchase_order',
      enabled: true, priority: 45,
      fieldPolicy: { searchable: ['po_number', 'supplier_name', 'status', 'dau_number', 'incoterm'], excluded: ['tenant_id', 'organization_id', 'supplier_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record; if (!r.po_number) return null
        const statusLabel = PO_STATUS[String(r.status ?? '')] ?? String(r.status ?? '')
        return { text: [norm(r.po_number) ?? '', norm(r.supplier_name) ?? ''].filter(Boolean), presenter: { title: (norm(r.po_number) ?? undefined) ?? 'OC', subtitle: `${norm(r.supplier_name) ?? ''} · CIF: ${r.total_cif_cost}`, icon: 'shopping-cart', badge: statusLabel }, links: [{ href: `/backend/mfg-procurement/${r.id}`, label: 'Ver OC', kind: 'primary' }], checksumSource: { po_number: r.po_number, status: r.status, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => { const r = ctx.record; return { title: (norm(r.po_number) ?? undefined) ?? 'OC', subtitle: (norm(r.supplier_name) ?? undefined) ?? undefined, icon: 'shopping-cart', badge: PO_STATUS[String(r.status ?? '')] ?? String(r.status ?? '') } },
      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => `/backend/mfg-procurement/${ctx.record.id}`,
    },
  ],
}
export default searchConfig
export const config = searchConfig

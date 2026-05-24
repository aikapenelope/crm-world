import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { const s = String(v ?? '').trim(); return s.length > 0 ? s : null }
const SO_STATUS: Record<string, string> = { draft: 'Borrador', confirmed: 'Confirmado', in_preparation: 'En preparación', dispatched: 'Despachado', invoiced: 'Facturado', cancelled: 'Cancelado' }
export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_dispatch.sale_order',
      enabled: true, priority: 50,
      fieldPolicy: { searchable: ['order_number', 'customer_name', 'customer_rif', 'status'], excluded: ['tenant_id', 'organization_id', 'customer_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record; if (!r.order_number) return null
        return { text: [norm(r.order_number as string) ?? '', norm(r.customer_name as string) ?? ''].filter(Boolean), presenter: { title: (norm(r.order_number as string) as string | undefined) ?? 'SO', subtitle: `${norm(r.customer_name as string) ?? ''} · USD ${r.total_usd}`, icon: 'truck', badge: SO_STATUS[String(r.status ?? '')] ?? '' }, links: [{ href: `/backend/mfg-dispatch/${r.id}`, label: 'Ver pedido', kind: 'primary' }], checksumSource: { order_number: r.order_number, status: r.status, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => { const r = ctx.record; return { title: (norm(r.order_number as string) as string | undefined) ?? 'SO', subtitle: (norm(r.customer_name as string) as string | undefined) ?? undefined, icon: 'truck', badge: SO_STATUS[String(r.status ?? '')] ?? '' } },
      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => `/backend/mfg-dispatch/${ctx.record.id}`,
    },
  ],
}
export default searchConfig
export const config = searchConfig

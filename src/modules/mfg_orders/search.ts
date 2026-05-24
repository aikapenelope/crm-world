import type {
  SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const ORDER_STATUS: Record<string, string> = {
  planned: 'Planificada', released: 'Liberada', in_progress: 'En proceso',
  completed: 'Completada', cancelled: 'Cancelada',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_orders.production_order',
      enabled: true,
      priority: 50,
      fieldPolicy: {
        searchable: ['order_number', 'product_code', 'product_name', 'status', 'production_lot_number'],
        excluded: ['tenant_id', 'organization_id', 'bom_id', 'product_id', 'work_center_id', 'mps_id'],
      },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.order_number) return null
        const statusLabel = ORDER_STATUS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          text: [norm(r.order_number) ?? '', norm(r.product_code) ?? '', norm(r.product_name) ?? ''].filter(Boolean),
          presenter: {
            title: (norm(r.order_number) ?? undefined) ?? 'Orden',
            subtitle: `${norm(r.product_code)} — ${norm(r.product_name) ?? ''} · ${r.planned_quantity} ${r.uom}`,
            icon: 'factory',
            badge: statusLabel,
          },
          links: [{ href: `/backend/mfg-orders/${r.id}`, label: 'Ver orden', kind: 'primary' }],
          checksumSource: { order_number: r.order_number, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.order_number) ?? undefined) ?? 'Orden',
          subtitle: (norm(r.product_code) ?? undefined) ?? undefined,
          icon: 'factory',
          badge: ORDER_STATUS[String(r.status ?? '')] ?? String(r.status ?? ''),
        }
      },
      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/mfg-orders/${ctx.record.id}`,
    },
  ],
}
export default searchConfig
export const config = searchConfig

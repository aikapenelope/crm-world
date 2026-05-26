import type {
  SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const ORDER_STATUS: Record<string, string> = {
  draft: 'Borrador', confirmed: 'Confirmada', partially_dispatched: 'Parcial',
  fully_dispatched: 'Despachada', invoiced: 'Facturada', paid: 'Pagada', cancelled: 'Cancelada',
}
const INVOICE_STATUS: Record<string, string> = {
  pending: 'Pendiente', partial: 'Parcial', paid: 'Pagada', overdue: 'Vencida', cancelled: 'Cancelada',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'agri_sales:agri_sale_order',
      enabled: true, priority: 35,
      fieldPolicy: { searchable: ['order_number', 'status', 'payment_terms'], excluded: ['tenant_id', 'organization_id', 'customer_id', 'items', 'bcv_rate'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.order_number) return null
        return {
          text: [norm(r.order_number) ?? ''],
          presenter: { title: (norm(r.order_number) ?? undefined) ?? 'Orden', subtitle: `USD ${r.total_usd}`, icon: 'shopping-cart', badge: ORDER_STATUS[String(r.status)] ?? String(r.status) },
          links: [{ href: `/backend/agri-sales/${r.id}`, label: 'Ver orden', kind: 'primary' }],
          checksumSource: { order_number: r.order_number, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return { title: (norm(r.order_number) ?? undefined) ?? 'Orden', subtitle: `USD ${r.total_usd}`, icon: 'shopping-cart', badge: ORDER_STATUS[String(r.status)] ?? String(r.status) }
      },
      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => `/backend/agri-sales/${ctx.record.id}`,
    },
    {
      entityId: 'agri_sales:agri_sale_invoice',
      enabled: true, priority: 35,
      fieldPolicy: { searchable: ['invoice_number', 'control_number', 'status'], excluded: ['tenant_id', 'organization_id', 'customer_id', 'bcv_rate'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.invoice_number) return null
        return {
          text: [norm(r.invoice_number) ?? '', norm(r.control_number) ?? ''].filter(Boolean),
          presenter: { title: (norm(r.invoice_number) ?? undefined) ?? 'Factura', subtitle: `USD ${r.total_usd}`, icon: 'file-text', badge: INVOICE_STATUS[String(r.status)] ?? String(r.status) },
          links: [{ href: `/backend/agri-sales/invoices/${r.id}`, label: 'Ver factura', kind: 'primary' }],
          checksumSource: { invoice_number: r.invoice_number, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return { title: (norm(r.invoice_number) ?? undefined) ?? 'Factura', subtitle: INVOICE_STATUS[String(r.status)] ?? String(r.status), icon: 'file-text', badge: INVOICE_STATUS[String(r.status)] ?? String(r.status) }
      },
      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => `/backend/agri-sales/invoices/${ctx.record.id}`,
    },
  ],
}
export default searchConfig
export const config = searchConfig

import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', partial: 'Parcial', paid: 'Pagada',
  overdue: 'Vencida', cancelled: 'Cancelada',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // isp_billing.invoice — Facturas mensuales del ISP
    // Administradores buscan por número de factura o período.
    // =========================================================================
    {
      entityId: 'isp_billing.invoice',
      enabled: true,
      priority: 30,

      fieldPolicy: {
        searchable: ['invoice_number', 'period_month', 'status', 'control_number'],
        excluded: ['iva_rate', 'bcv_rate', 'total_ves', 'iva_amount_ves'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.invoice_number) lines.push(`Factura: ${r.invoice_number}`)
        if (r.period_month) lines.push(`Período: ${r.period_month}`)
        if (r.control_number) lines.push(`Control: ${r.control_number}`)
        if (!lines.length) return null

        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')

        return {
          text: lines,
          presenter: {
            title: norm(r.invoice_number) ?? 'Factura',
            subtitle: [norm(r.period_month), `USD ${r.total_usd}`].filter(Boolean).join(' · ') || undefined,
            icon: 'file-text',
            badge: statusLabel,
          },
          links: [{ href: `/backend/isp-billing/${r.id}`, label: 'Ver factura', kind: 'primary' }],
          checksumSource: { invoice_number: r.invoice_number, status: r.status, paid_amount_usd: r.paid_amount_usd, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: norm(r.invoice_number) ?? 'Factura',
          subtitle: norm(r.period_month) ?? undefined,
          icon: 'file-text',
          badge: statusLabel,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/isp-billing/${ctx.record.id}`,
    },
  ],
}

export default searchConfig
export const config = searchConfig

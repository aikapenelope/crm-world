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
  pending: 'Pendiente', confirmed: 'Confirmado', partial: 'Parcial',
  cancelled: 'Cancelado', refunded: 'Reembolsado',
}

const METHOD_LABELS: Record<string, string> = {
  transfer: 'Transferencia', zelle: 'Zelle', binance: 'Binance/USDT',
  cash_usd: 'Efectivo USD', mobile_payment: 'Pago móvil',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // academy_payments.payment — Pagos de inscripciones
    // Administradores buscan por número de pago o método.
    // =========================================================================
    {
      entityId: 'academy_payments.payment',
      enabled: true,
      priority: 25,

      fieldPolicy: {
        searchable: ['payment_number', 'payment_method', 'status'],
        excluded: ['amount', 'exchange_rate', 'amount_ves'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.payment_number) lines.push(`Pago: ${r.payment_number}`)
        if (r.payment_method) lines.push(METHOD_LABELS[String(r.payment_method)] ?? String(r.payment_method))
        if (r.status) lines.push(`Estado: ${STATUS_LABELS[String(r.status)] ?? String(r.status)}`)
        if (!lines.length) return null

        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')

        return {
          text: lines,
          presenter: {
            title: norm(r.payment_number) ?? 'Pago',
            subtitle: METHOD_LABELS[String(r.payment_method ?? '')] ?? norm(r.payment_method) ?? undefined,
            icon: 'dollar-sign',
            badge: statusLabel,
          },
          links: [{ href: '/backend/academy-payments', label: 'Ver pagos', kind: 'primary' }],
          checksumSource: {
            payment_number: r.payment_number,
            status: r.status,
            amount: r.amount,
            updated_at: r.updated_at,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: norm(r.payment_number) ?? 'Pago',
          subtitle: METHOD_LABELS[String(r.payment_method ?? '')] ?? undefined,
          icon: 'dollar-sign',
          badge: statusLabel,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> =>
        '/backend/academy-payments',
    },
  ],
}

export default searchConfig
export const config = searchConfig

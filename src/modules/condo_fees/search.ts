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
  pending: 'Pendiente',
  partial: 'Pago parcial',
  paid: 'Pagado',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // condo_fees.receipt — Recibos de condominio por unidad
    // Administradores buscan por unidad, propietario o número de recibo.
    // =========================================================================
    {
      entityId: 'condo_fees.condo_receipt',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: ['receipt_number', 'period_month', 'owner_name', 'unit_number', 'status'],
        // payment_reference puede contener referencias bancarias — hashOnly para
        // permitir búsqueda exacta sin exponer el valor en el índice fulltext.
        hashOnly: ['payment_reference'],
        excluded: ['exchange_rate', 'aliquot_percent'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.receipt_number) lines.push(`Recibo: ${r.receipt_number}`)
        if (r.owner_name) lines.push(`Propietario: ${r.owner_name}`)
        if (r.unit_number) lines.push(`Unidad: ${r.unit_number}`)
        if (r.period_month) lines.push(`Período: ${r.period_month}`)
        if (r.status) lines.push(`Estado: ${STATUS_LABELS[String(r.status)] ?? String(r.status)}`)
        if (!lines.length) return null

        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        const presenter: SearchResultPresenter = {
          title: (norm(r.receipt_number) ?? undefined) ?? 'Recibo',
          subtitle: [
            norm(r.owner_name),
            norm(r.unit_number) ? `Unidad ${r.unit_number}` : null,
            norm(r.period_month),
          ].filter(Boolean).join(' · ') || undefined,
          icon: 'receipt',
          badge: statusLabel,
        }

        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/condo_fees', label: 'Ver recibos', kind: 'primary' }],
          checksumSource: {
            receipt_number: r.receipt_number,
            owner_name: r.owner_name,
            unit_number: r.unit_number,
            status: r.status,
            paid_amount: r.paid_amount,
            updated_at: r.updated_at,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: (norm(r.receipt_number) ?? undefined) ?? 'Recibo',
          subtitle: [norm(r.owner_name), norm(r.unit_number) ? `Unidad ${r.unit_number}` : null]
            .filter(Boolean).join(' · ') || undefined,
          icon: 'receipt',
          badge: statusLabel,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/condo_fees'
      },
    },

    // =========================================================================
    // condo_fees.config — Configuración de cuotas por edificio/período
    // =========================================================================
    {
      entityId: 'condo_fees.condo_fee_config',
      enabled: true,
      priority: 10,

      fieldPolicy: {
        searchable: ['name', 'period_month', 'fee_type', 'status'],
        excluded: ['base_amount', 'late_fee_percent', 'late_fee_days'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(`Cuota: ${r.name}`)
        if (r.period_month) lines.push(`Período: ${r.period_month}`)
        if (r.fee_type) lines.push(`Tipo: ${r.fee_type}`)
        if (!lines.length) return null

        return {
          text: lines,
          presenter: {
            title: (norm(r.name) ?? undefined) ?? 'Configuración de cuota',
            subtitle: (norm(r.period_month) ?? undefined) ?? undefined,
            icon: 'settings',
            badge: String(r.fee_type ?? ''),
          },
          links: [{ href: '/backend/condo_fees', label: 'Ver cuotas', kind: 'primary' }],
          checksumSource: { name: r.name, period_month: r.period_month, status: r.status, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name) ?? undefined) ?? 'Configuración de cuota',
          subtitle: (norm(r.period_month) ?? undefined) ?? undefined,
          icon: 'settings',
          badge: String(r.fee_type ?? ''),
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/condo_fees'
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig

import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
  SearchResultLink,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

// Searches tuition_charges by student_id and period

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'tuition:charge',
      enabled: true,
      priority: 12,

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.student_name) lines.push(`Estudiante: ${r.student_name}`)
        if (r.period_month) lines.push(`Período: ${r.period_month}`)
        if (r.charge_type) lines.push(`Tipo: ${r.charge_type}`)
        if (r.amount) lines.push(`Monto: ${r.currency} ${r.amount}`)
        if (r.status) lines.push(`Estado: ${r.status}`)
        if (!lines.length) return null

        const STATUS_LABELS: Record<string, string> = {
          pending: 'Pendiente', paid: 'Pagado', overdue: 'Vencido', waived: 'Condonado',
        }

        const presenter: SearchResultPresenter = {
          title: norm(r.student_name) ?? `Cargo ${r.period_month}`,
          subtitle: [norm(r.period_month), r.amount ? `${r.currency} ${r.amount}` : null].filter(Boolean).join(' · ') || undefined,
          icon: 'credit-card',
          badge: STATUS_LABELS[String(r.status)] ?? undefined,
        }

        return {
          text: lines,
          presenter,
          links: [{ href: `/backend/tuition`, label: 'Ver cobros', kind: 'primary' }],
          checksumSource: { student_name: r.student_name, period_month: r.period_month, status: r.status, amount: r.amount },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: norm(r.student_name) ?? `Cargo ${r.period_month}`,
          subtitle: norm(r.period_month) ?? undefined,
          icon: 'credit-card',
          badge: norm(r.status) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return `/backend/tuition`
      },

      resolveLinks: async (_ctx: SearchBuildContext): Promise<SearchResultLink[] | null> => {
        return [{ href: `/backend/tuition`, label: 'Ver mensualidades', kind: 'secondary' }]
      },

      fieldPolicy: {
        searchable: ['student_name', 'period_month', 'charge_type', 'status'],
        hashOnly: ['amount'],
        excluded: ['notes'],
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig

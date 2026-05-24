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

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // bank_reconciliation.statement — Extractos bancarios cargados
    // Contadores buscan por banco o período para ubicar una conciliación.
    // =========================================================================
    {
      entityId: 'bank_reconciliation.statement',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: ['bank_name', 'bank_code', 'period_month', 'filename'],
        excluded: [],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.bank_name) lines.push(String(r.bank_name))
        if (r.period_month) lines.push(`Período: ${r.period_month}`)
        if (r.filename) lines.push(String(r.filename))
        if (!lines.length) return null

        return {
          text: lines,
          presenter: {
            title: (norm(r.bank_name) as string | undefined) ?? 'Extracto bancario',
            subtitle: (norm(r.period_month) as string | undefined) ?? undefined,
            icon: 'landmark',
            badge: (norm(r.period_month) as string | undefined) ?? undefined,
          },
          links: [{ href: '/backend/bank-reconciliation', label: 'Ver conciliación', kind: 'primary' }],
          checksumSource: {
            bank_name: r.bank_name,
            period_month: r.period_month,
            filename: r.filename,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.bank_name) as string | undefined) ?? 'Extracto bancario',
          subtitle: (norm(r.period_month) as string | undefined) ?? undefined,
          icon: 'landmark',
          badge: (norm(r.period_month) as string | undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> =>
        '/backend/bank-reconciliation',
    },
  ],
}

export default searchConfig
export const config = searchConfig

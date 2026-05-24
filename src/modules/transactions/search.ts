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
    {
      entityId: 'transactions.transaction',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: ['transaction_type', 'status', 'currency'],
        excluded: ['sale_price', 'sale_price_ves', 'exchange_rate', 'commission_rate', 'commission_amount'],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.transaction_type) lines.push(String(r.transaction_type))
        if (r.status) lines.push(String(r.status))
        if (r.currency) lines.push(String(r.currency))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.transaction_type) as string | undefined) ?? 'Transaction Type',
          subtitle: ((norm(r.status) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'handshake',
          badge: (norm(r.status) as string | undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/transactions', label: 'Ver transacciones', kind: 'primary' }],
          checksumSource: { transaction_type: r.transaction_type, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.transaction_type) as string | undefined) ?? 'Transaction Type',
          subtitle: (norm(r.status) as string | undefined) ?? undefined,
          icon: 'handshake',
          badge: (norm(r.status) as string | undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/transactions'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

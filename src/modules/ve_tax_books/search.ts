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

// =========================================================================
// ve_tax_books.entry — Entradas en libros de compras/ventas IVA
// Contadores buscan por número de documento o nombre del proveedor/cliente.
// El RIF se indexa como hashOnly para lookup exacto sin exposición en fulltext.
// =========================================================================
export const searchConfig: SearchModuleConfig = {
  entities: [{
    entityId: 've_tax_books.entry',
    enabled: true,
    priority: 20,
    fieldPolicy: {
      searchable: ['document_number', 'counterpart_name', 'period_month', 'book_type'],
      hashOnly: ['counterpart_rif'],
      excluded: ['taxable_base', 'iva_amount', 'total_amount'],
    },
    buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
      const r = ctx.record
      const lines: string[] = []
      if (r.document_number) lines.push(`Doc: ${r.document_number}`)
      if (r.counterpart_name) lines.push(String(r.counterpart_name))
      if (r.period_month) lines.push(`Período: ${r.period_month}`)
      if (!lines.length) return null
      return {
        text: lines,
        presenter: {
          title: norm(r.document_number) ?? 'Entrada fiscal',
          subtitle: [norm(r.counterpart_name), norm(r.period_month)].filter(Boolean).join(' · ') || undefined,
          icon: 'book-open',
          badge: norm(r.book_type) ?? undefined,
        },
        links: [{ href: '/backend/ve-tax-books', label: 'Ver libro fiscal', kind: 'primary' }],
        checksumSource: {
          document_number: r.document_number,
          counterpart_name: r.counterpart_name,
          period_month: r.period_month,
          total_amount: r.total_amount,
        },
      }
    },
    formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
      const r = ctx.record
      return {
        title: norm(r.document_number) ?? 'Entrada fiscal',
        subtitle: norm(r.counterpart_name) ?? undefined,
        icon: 'book-open',
      }
    },
    resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => '/backend/ve-tax-books',
  }],
}

export default searchConfig
export const config = searchConfig

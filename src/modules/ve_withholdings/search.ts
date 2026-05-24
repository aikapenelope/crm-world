import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { if (v == null) return null; const s = String(v).trim(); return s.length > 0 ? s : null }

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 've_withholdings.record',
      enabled: true,
      priority: 15,
      fieldPolicy: {
        searchable: ['supplier_name', 'period_month', 'invoice_number'],
        // RIF es un identificador fiscal — hashOnly para búsqueda exacta sin exponer en fulltext
        hashOnly: ['supplier_rif'],
        excluded: ['invoice_amount', 'tax_amount', 'withholding_amount', 'withholding_rate'],
      },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.supplier_name) lines.push(`Proveedor: ${r.supplier_name}`)
        if (r.invoice_number) lines.push(`Factura: ${r.invoice_number}`)
        if (r.period_month) lines.push(`Período: ${r.period_month}`)
        if (!lines.length) return null
        return { text: lines, presenter: { title: (norm(r.supplier_name) ?? undefined) ?? 'Retención', subtitle: (norm(r.period_month) ?? undefined) ?? undefined, icon: 'file-text', badge: (norm(r.period_month) ?? undefined) ?? undefined }, links: [{ href: '/backend/ve_withholdings', label: 'Ver retenciones', kind: 'primary' }], checksumSource: { supplier_name: r.supplier_name, invoice_number: r.invoice_number, period_month: r.period_month } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => ({ title: norm(ctx.record.supplier_name) ?? 'Retención', subtitle: norm(ctx.record.invoice_number) ?? undefined, icon: 'file-text' }),
      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => '/backend/ve_withholdings',
    },
  ],
}
export default searchConfig
export const config = searchConfig

import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { if (v == null) return null; const s = String(v).trim(); return s.length > 0 ? s : null }

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'auto_estimates.estimate',
      enabled: true,
      priority: 20,
      fieldPolicy: { searchable: ['estimate_number', 'status'], excluded: ['total_amount', 'subtotal', 'tax_amount'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.estimate_number) return null
        const lines = [String(r.estimate_number)]
        if (r.status) lines.push(String(r.status))
        return { text: lines, presenter: { title: (norm(r.estimate_number) as string | undefined) ?? 'Presupuesto', subtitle: (norm(r.status) as string | undefined) ?? undefined, icon: 'file-text', badge: (norm(r.status) as string | undefined) ?? undefined }, links: [{ href: '/backend/auto_estimates', label: 'Ver presupuestos', kind: 'primary' }], checksumSource: { estimate_number: r.estimate_number, status: r.status, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => ({ title: norm(ctx.record.estimate_number) ?? 'Presupuesto', subtitle: norm(ctx.record.status) ?? undefined, icon: 'file-text' }),
      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => '/backend/auto_estimates',
    },
  ],
}
export default searchConfig
export const config = searchConfig

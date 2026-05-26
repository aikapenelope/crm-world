import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { const s = String(v ?? '').trim(); return s.length > 0 ? s : null }
export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_floor.mfg_shift_report',
      enabled: true,
      priority: 35,
      fieldPolicy: { searchable: ['report_number', 'shift_type', 'shift_date', 'work_center_name'], excluded: ['tenant_id', 'organization_id', 'work_center_id', 'supervisor_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record; if (!r.report_number) return null
        return { text: [norm(r.report_number) ?? '', norm(r.work_center_name) ?? ''].filter(Boolean), presenter: { title: (norm(r.report_number) ?? undefined) ?? 'Turno', subtitle: `OEE: ${r.oee_total_pct}% total / ${r.oee_internal_pct}% interno`, icon: 'activity', badge: r.shift_type as string | undefined }, links: [{ href: '/backend/mfg-floor', label: 'Ver dashboard', kind: 'primary' }], checksumSource: { report_number: r.report_number, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => { const r = ctx.record; return { title: (norm(r.report_number) ?? undefined) ?? 'Turno', subtitle: (norm(r.work_center_name) ?? undefined) ?? undefined, icon: 'activity', badge: r.shift_type as string | undefined } },
      resolveUrl: async (): Promise<string | null> => '/backend/mfg-floor',
    },
  ],
}
export default searchConfig
export const config = searchConfig

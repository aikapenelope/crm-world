import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { const s = String(v ?? '').trim(); return s.length > 0 ? s : null }
const OUTAGE_TYPE: Record<string, string> = { scheduled_restriction: 'Restricción programada', unscheduled_cut: 'Corte no programado', voltage_fluctuation: 'Fluctuación', complete_blackout: 'Apagón total' }
export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_energy.power_outage',
      enabled: true, priority: 35,
      fieldPolicy: { searchable: ['outage_type', 'zone', 'products_affected'], excluded: ['tenant_id', 'organization_id', 'reported_by'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        return { text: [OUTAGE_TYPE[String(r.outage_type ?? '')] ?? String(r.outage_type ?? ''), norm(r.zone as string) ?? ''].filter(Boolean), presenter: { title: `Corte ${new Date(r.started_at).toLocaleDateString('es-VE')}`, subtitle: `${OUTAGE_TYPE[String(r.outage_type ?? '')] ?? ''} · ${r.duration_hrs ? `${r.duration_hrs}h` : 'en curso'}`, icon: 'zap-off', badge: r.ended_at ? 'Terminado' : 'Activo' }, links: [{ href: '/backend/mfg-energy', label: 'Ver energía', kind: 'primary' }], checksumSource: { started_at: r.started_at, ended_at: r.ended_at, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => { const r = ctx.record; return { title: `Corte ${new Date(r.started_at).toLocaleDateString('es-VE')}`, subtitle: (norm(r.zone as string) as string | undefined) ?? undefined, icon: 'zap-off', badge: r.ended_at ? 'Terminado' : 'Activo' } },
      resolveUrl: async (): Promise<string | null> => '/backend/mfg-energy',
    },
  ],
}
export default searchConfig
export const config = searchConfig

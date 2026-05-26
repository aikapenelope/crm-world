import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { const s = String(v ?? '').trim(); return s.length > 0 ? s : null }
export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_maintenance.mfg_equipment',
      enabled: true, priority: 45,
      fieldPolicy: { searchable: ['equipment_code', 'name', 'brand', 'model', 'serial_number', 'status', 'criticality'], excluded: ['tenant_id', 'organization_id', 'work_center_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record; if (!r.equipment_code) return null
        return { text: [norm(r.equipment_code) ?? '', norm(r.name) ?? ''].filter(Boolean), presenter: { title: `${norm(r.equipment_code)} — ${norm(r.name) ?? ''}`, subtitle: `${r.brand ?? ''} ${r.model ?? ''} · ${r.criticality}`, icon: 'tool', badge: r.status as string | undefined }, links: [{ href: `/backend/mfg-maintenance/${r.id}`, label: 'Ver equipo', kind: 'primary' }], checksumSource: { equipment_code: r.equipment_code, status: r.status, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => { const r = ctx.record; return { title: `${norm(r.equipment_code)} — ${norm(r.name) ?? ''}`, subtitle: (norm(r.work_center_name) ?? undefined) ?? undefined, icon: 'tool', badge: r.status as string | undefined } },
      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => `/backend/mfg-maintenance/${ctx.record.id}`,
    },
    {
      entityId: 'mfg_maintenance.mfg_spare_part',
      enabled: true, priority: 40,
      fieldPolicy: { searchable: ['part_code', 'part_name', 'supplier_name'], excluded: ['tenant_id', 'organization_id', 'supplier_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record; if (!r.part_code) return null
        const atRisk = Number(r.current_stock) <= Number(r.reorder_point)
        return { text: [norm(r.part_code) ?? '', norm(r.part_name) ?? ''].filter(Boolean), presenter: { title: `${norm(r.part_code)} — ${norm(r.part_name) ?? ''}`, subtitle: `Stock: ${r.current_stock} ${r.uom} | Reorden: ${r.reorder_point}`, icon: 'package', badge: atRisk ? 'Bajo mínimo' : 'OK' }, links: [{ href: '/backend/mfg-maintenance', label: 'Ver mantenimiento', kind: 'primary' }], checksumSource: { part_code: r.part_code, current_stock: r.current_stock, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => { const r = ctx.record; return { title: (norm(r.part_code) ?? undefined) ?? 'Repuesto', subtitle: (norm(r.part_name) ?? undefined) ?? undefined, icon: 'package', badge: Number(r.current_stock) <= Number(r.reorder_point) ? 'Bajo mínimo' : 'OK' } },
      resolveUrl: async (): Promise<string | null> => '/backend/mfg-maintenance',
    },
  ],
}
export default searchConfig
export const config = searchConfig

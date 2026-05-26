import type { SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter } from '@open-mercato/shared/modules/search'
function norm(v: unknown): string | null { const s = String(v ?? '').trim(); return s.length > 0 ? s : null }
export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_hr:mfg_worker',
      enabled: true, priority: 40,
      fieldPolicy: { searchable: ['employee_code', 'full_name', 'cedula', 'shift_type'], excluded: ['tenant_id', 'organization_id', 'work_center_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record; if (!r.full_name) return null
        return { text: [norm(r.full_name) ?? '', norm(r.employee_code) ?? ''].filter(Boolean), presenter: { title: `${norm(r.employee_code)} — ${norm(r.full_name) ?? ''}`, subtitle: `${r.shift_type} · ${r.work_center_name ?? ''}`, icon: 'user', badge: r.is_active ? 'Activo' : 'Inactivo' }, links: [{ href: '/backend/mfg-hr', label: 'Ver RRHH', kind: 'primary' }], checksumSource: { full_name: r.full_name, shift_type: r.shift_type, updated_at: r.updated_at } }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => { const r = ctx.record; return { title: (norm(r.full_name) ?? undefined) ?? 'Operario', subtitle: (norm(r.employee_code) ?? undefined) ?? undefined, icon: 'user', badge: r.shift_type as string | undefined } },
      resolveUrl: async (): Promise<string | null> => '/backend/mfg-hr',
    },
  ],
}
export default searchConfig
export const config = searchConfig

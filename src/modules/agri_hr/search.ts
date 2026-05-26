import type {
  SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const EMP_TYPE: Record<string, string> = { fixed: 'Fijo', jornalero: 'Jornalero', destajero: 'Destajero' }
const SETTLE_STATUS: Record<string, string> = { calculated: 'Calculada', approved: 'Aprobada', paid: 'Pagada' }

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'agri_hr.agri_employee',
      enabled: true, priority: 20,
      fieldPolicy: { searchable: ['first_name', 'last_name', 'cedula', 'department', 'position', 'employee_type'], excluded: ['tenant_id', 'organization_id', 'bank_account'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const fullName = [norm(r.first_name), norm(r.last_name)].filter(Boolean).join(' ')
        if (!fullName) return null
        const typeLabel = EMP_TYPE[String(r.employee_type ?? '')] ?? String(r.employee_type ?? '')
        return {
          text: [fullName, norm(r.cedula) ?? '', typeLabel].filter(Boolean),
          presenter: { title: fullName, subtitle: [norm(r.position), typeLabel].filter(Boolean).join(' · '), icon: 'user', badge: r.status as string | undefined === 'active' ? 'Activo' : 'Inactivo' },
          links: [{ href: `/backend/agri-hr`, label: 'Ver personal', kind: 'primary' }],
          checksumSource: { first_name: r.first_name, last_name: r.last_name, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const fullName = [norm(r.first_name), norm(r.last_name)].filter(Boolean).join(' ')
        return { title: fullName, subtitle: EMP_TYPE[String(r.employee_type ?? '')] ?? String(r.employee_type ?? ''), icon: 'user', badge: r.status as string | undefined === 'active' ? 'Activo' : 'Inactivo' }
      },
      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => `/backend/agri-hr`,
    },
    {
      entityId: 'agri_hr.agri_producer_settlement',
      enabled: true, priority: 20,
      fieldPolicy: { searchable: ['status', 'actual_fca', 'actual_mortality_pct'], excluded: ['tenant_id', 'organization_id', 'producer_id', 'approved_by'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const statusLabel = SETTLE_STATUS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          text: [`FCA: ${r.actual_fca}`, `USD ${r.total_payment_usd}`].filter(Boolean),
          presenter: { title: `Liquidación · Ciclo ${new Date(r.cycle_end_date as string).toLocaleDateString()}`, subtitle: `USD ${r.total_payment_usd}`, icon: 'file-text', badge: statusLabel },
          links: [{ href: `/backend/agri-hr/settlements`, label: 'Ver liquidación', kind: 'primary' }],
          checksumSource: { status: r.status, total_payment_usd: r.total_payment_usd, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return { title: 'Liquidación productor', subtitle: `USD ${r.total_payment_usd}`, icon: 'file-text', badge: SETTLE_STATUS[String(r.status ?? '')] ?? String(r.status ?? '') }
      },
      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => `/backend/agri-hr/settlements`,
    },
  ],
}
export default searchConfig
export const config = searchConfig

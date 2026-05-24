import type {
  SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const UNIT_TYPE: Record<string, string> = {
  chill_room: 'Cuarto frío', freezer: 'Congelador',
  refrigerator: 'Refrigerador', reefer_truck: 'Camión frío',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'agri_cold_chain.storage_unit',
      enabled: true,
      priority: 25,
      fieldPolicy: { searchable: ['name', 'unit_type', 'status', 'sensor_id'], excluded: ['tenant_id', 'organization_id', 'alert_contact_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.name) return null
        const typeLabel = UNIT_TYPE[String(r.unit_type ?? '')] ?? String(r.unit_type ?? '')
        return {
          text: [norm(r.name as string) ?? '', typeLabel].filter(Boolean),
          presenter: { title: (norm(r.name as string) as string | undefined) ?? 'Cuarto frío', subtitle: `${typeLabel} · ${r.target_temp_min}°C a ${r.target_temp_max}°C`, icon: 'thermometer', badge: r.status === 'active' ? 'Activo' : 'Inactivo' },
          links: [{ href: `/backend/agri-cold-chain`, label: 'Ver cadena de frío', kind: 'primary' }],
          checksumSource: { name: r.name, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return { title: (norm(r.name as string) as string | undefined) ?? 'Cuarto frío', subtitle: UNIT_TYPE[String(r.unit_type ?? '')] ?? String(r.unit_type ?? ''), icon: 'thermometer', badge: r.status === 'active' ? 'Activo' : 'Inactivo' }
      },
      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => `/backend/agri-cold-chain`,
    },
  ],
}
export default searchConfig
export const config = searchConfig

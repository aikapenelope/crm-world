import type {
  SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const CROP_TYPE: Record<string, string> = {
  maize: 'Maíz', soybean: 'Soya', sorghum: 'Sorgo', sunflower: 'Girasol', other: 'Otro',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'agri_field.plot',
      enabled: true, priority: 20,
      fieldPolicy: { searchable: ['name', 'soil_type', 'irrigation_system', 'status'], excluded: ['tenant_id', 'organization_id', 'farm_unit_id', 'location_gps'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.name) return null
        return {
          text: [norm(r.name as string) ?? ''],
          presenter: { title: (norm(r.name as string) as string | undefined) ?? 'Parcela', subtitle: `${r.area_hectares} ha`, icon: 'map', badge: r.status === 'active' ? 'Activa' : 'Inactiva' },
          links: [{ href: `/backend/agri-field`, label: 'Ver campo', kind: 'primary' }],
          checksumSource: { name: r.name, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return { title: (norm(r.name as string) as string | undefined) ?? 'Parcela', subtitle: `${r.area_hectares} ha`, icon: 'map', badge: r.status === 'active' ? 'Activa' : 'Inactiva' }
      },
      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => `/backend/agri-field`,
    },
    {
      entityId: 'agri_field.cycle',
      enabled: true, priority: 20,
      fieldPolicy: { searchable: ['crop_type', 'crop_variety', 'status', 'destination'], excluded: ['tenant_id', 'organization_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const cropLabel = CROP_TYPE[String(r.crop_type ?? '')] ?? String(r.crop_type ?? '')
        return {
          text: [cropLabel, norm(r.crop_variety as string) ?? ''].filter(Boolean),
          presenter: { title: `${cropLabel}${r.crop_variety ? ` (${r.crop_variety})` : ''}`, subtitle: new Date(r.planting_date as string).toLocaleDateString(), icon: 'sprout', badge: r.status === 'harvested' ? 'Cosechado' : r.status === 'active' ? 'Activo' : String(r.status) },
          links: [{ href: `/backend/agri-field`, label: 'Ver campo', kind: 'primary' }],
          checksumSource: { crop_type: r.crop_type, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const cropLabel = CROP_TYPE[String(r.crop_type ?? '')] ?? String(r.crop_type ?? '')
        return { title: cropLabel, icon: 'sprout', badge: String(r.status) }
      },
      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => `/backend/agri-field`,
    },
  ],
}
export default searchConfig
export const config = searchConfig

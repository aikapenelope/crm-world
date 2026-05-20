import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
  SearchResultLink,
} from '@open-mercato/shared/modules/search'

// Searches condo_buildings (buildings) and condo_units (units)

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'condo_properties:building',
      enabled: true,
      priority: 15,

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(`Edificio: ${r.name}`)
        if (r.code) lines.push(`Código: ${r.code}`)
        if (r.building_type) lines.push(`Tipo: ${r.building_type}`)
        if (r.city) lines.push(`Ciudad: ${r.city}`)
        if (r.state) lines.push(`Estado: ${r.state}`)
        if (r.admin_company) lines.push(`Administradora: ${r.admin_company}`)
        if (r.rif) lines.push(`RIF: ${r.rif}`)
        if (r.address) lines.push(`Dirección: ${r.address}`)
        if (!lines.length) return null

        const subtitle = [norm(r.city), norm(r.building_type), r.total_units ? `${r.total_units} unidades` : null]
          .filter(Boolean).join(' · ')

        const presenter: SearchResultPresenter = {
          title: String(r.name ?? 'Edificio'),
          subtitle: subtitle || undefined,
          icon: 'building-2',
          badge: String(r.building_type ?? ''),
        }

        const links: SearchResultLink[] = r.id
          ? [{ href: `/backend/condo_properties`, label: 'Ver edificios', kind: 'primary' }]
          : []

        return {
          text: lines,
          presenter,
          links,
          checksumSource: { name: r.name, city: r.city, total_units: r.total_units, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const subtitle = [norm(r.city), norm(r.building_type)].filter(Boolean).join(' · ')
        return {
          title: String(r.name ?? 'Edificio'),
          subtitle: subtitle || undefined,
          icon: 'building-2',
          badge: norm(r.building_type) ?? undefined,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => {
        return `/backend/condo_properties`
      },

      resolveLinks: async (ctx: SearchBuildContext): Promise<SearchResultLink[] | null> => {
        return [{ href: `/backend/condo_properties/units`, label: 'Ver unidades', kind: 'secondary' }]
      },

      fieldPolicy: {
        searchable: ['name', 'code', 'building_type', 'city', 'state', 'admin_company', 'rif', 'address'],
        hashOnly: [],
        excluded: ['metadata', 'common_areas'],
      },
    },

    {
      entityId: 'condo_properties:unit',
      enabled: true,
      priority: 12,

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.unit_number) lines.push(`Unidad: ${r.unit_number}`)
        if (r.unit_type) lines.push(`Tipo: ${r.unit_type}`)
        if (r.floor) lines.push(`Piso: ${r.floor}`)
        if (r.owner_name) lines.push(`Propietario: ${r.owner_name}`)
        if (r.owner_phone) lines.push(`Teléfono: ${r.owner_phone}`)
        if (r.owner_email) lines.push(`Email: ${r.owner_email}`)
        if (r.resident_name) lines.push(`Residente: ${r.resident_name}`)
        if (!lines.length) return null

        const presenter: SearchResultPresenter = {
          title: `Unidad ${r.unit_number}`,
          subtitle: [norm(r.owner_name), norm(r.unit_type)].filter(Boolean).join(' · ') || undefined,
          icon: 'home',
          badge: norm(r.status) ?? undefined,
        }

        return {
          text: lines,
          presenter,
          links: [{ href: `/backend/condo_properties/units`, label: 'Ver unidades', kind: 'primary' }],
          checksumSource: { unit_number: r.unit_number, owner_name: r.owner_name, status: r.status, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: `Unidad ${r.unit_number}`,
          subtitle: norm(r.owner_name) ?? undefined,
          icon: 'home',
          badge: norm(r.status) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return `/backend/condo_properties/units`
      },

      resolveLinks: async (_ctx: SearchBuildContext): Promise<SearchResultLink[] | null> => {
        return [{ href: `/backend/condo_properties/units`, label: 'Ver unidades', kind: 'secondary' }]
      },

      fieldPolicy: {
        searchable: ['unit_number', 'unit_type', 'floor', 'owner_name', 'owner_phone', 'owner_email', 'resident_name'],
        hashOnly: ['aliquot_percent'],
        excluded: ['notes'],
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig

import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
  SearchResultLink,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'auto_vehicles:auto_vehicle',
      enabled: true,
      priority: 20,

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.plate) lines.push(`Placa: ${r.plate}`)
        if (r.brand) lines.push(`Marca: ${r.brand}`)
        if (r.model) lines.push(`Modelo: ${r.model}`)
        if (r.year) lines.push(`Año: ${r.year}`)
        if (r.color) lines.push(`Color: ${r.color}`)
        if (r.vin) lines.push(`VIN: ${r.vin}`)
        if (r.owner_name) lines.push(`Propietario: ${r.owner_name}`)
        if (r.owner_phone) lines.push(`Teléfono: ${r.owner_phone}`)
        if (r.engine_type) lines.push(`Motor: ${r.engine_type}`)
        if (!lines.length) return null

        const title = [norm(r.brand), norm(r.model), norm(r.year)].filter(Boolean).join(' ')
        const subtitle = [norm(r.plate), norm(r.owner_name), norm(r.color)].filter(Boolean).join(' · ')

        const presenter: SearchResultPresenter = {
          title: title || 'Vehículo',
          subtitle: subtitle || undefined,
          icon: 'car',
          badge: (norm(r.plate) ?? undefined) ?? undefined,
        }

        return {
          text: lines,
          presenter,
          links: [{ href: `/backend/auto_vehicles`, label: 'Ver vehículos', kind: 'primary' }],
          checksumSource: { plate: r.plate, brand: r.brand, model: r.model, owner_name: r.owner_name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const title = [norm(r.brand), norm(r.model), norm(r.year)].filter(Boolean).join(' ')
        return {
          title: title || 'Vehículo',
          subtitle: [norm(r.plate), norm(r.owner_name)].filter(Boolean).join(' · ') || undefined,
          icon: 'car',
          badge: (norm(r.plate) ?? undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return `/backend/auto_vehicles`
      },

      resolveLinks: async (_ctx: SearchBuildContext): Promise<SearchResultLink[] | null> => {
        return [{ href: `/backend/auto_service_orders`, label: 'Órdenes', kind: 'secondary' }]
      },

      fieldPolicy: {
        searchable: ['plate', 'brand', 'model', 'year', 'color', 'vin', 'owner_name', 'owner_phone', 'engine_type'],
        hashOnly: ['mileage'],
        excluded: ['notes'],
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig

import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
  SearchResultLink,
} from '@open-mercato/shared/modules/search'

// =============================================================================
// Helpers
// =============================================================================

function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

function appendLine(lines: string[], label: string, value: unknown) {
  const text = normalizeText(value)
  if (!text) return
  lines.push(`${label}: ${text}`)
}

function formatPrice(price: unknown, currency: unknown): string | null {
  const p = normalizeText(price)
  const c = normalizeText(currency)
  if (!p) return null
  return c ? `${c} ${p}` : p
}

function translateType(type: unknown): string {
  const map: Record<string, string> = {
    apartamento: 'Apartamento',
    casa: 'Casa',
    terreno: 'Terreno',
    comercial: 'Local Comercial',
    oficina: 'Oficina',
    galpon: 'Galpón',
    otro: 'Otro',
  }
  return map[String(type)] ?? String(type)
}

function translateOperation(op: unknown): string {
  const map: Record<string, string> = {
    venta: 'Venta',
    alquiler: 'Alquiler',
    venta_alquiler: 'Venta/Alquiler',
  }
  return map[String(op)] ?? String(op)
}

function translateStatus(status: unknown): string {
  const map: Record<string, string> = {
    draft: 'Borrador',
    active: 'Activa',
    reserved: 'Reservada',
    sold: 'Vendida',
    rented: 'Alquilada',
    inactive: 'Inactiva',
  }
  return map[String(status)] ?? String(status)
}

// =============================================================================
// Search Module Configuration
// =============================================================================

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'properties:property',
      enabled: true,
      priority: 10,

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const record = ctx.record
        const lines: string[] = []

        appendLine(lines, 'Título', record.title)
        appendLine(lines, 'Descripción', record.description)
        appendLine(lines, 'Tipo', translateType(record.property_type))
        appendLine(lines, 'Operación', translateOperation(record.operation))
        appendLine(lines, 'Estado', translateStatus(record.status))
        appendLine(lines, 'Precio', formatPrice(record.price, record.currency))
        appendLine(lines, 'Ciudad', record.city)
        appendLine(lines, 'Estado/Provincia', record.state)
        appendLine(lines, 'Dirección', record.address_line)

        if (record.area_m2) appendLine(lines, 'Área', `${record.area_m2} m²`)
        if (record.bedrooms) appendLine(lines, 'Habitaciones', record.bedrooms)
        if (record.bathrooms) appendLine(lines, 'Baños', record.bathrooms)
        if (record.parking) appendLine(lines, 'Estacionamientos', record.parking)

        if (!lines.length) return null

        const subtitleParts: string[] = []
        const typeLabel = translateType(record.property_type)
        if (typeLabel) subtitleParts.push(typeLabel)
        const city = normalizeText(record.city)
        if (city) subtitleParts.push(city)
        const price = formatPrice(record.price, record.currency)
        if (price) subtitleParts.push(price)

        const presenter: SearchResultPresenter = {
          title: String(record.title ?? 'Propiedad'),
          subtitle: subtitleParts.length ? subtitleParts.join(' · ') : undefined,
          icon: 'building-2',
          badge: translateOperation(record.operation),
        }

        const links: SearchResultLink[] = []
        if (record.id) {
          links.push({
            href: `/backend/properties/${encodeURIComponent(String(record.id))}`,
            label: String(record.title ?? 'Ver propiedad'),
            kind: 'primary',
          })
        }

        return {
          text: lines,
          presenter,
          links,
          checksumSource: {
            title: record.title,
            description: record.description,
            property_type: record.property_type,
            operation: record.operation,
            status: record.status,
            price: record.price,
            city: record.city,
            updated_at: record.updated_at,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const record = ctx.record
        const subtitleParts: string[] = []
        const typeLabel = translateType(record.property_type)
        if (typeLabel) subtitleParts.push(typeLabel)
        const city = normalizeText(record.city)
        if (city) subtitleParts.push(city)
        const price = formatPrice(record.price, record.currency)
        if (price) subtitleParts.push(price)

        return {
          title: String(record.title ?? 'Propiedad'),
          subtitle: subtitleParts.length ? subtitleParts.join(' · ') : undefined,
          icon: 'building-2',
          badge: translateOperation(record.operation),
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => {
        const id = ctx.record.id
        if (!id) return null
        return `/backend/properties/${encodeURIComponent(String(id))}`
      },

      resolveLinks: async (ctx: SearchBuildContext): Promise<SearchResultLink[] | null> => {
        const id = ctx.record.id
        if (!id) return null
        return [
          {
            href: `/backend/properties/${encodeURIComponent(String(id))}`,
            label: 'Editar',
            kind: 'secondary',
          },
        ]
      },

      fieldPolicy: {
        searchable: [
          'title',
          'description',
          'property_type',
          'operation',
          'status',
          'city',
          'state',
          'address_line',
        ],
        hashOnly: [],
        excluded: ['latitude', 'longitude', 'notes'],
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig

import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

// =========================================================================
// mercadolibre_sync.listing — Listados de MercadoLibre Venezuela
// Agentes buscan propiedades del mercado por ciudad o tipo.
// =========================================================================
export const searchConfig: SearchModuleConfig = {
  entities: [{
    entityId: 'mercadolibre_sync.listing',
    enabled: true,
    priority: 10,
    fieldPolicy: {
      searchable: ['title', 'city', 'operation', 'property_type'],
      excluded: ['price', 'price_usd', 'latitude', 'longitude', 'seller_id'],
    },
    buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
      const r = ctx.record
      const lines: string[] = []
      if (r.title) lines.push(String(r.title))
      if (r.city) lines.push(`Ciudad: ${r.city}`)
      if (r.operation) lines.push(String(r.operation))
      if (!lines.length) return null
      const subtitle = [norm(r.city as string), norm(r.operation as string), norm(r.property_type as string)].filter(Boolean).join(' · ')
      return {
        text: lines,
        presenter: {
          title: norm(r.title)?.slice(0, 60) ?? 'Listado ML',
          subtitle: subtitle || undefined,
          icon: 'home',
          badge: (norm(r.operation as string) as string | undefined) ?? undefined,
        },
        links: [{ href: '/backend/market-intelligence', label: 'Ver inteligencia de mercado', kind: 'primary' }],
        checksumSource: { ml_id: r.ml_id, title: r.title, price: r.price, synced_at: r.synced_at },
      }
    },
    formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
      const r = ctx.record
      return {
        title: norm(r.title)?.slice(0, 60) ?? 'Listado ML',
        subtitle: [norm(r.city as string), norm(r.operation as string)].filter(Boolean).join(' · ') || undefined,
        icon: 'home',
        badge: (norm(r.operation as string) as string | undefined) ?? undefined,
      }
    },
    resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => '/backend/market-intelligence',
  }],
}

export default searchConfig
export const config = searchConfig

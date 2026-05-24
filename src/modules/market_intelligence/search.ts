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

const OPERATION_LABELS: Record<string, string> = {
  venta: 'Venta', alquiler: 'Alquiler',
}

const TYPE_LABELS: Record<string, string> = {
  apartamento: 'Apartamento', casa: 'Casa',
  oficina: 'Oficina', comercial: 'Local Comercial',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // market_intelligence.analysis — Análisis de inteligencia de mercado
    // Agentes buscan análisis por ciudad u operación para referencia de precio.
    // =========================================================================
    {
      entityId: 'market_intelligence.analysis',
      enabled: true,
      priority: 10,

      fieldPolicy: {
        searchable: ['city', 'operation', 'property_type'],
        excluded: ['sample_size'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.city) lines.push(`Ciudad: ${r.city}`)
        if (r.operation) lines.push(OPERATION_LABELS[String(r.operation)] ?? String(r.operation))
        if (r.property_type) lines.push(TYPE_LABELS[String(r.property_type)] ?? String(r.property_type))
        if (!lines.length) return null

        const subtitle = [
          norm(r.city as string),
          OPERATION_LABELS[String(r.operation ?? '')] ?? norm(r.operation as string),
          TYPE_LABELS[String(r.property_type ?? '')] ?? norm(r.property_type as string),
        ].filter(Boolean).join(' · ')

        return {
          text: lines,
          presenter: {
            title: 'Análisis de mercado',
            subtitle: subtitle || undefined,
            icon: 'bar-chart-2',
          },
          links: [{ href: '/backend/market-intelligence', label: 'Ver análisis', kind: 'primary' }],
          checksumSource: {
            city: r.city,
            operation: r.operation,
            property_type: r.property_type,
            created_at: r.created_at,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: 'Análisis de mercado',
          subtitle: [norm(r.city as string), norm(r.operation as string)].filter(Boolean).join(' · ') || undefined,
          icon: 'bar-chart-2',
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> =>
        '/backend/market-intelligence',
    },
  ],
}

export default searchConfig
export const config = searchConfig

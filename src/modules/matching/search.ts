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

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'matching.preference',
      enabled: true,
      priority: 10,

      fieldPolicy: {
        searchable: ['preferred_type', 'preferred_operation', 'preferred_city'],
        excluded: ['max_budget', 'min_area_m2'],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.preferred_type) lines.push(String(r.preferred_type))
        if (r.preferred_operation) lines.push(String(r.preferred_operation))
        if (r.preferred_city) lines.push(String(r.preferred_city))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.preferred_city) ?? undefined) ?? 'Preferred City',
          subtitle: ((norm(r.preferred_type) ?? '') + ' · ' + (norm(r.preferred_operation) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'search',
          badge: (norm(r.preferred_operation) ?? undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/matching', label: 'Ver preferencias', kind: 'primary' }],
          checksumSource: { preferred_city: r.preferred_city, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.preferred_city) ?? undefined) ?? 'Preferred City',
          subtitle: (norm(r.preferred_type) ?? undefined) ?? undefined,
          icon: 'search',
          badge: (norm(r.preferred_operation) ?? undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/matching'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

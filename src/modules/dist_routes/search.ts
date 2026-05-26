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
      entityId: 'dist_routes.dist_route',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: ['name', 'zone', 'city', 'day_of_week', 'status'],
        excluded: [],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.zone) lines.push(String(r.zone))
        if (r.city) lines.push(String(r.city))
        if (r.day_of_week) lines.push(String(r.day_of_week))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.name) ?? undefined) ?? 'Name',
          subtitle: ((norm(r.zone) ?? '') + ' · ' + (norm(r.city) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'map-pin',
          badge: (norm(r.status) ?? undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/dist_routes', label: 'Ver rutas', kind: 'primary' }],
          checksumSource: { name: r.name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name) ?? undefined) ?? 'Name',
          subtitle: (norm(r.zone) ?? undefined) ?? undefined,
          icon: 'map-pin',
          badge: (norm(r.status) ?? undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/dist_routes'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig

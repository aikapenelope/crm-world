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
      entityId: 'enrollment.period',
      enabled: true,
      priority: 15,

      fieldPolicy: {
        searchable: ['name', 'school_year', 'status'],
        excluded: ['enrollment_fee'],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.school_year) lines.push(String(r.school_year))
        if (r.status) lines.push(String(r.status))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.name as string) as string | undefined) ?? 'Name',
          subtitle: ((norm(r.school_year as string) ?? '') + ' · ' + (norm(r.status as string) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'clipboard-list',
          badge: (norm(r.status as string) as string | undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/enrollment', label: 'Ver inscripciones', kind: 'primary' }],
          checksumSource: { name: r.name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name as string) as string | undefined) ?? 'Name',
          subtitle: (norm(r.school_year as string) as string | undefined) ?? undefined,
          icon: 'clipboard-list',
          badge: (norm(r.status as string) as string | undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/enrollment'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig
